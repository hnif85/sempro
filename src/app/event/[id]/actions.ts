"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { calculateAge } from "@/lib/age";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>;
type InvoiceLine = { registrationId: string; amount: number; description: string };

function registerError(eventId: string, type: string, message: string): never {
  redirect(`/event/${eventId}/register?type=${type}&error=${encodeURIComponent(message)}`);
}

function paymentUrl(eventId: string, invoiceId: string) {
  return `/event/${eventId}/payment?invoice=${encodeURIComponent(invoiceId)}`;
}

function getEventNumberIds(formData: FormData) {
  return Array.from(new Set(formData.getAll("event_number_id").map(String).filter(Boolean)));
}

async function requireOpenEvent(admin: AdminClient, eventId: string) {
  const { data: event } = await admin
    .from("events")
    .select("id, name, status")
    .eq("id", eventId)
    .single();

  if (!event) throw new Error("Event tidak ditemukan.");
  if (event.status !== "registration_open") {
    throw new Error("Pendaftaran event belum dibuka atau sudah ditutup.");
  }
}

async function validateEntry(admin: AdminClient, eventId: string, athleteId: string, eventNumberId: string) {
  const [{ data: eventNumber }, { data: athlete }] = await Promise.all([
    admin
      .from("event_numbers")
      .select("id, event_id, fee, gender, max_participants, age_categories(min_age, max_age)")
      .eq("id", eventNumberId)
      .eq("event_id", eventId)
      .single(),
    admin.from("athletes").select("id, name, gender, birth_date, club_id").eq("id", athleteId).single(),
  ]);

  if (!eventNumber || !athlete) throw new Error("Atlet atau nomor lomba tidak valid.");
  if (eventNumber.gender !== "campuran" && eventNumber.gender !== athlete.gender) {
    throw new Error("Gender atlet tidak sesuai dengan nomor lomba.");
  }

  const ageCategory = Array.isArray(eventNumber.age_categories)
    ? eventNumber.age_categories[0]
    : eventNumber.age_categories;
  if (ageCategory && athlete.birth_date) {
    const age = calculateAge(athlete.birth_date);
    if (
      (ageCategory.min_age != null && age < ageCategory.min_age) ||
      (ageCategory.max_age != null && age > ageCategory.max_age)
    ) {
      throw new Error("Umur atlet tidak sesuai kategori nomor lomba.");
    }
  }

  if (eventNumber.max_participants) {
    const { count } = await admin
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("event_number_id", eventNumberId);
    if ((count ?? 0) >= eventNumber.max_participants) {
      throw new Error("Kuota nomor lomba sudah penuh.");
    }
  }

  const { data: duplicate } = await admin
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("athlete_id", athleteId)
    .eq("event_number_id", eventNumberId)
    .maybeSingle();
  if (duplicate) throw new Error("Atlet sudah terdaftar di salah satu nomor yang dipilih.");

  return Number(eventNumber.fee ?? 0);
}

async function validateEntries(admin: AdminClient, eventId: string, athleteId: string, eventNumberIds: string[]) {
  if (eventNumberIds.length === 0) throw new Error("Pilih minimal satu nomor lomba.");
  const entries: { eventNumberId: string; amount: number }[] = [];
  for (const eventNumberId of eventNumberIds) {
    entries.push({ eventNumberId, amount: await validateEntry(admin, eventId, athleteId, eventNumberId) });
  }
  return entries;
}

async function createInvoice(admin: AdminClient, eventId: string, payerUserId: string, clubId: string | null, lines: InvoiceLine[]) {
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .insert({
      event_id: eventId,
      club_id: clubId,
      payer_user_id: payerUserId,
      invoice_number: `INV-${eventId.slice(0, 8)}-${Date.now()}-${randomBytes(3).toString("hex")}`,
      total,
      status: total > 0 ? "awaiting_payment" : "paid",
      paid_at: total === 0 ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) throw new Error(invoiceError?.message ?? "Gagal membuat tagihan.");

  const { error: itemError } = await admin.from("invoice_items").insert(
    lines.map((line) => ({
      invoice_id: invoice.id,
      registration_id: line.registrationId,
      description: line.description,
      amount: line.amount,
    }))
  );
  if (itemError) {
    await admin.from("invoices").delete().eq("id", invoice.id);
    throw new Error(itemError.message);
  }

  return invoice.id as string;
}

async function signInAndContinue(email: string, password: string, eventId: string, invoiceId: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?next=${encodeURIComponent(paymentUrl(eventId, invoiceId))}&error=created`);
  redirect(paymentUrl(eventId, invoiceId));
}

export async function createClubRegistration(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const eventNumberIds = getEventNumberIds(formData);
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const clubName = String(formData.get("club_name") ?? "").trim();
  const picName = String(formData.get("pic_name") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const athleteName = String(formData.get("athlete_name") ?? "").trim();
  const athleteBirthDate = String(formData.get("athlete_birth_date") ?? "") || null;
  const athleteGender = String(formData.get("athlete_gender") ?? "") || null;

  if (!eventId || eventNumberIds.length === 0 || !email || !password || !clubName || !athleteName || !athleteGender) {
    registerError(eventId, "club", "Lengkapi data club, akun, atlet, dan pilih minimal satu nomor lomba.");
  }
  if (password.length < 6) registerError(eventId, "club", "Password minimal 6 karakter.");

  const admin = await createAdminClient();
  try {
    await requireOpenEvent(admin, eventId);
  } catch (error) {
    registerError(eventId, "club", error instanceof Error ? error.message : "Event tidak bisa didaftarkan.");
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "club_manager" },
    user_metadata: { full_name: picName || clubName },
  });
  if (authError || !authData.user) {
    registerError(
      eventId,
      "club",
      authError?.message.includes("already") ? "Email sudah terdaftar. Silakan login untuk melanjutkan." : authError?.message ?? "Gagal membuat akun."
    );
  }

  const userId = authData.user.id;
  let clubId: string | null = null;
  let athleteId: string | null = null;
  let registrationIds: string[] = [];
  let invoiceId: string | null = null;
  try {
    const { data: club, error: clubError } = await admin
      .from("clubs")
      .insert({ name: clubName, pic_name: picName || null, whatsapp: whatsapp || null, city: city || null, status: "complete" })
      .select("id")
      .single();
    if (clubError || !club) throw new Error(clubError?.message ?? "Gagal membuat data club.");
    clubId = club.id;

    const { error: profileError } = await admin.from("profiles").insert({ id: userId, full_name: picName || clubName, role: "club_manager", club_id: clubId });
    if (profileError) throw new Error(profileError.message);

    const { data: athlete, error: athleteError } = await admin
      .from("athletes")
      .insert({ club_id: clubId, name: athleteName, birth_date: athleteBirthDate, gender: athleteGender })
      .select("id")
      .single();
    if (athleteError || !athlete) throw new Error(athleteError?.message ?? "Gagal membuat data atlet.");
    athleteId = athlete.id;

    const entries = await validateEntries(admin, eventId, athlete.id, eventNumberIds);
    const { data: registrations, error: registrationError } = await admin
      .from("registrations")
      .insert(entries.map((entry) => ({ event_id: eventId, club_id: clubId, athlete_id: athlete.id, event_number_id: entry.eventNumberId, status: "draft" })))
      .select("id");
    if (registrationError || !registrations || registrations.length !== entries.length) throw new Error(registrationError?.message ?? "Gagal menyimpan pendaftaran.");
    registrationIds = registrations.map((registration) => registration.id);

    invoiceId = await createInvoice(
      admin,
      eventId,
      userId,
      clubId,
      entries.map((entry, index) => ({ registrationId: registrationIds[index], amount: entry.amount, description: "Pendaftaran nomor lomba" }))
    );
  } catch (error) {
    if (registrationIds.length) await admin.from("registrations").delete().in("id", registrationIds);
    if (athleteId) await admin.from("athletes").delete().eq("id", athleteId);
    if (clubId) await admin.from("clubs").delete().eq("id", clubId);
    await admin.auth.admin.deleteUser(userId);
    registerError(eventId, "club", error instanceof Error ? error.message : "Pendaftaran gagal.");
  }

  if (invoiceId) await signInAndContinue(email, password, eventId, invoiceId);
}

export async function createAthleteRegistration(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const eventNumberIds = getEventNumberIds(formData);
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "") || null;
  const gender = String(formData.get("gender") ?? "") || null;

  if (!eventId || eventNumberIds.length === 0 || !email || !password || !name || !gender || !birthDate) {
    registerError(eventId, "athlete", "Lengkapi data atlet, akun, dan pilih minimal satu nomor lomba.");
  }
  if (password.length < 6) registerError(eventId, "athlete", "Password minimal 6 karakter.");

  const admin = await createAdminClient();
  try {
    await requireOpenEvent(admin, eventId);
  } catch (error) {
    registerError(eventId, "athlete", error instanceof Error ? error.message : "Event tidak bisa didaftarkan.");
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "peserta" },
    user_metadata: { full_name: name },
  });
  if (authError || !authData.user) {
    registerError(
      eventId,
      "athlete",
      authError?.message.includes("already") ? "Email sudah terdaftar. Silakan login untuk melanjutkan." : authError?.message ?? "Gagal membuat akun."
    );
  }

  const userId = authData.user.id;
  let athleteId: string | null = null;
  let registrationIds: string[] = [];
  let invoiceId: string | null = null;
  try {
    const { data: athlete, error: athleteError } = await admin
      .from("athletes")
      .insert({ club_id: null, name, birth_date: birthDate, gender })
      .select("id")
      .single();
    if (athleteError || !athlete) throw new Error(athleteError?.message ?? "Gagal membuat data atlet.");
    athleteId = athlete.id;

    const { error: profileError } = await admin.from("profiles").insert({ id: userId, full_name: name, role: "peserta", athlete_id: athlete.id });
    if (profileError) throw new Error(profileError.message);

    const entries = await validateEntries(admin, eventId, athlete.id, eventNumberIds);
    const { data: registrations, error: registrationError } = await admin
      .from("registrations")
      .insert(entries.map((entry) => ({ event_id: eventId, club_id: null, athlete_id: athlete.id, event_number_id: entry.eventNumberId, status: "draft" })))
      .select("id");
    if (registrationError || !registrations || registrations.length !== entries.length) throw new Error(registrationError?.message ?? "Gagal menyimpan pendaftaran.");
    registrationIds = registrations.map((registration) => registration.id);

    invoiceId = await createInvoice(
      admin,
      eventId,
      userId,
      null,
      entries.map((entry, index) => ({ registrationId: registrationIds[index], amount: entry.amount, description: "Pendaftaran nomor lomba" }))
    );
  } catch (error) {
    if (registrationIds.length) await admin.from("registrations").delete().in("id", registrationIds);
    if (athleteId) await admin.from("athletes").delete().eq("id", athleteId);
    await admin.auth.admin.deleteUser(userId);
    registerError(eventId, "athlete", error instanceof Error ? error.message : "Pendaftaran gagal.");
  }

  if (invoiceId) await signInAndContinue(email, password, eventId, invoiceId);
}

export async function createAuthenticatedRegistration(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const eventNumberIds = getEventNumberIds(formData);
  const selectedAthleteId = String(formData.get("athlete_id") ?? "");
  const newAthleteName = String(formData.get("new_athlete_name") ?? "").trim();
  const newAthleteGender = String(formData.get("new_athlete_gender") ?? "") || null;
  const newAthleteBirthDate = String(formData.get("new_athlete_birth_date") ?? "") || null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/event/${eventId}/register`)}`);

  const admin = await createAdminClient();
  let invoiceId: string | null = null;
  let createdAthleteId: string | null = null;
  let registrationIds: string[] = [];
  try {
    await requireOpenEvent(admin, eventId);
    const { data: profile } = await admin.from("profiles").select("role, club_id, athlete_id").eq("id", user.id).single();
    if (!profile || !["club_manager", "peserta"].includes(profile.role)) throw new Error("Akun ini tidak bisa mendaftar sebagai club atau atlet.");

    let athleteId = profile.role === "peserta" ? profile.athlete_id : selectedAthleteId;
    if (profile.role === "club_manager" && newAthleteName) {
      if (!newAthleteGender) throw new Error("Pilih jenis kelamin atlet baru.");
      const { data: newAthlete, error: newAthleteError } = await admin
        .from("athletes")
        .insert({ club_id: profile.club_id, name: newAthleteName, gender: newAthleteGender, birth_date: newAthleteBirthDate })
        .select("id")
        .single();
      if (newAthleteError || !newAthlete) throw new Error(newAthleteError?.message ?? "Gagal menambah atlet baru.");
      createdAthleteId = newAthlete.id;
      athleteId = newAthlete.id;
    }
    if (!athleteId) throw new Error("Pilih atlet terlebih dahulu atau isi data atlet baru.");

    const { data: athlete } = await admin.from("athletes").select("club_id").eq("id", athleteId).single();
    if (!athlete || (profile.role === "club_manager" && athlete.club_id !== profile.club_id)) throw new Error("Atlet tidak terhubung ke akun ini.");

    const entries = await validateEntries(admin, eventId, athleteId, eventNumberIds);
    const { data: registrations, error: registrationError } = await admin
      .from("registrations")
      .insert(entries.map((entry) => ({ event_id: eventId, club_id: athlete.club_id, athlete_id: athleteId, event_number_id: entry.eventNumberId, status: "draft" })))
      .select("id");
    if (registrationError || !registrations || registrations.length !== entries.length) throw new Error(registrationError?.message ?? "Gagal menyimpan pendaftaran.");
    registrationIds = registrations.map((registration) => registration.id);

    invoiceId = await createInvoice(
      admin,
      eventId,
      user.id,
      athlete.club_id,
      entries.map((entry, index) => ({ registrationId: registrationIds[index], amount: entry.amount, description: "Pendaftaran nomor lomba" }))
    );
  } catch (error) {
    if (registrationIds.length) await admin.from("registrations").delete().in("id", registrationIds);
    if (createdAthleteId) await admin.from("athletes").delete().eq("id", createdAthleteId);
    registerError(eventId, "athlete", error instanceof Error ? error.message : "Pendaftaran gagal.");
  }

  if (invoiceId) {
    revalidatePath(`/event/${eventId}/register`);
    redirect(paymentUrl(eventId, invoiceId));
  }
}

export async function simulatePayment(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(paymentUrl(eventId, invoiceId))}`);

  const admin = await createAdminClient();
  const [{ data: invoice }, { data: profile }] = await Promise.all([
    admin.from("invoices").select("id, event_id, club_id, payer_user_id, total, status").eq("id", invoiceId).eq("event_id", eventId).single(),
    admin.from("profiles").select("club_id").eq("id", user.id).single(),
  ]);
  if (!invoice || (invoice.payer_user_id !== user.id && (!profile?.club_id || profile.club_id !== invoice.club_id))) redirect(`/event/${eventId}?error=invoice`);

  if (invoice.status !== "paid") {
    const { data: existingPayment } = await admin.from("payments").select("id").eq("invoice_id", invoiceId).eq("status", "verified").maybeSingle();
    if (!existingPayment) {
      await admin.from("payments").insert({ invoice_id: invoiceId, method: "qris", amount: invoice.total, status: "verified", verified_by: user.id });
    }
    await admin.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", invoiceId);
  }

  revalidatePath(`/event/${eventId}/payment`);
  redirect(`${paymentUrl(eventId, invoiceId)}&success=1`);
}
