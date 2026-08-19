"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userId = formData.get("user_id") as string;
  if (userId !== user.id) {
    return { error: "Unauthorized" };
  }

  const fullName = (formData.get("full_name") as string)?.trim();
  const birthDate = (formData.get("birth_date") as string) || null;
  const gender = (formData.get("gender") as string) || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const province = (formData.get("province") as string)?.trim() || null;
  const postalCode = (formData.get("postal_code") as string)?.trim() || null;

  if (!fullName) {
    return { error: "Nama lengkap wajib diisi" };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      birth_date: birthDate,
      gender,
      phone,
      address,
      city,
      province,
      postal_code: postalCode,
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Gagal memperbarui profil: " + profileError.message };
  }

  return { success: true };
}