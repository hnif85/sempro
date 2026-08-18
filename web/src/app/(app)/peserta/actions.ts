"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registerPeserta(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") ?? "");
  const eventNumberId = String(formData.get("event_number_id") ?? "");
  const seedTime = String(formData.get("seed_time") ?? "") || null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("athlete_id")
    .eq("id", user.id)
    .single();
  const athleteId = profile?.athlete_id;
  if (!athleteId) throw new Error("Akun belum terhubung ke data atlet");

  const { data: athlete } = await supabase
    .from("athletes")
    .select("club_id")
    .eq("id", athleteId)
    .single();

  const { error } = await supabase.from("registrations").insert({
    event_id: eventId,
    club_id: athlete?.club_id,
    athlete_id: athleteId,
    event_number_id: eventNumberId,
    seed_time: seedTime,
    status: "draft",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/peserta");
  redirect("/peserta?registered=1");
}
