"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createAthlete(formData: FormData) {
  const supabase = await createClient();
  const clubId = String(formData.get("club_id") ?? "");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, club_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id)
    .single();

  const effectiveClubId = clubId || profile?.club_id;

  if (!effectiveClubId) throw new Error("Club harus dipilih");

  const { error } = await supabase.from("athletes").insert({
    club_id: effectiveClubId,
    name: String(formData.get("name") ?? ""),
    birth_date: String(formData.get("birth_date") ?? "") || null,
    gender: String(formData.get("gender") ?? "") || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/athletes");
  redirect("/athletes");
}

export async function updateAthlete(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase
    .from("athletes")
    .update({
      name: String(formData.get("name") ?? ""),
      birth_date: String(formData.get("birth_date") ?? "") || null,
      gender: String(formData.get("gender") ?? "") || null,
      club_id: String(formData.get("club_id") ?? "") || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/athletes");
  redirect("/athletes");
}

export async function deleteAthlete(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("athletes").delete().eq("id", id);
  revalidatePath("/athletes");
  redirect("/athletes");
}

export async function importAthletes(formData: FormData) {
  const supabase = await createClient();
  const clubId = String(formData.get("club_id") ?? "");
  const raw = String(formData.get("data") ?? "");

  if (!clubId) throw new Error("Club harus dipilih");
  if (!raw.trim()) throw new Error("Data kosong");

  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows = lines.map((line) => line.split(/[\t,;]/).map((c) => c.trim()));

  const insertRows = [];
  for (const row of rows) {
    const [name, gender, birthDate] = row;
    if (!name) continue;
    insertRows.push({
      club_id: clubId,
      name,
      gender: gender?.toLowerCase().startsWith("p") && !gender?.toLowerCase().startsWith("pu")
        ? "putri"
        : gender?.toLowerCase().startsWith("pu") || gender?.toLowerCase().startsWith("l")
          ? "putra"
          : null,
      birth_date: birthDate || null,
    });
  }

  if (insertRows.length === 0) throw new Error("Tidak ada data valid");

  const { error } = await supabase.from("athletes").insert(insertRows);
  if (error) throw new Error(error.message);

  revalidatePath("/athletes");
  redirect("/athletes?imported=" + insertRows.length);
}