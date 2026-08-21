"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEventManager } from "@/lib/event-access";

export async function createRegistration(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const athleteId = String(formData.get("athlete_id") ?? "");
  const eventNumberId = String(formData.get("event_number_id") ?? "");
  const seedTime = String(formData.get("seed_time") ?? "") || null;
  const { supabase } = await requireEventManager(eventId);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, club_id")
    .eq("id", user?.id)
    .single();

  // Determine club: explicit (admin) or own (club manager)
  const explicitClubId = String(formData.get("club_id") ?? "") || null;
  const clubId = explicitClubId || profile?.club_id;

  if (!clubId) throw new Error("Club harus ditentukan");

  // Validate: age category, gender, kuota
  const { data: eventNumber } = await supabase
    .from("event_numbers")
    .select("*, age_categories(min_age, max_age)")
    .eq("id", eventNumberId)
    .single();

  const { data: athlete } = await supabase
    .from("athletes")
    .select("birth_date, gender")
    .eq("id", athleteId)
    .single();

  if (eventNumber?.gender && eventNumber.gender !== "campuran") {
    if (athlete?.gender !== eventNumber.gender) {
      redirect(`/events/${eventId}/registrations?error=gender`);
    }
  }

  if (eventNumber?.age_categories && athlete?.birth_date) {
    const age = Math.floor(
      (Date.now() - new Date(athlete.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000)
    );
    const min = eventNumber.age_categories.min_age;
    const max = eventNumber.age_categories.max_age;
    if ((min != null && age < min) || (max != null && age > max)) {
      redirect(`/events/${eventId}/registrations?error=age`);
    }
  }

  if (eventNumber?.max_participants) {
    const { count } = await supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("event_number_id", eventNumberId);
    if ((count ?? 0) >= eventNumber.max_participants) {
      redirect(`/events/${eventId}/registrations?error=quota`);
    }
  }

  const { error } = await supabase.from("registrations").insert({
    event_id: eventId,
    club_id: clubId,
    athlete_id: athleteId,
    event_number_id: eventNumberId,
    seed_time: seedTime,
    status: "draft",
  });

  if (error) {
    if (error.code === "23505") {
      redirect(`/events/${eventId}/registrations?error=duplicate`);
    }
    throw new Error(error.message);
  }

  revalidatePath(`/events/${eventId}/registrations`);
  redirect(`/events/${eventId}/registrations`);
}

export async function finalizeRegistrations(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const ids = JSON.parse(String(formData.get("ids") ?? "[]")) as string[];
  const { user } = await requireEventManager(eventId);

  const admin = await createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["super_admin", "admin_event"].includes(profile.role)) {
    throw new Error("Hanya admin event yang dapat memfinalisasi registrasi.");
  }

  if (ids.length > 0) {
    await admin
      .from("registrations")
      .update({ status: "finalized" })
      .in("id", ids);
  }

  // Generate invoice per club for finalized registrations without invoice
  const { data: regs } = await admin
    .from("registrations")
    .select("id, club_id, event_number_id, event_numbers(fee)")
    .eq("event_id", eventId)
    .eq("status", "finalized");

  const finalizedIds = (regs ?? []).map((r) => r.id);
  const { data: fetchedInvoicedItems } = finalizedIds.length
    ? await admin.from("invoice_items").select("registration_id").in("registration_id", finalizedIds)
    : { data: null };
  const invoicedItems = fetchedInvoicedItems ?? [];
  const invoicedIds = new Set((invoicedItems ?? []).map((item) => item.registration_id));

  const byClub = new Map<string, { clubId: string | null; items: { id: string; fee: number }[] }>();
  for (const r of regs ?? []) {
    if (invoicedIds.has(r.id)) continue;
    const key = r.club_id ?? "individual";
    const group = byClub.get(key) ?? {
      clubId: r.club_id,
      items: [] as { id: string; fee: number }[],
    };
    const en = Array.isArray(r.event_numbers) ? r.event_numbers[0] : r.event_numbers;
    group.items.push({ id: r.id, fee: Number(en?.fee ?? 0) });
    byClub.set(key, group);
  }

  for (const [, group] of byClub) {
    const total = group.items.reduce((s, i) => s + i.fee, 0);
    const invoiceNumber = `INV-${eventId.slice(0, 8)}-${Date.now()}-${(group.clubId ?? "individual").slice(0, 4)}`;

    const { data: invoice } = await admin
      .from("invoices")
      .insert({
        event_id: eventId,
        club_id: group.clubId,
        invoice_number: invoiceNumber,
        total,
        status: total > 0 ? "awaiting_payment" : "paid",
        paid_at: total === 0 ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (invoice) {
      const itemRows = group.items.map((i) => ({
        invoice_id: invoice.id,
        registration_id: i.id,
        amount: i.fee,
      }));
      await admin.from("invoice_items").insert(itemRows);
    }
  }

  revalidatePath(`/events/${eventId}/registrations`);
  redirect(`/events/${eventId}/registrations`);
}

export async function deleteRegistration(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const id = String(formData.get("id") ?? "");
  const { supabase } = await requireEventManager(eventId);
  await supabase.from("registrations").delete().eq("id", id);
  revalidatePath(`/events/${eventId}/registrations`);
  redirect(`/events/${eventId}/registrations`);
}
