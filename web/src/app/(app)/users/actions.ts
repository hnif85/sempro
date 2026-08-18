"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createUser(formData: FormData) {
  const admin = await createAdminClient();
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const role = String(formData.get("role") ?? "club_manager");
  const clubId = String(formData.get("club_id") ?? "") || null;
  const athleteId = String(formData.get("athlete_id") ?? "") || null;

  // Admin creates the auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name: fullName },
  });

  if (authError) throw new Error(authError.message);

  const userId = authData.user?.id;
  if (!userId) throw new Error("Gagal membuat user");

  const { error } = await admin.from("profiles").insert({
    id: userId,
    full_name: fullName,
    role,
    club_id: clubId,
    athlete_id: athleteId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(formData: FormData) {
  const admin = await createAdminClient();
  const id = String(formData.get("id") ?? "");

  await admin.from("profiles").update({
    full_name: String(formData.get("full_name") ?? ""),
    role: String(formData.get("role") ?? "club_manager"),
    club_id: String(formData.get("club_id") ?? "") || null,
    athlete_id: String(formData.get("athlete_id") ?? "") || null,
  }).eq("id", id);

  revalidatePath("/users");
  redirect("/users");
}

export async function deactivateUser(formData: FormData) {
  const admin = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  await admin.auth.admin.updateUserById(id, { ban_duration: "876000h" });
  revalidatePath("/users");
  redirect("/users");
}

export async function activateUser(formData: FormData) {
  const admin = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  await admin.auth.admin.updateUserById(id, { ban_duration: "none" });
  revalidatePath("/users");
  redirect("/users");
}

export async function resetPassword(formData: FormData) {
  const admin = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  if (newPassword) {
    await admin.auth.admin.updateUserById(id, { password: newPassword });
  }
  revalidatePath("/users");
  redirect("/users");
}