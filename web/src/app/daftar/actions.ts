"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

function err(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
}

export async function registerClub(formData: FormData) {
  const admin = await createAdminClient();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const picName = String(formData.get("pic_name") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const school = String(formData.get("school") ?? "").trim();

  if (!name || !email || !password) {
    err("/daftar?tab=club", "Nama club, email, dan password wajib diisi.");
  }
  if (password.length < 6) {
    err("/daftar?tab=club", "Password minimal 6 karakter.");
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "club_manager" },
    user_metadata: { full_name: picName || name },
  });
  if (authError) {
    err("/daftar?tab=club", authError.message);
  }
  const userId = authData.user?.id;
  if (!userId) err("/daftar?tab=club", "Gagal membuat akun.");

  const token = randomBytes(12).toString("hex");

  const cityName = String(formData.get("loc_city_name") ?? "").trim();

  const { data: club, error: clubError } = await admin
    .from("clubs")
    .insert({
      name,
      pic_name: picName || null,
      whatsapp: whatsapp || null,
      city: cityName || city || null,
      school: school || null,
      token,
      status: "draft",
      destination_id: Number(formData.get("loc_destination_id") ?? 0) || null,
      province_name: String(formData.get("loc_province_name") ?? "").trim() || null,
      city_name: cityName || null,
      district_name: String(formData.get("loc_district_name") ?? "").trim() || null,
      subdistrict_name: String(formData.get("loc_subdistrict_name") ?? "").trim() || null,
      zip_code: String(formData.get("loc_zip_code") ?? "").trim() || null,
    })
    .select("id")
    .single();
  if (clubError) {
    err("/daftar?tab=club", clubError.message);
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    full_name: picName || name,
    role: "club_manager",
    club_id: club.id,
  });
  if (profileError) {
    err("/daftar?tab=club", profileError.message);
  }

  redirect(`/daftar?tab=club&success=1&token=${token}`);
}

export async function registerPeserta(formData: FormData) {
  const admin = await createAdminClient();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "") || null;
  const gender = String(formData.get("gender") ?? "") || null;
  const clubId = String(formData.get("club_id") ?? "") || null;

  if (!name || !email || !password) {
    err("/daftar?tab=peserta", "Nama, email, dan password wajib diisi.");
  }
  if (password.length < 6) {
    err("/daftar?tab=peserta", "Password minimal 6 karakter.");
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "peserta" },
    user_metadata: { full_name: name },
  });
  if (authError) {
    err("/daftar?tab=peserta", authError.message);
  }
  const userId = authData.user?.id;
  if (!userId) err("/daftar?tab=peserta", "Gagal membuat akun.");

  const { data: athlete, error: athleteError } = await admin
    .from("athletes")
    .insert({
      club_id: clubId,
      name,
      birth_date: birthDate,
      gender,
    })
    .select("id")
    .single();
  if (athleteError) {
    err("/daftar?tab=peserta", athleteError.message);
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    full_name: name,
    role: "peserta",
    athlete_id: athlete.id,
    club_id: clubId,
  });
  if (profileError) {
    err("/daftar?tab=peserta", profileError.message);
  }

  redirect("/daftar?tab=peserta&success=1");
}
