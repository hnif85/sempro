"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function registerAthlete(formData: FormData) {
  const athleteId = String(formData.get("athlete_id") ?? "");
  const eventNumberId = String(formData.get("event_number_id") ?? "");
  const seedTime = String(formData.get("seed_time") ?? "") || null;
  const clubId = String(formData.get("club_id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");
  const token = String(formData.get("token") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.from("registrations").insert({
    event_id: eventId,
    club_id: clubId,
    athlete_id: athleteId,
    event_number_id: eventNumberId,
    seed_time: seedTime,
    status: "draft",
  });

  const base = `/client/register?token=${encodeURIComponent(token)}&event=${eventId}`;
  if (error) {
    redirect(`${base}&error=${encodeURIComponent(error.code ?? "unknown")}`);
  }
  redirect(`${base}&success=1`);
}