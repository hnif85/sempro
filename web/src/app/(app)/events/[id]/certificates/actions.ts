"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function generateCertificates(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") ?? "");

  // Participants: all finalized registrations
  const { data: registrations } = await supabase
    .from("registrations")
    .select("id, athlete_id")
    .eq("event_id", eventId)
    .eq("status", "finalized");

  for (const r of registrations ?? []) {
    const { data: existing } = await supabase
      .from("certificates")
      .select("id")
      .eq("registration_id", r.id)
      .eq("cert_type", "peserta");
    if (existing && existing.length > 0) continue;

    await supabase.from("certificates").insert({
      event_id: eventId,
      athlete_id: r.athlete_id,
      registration_id: r.id,
      cert_type: "peserta",
      title: "Sertifikat Peserta",
      qr_token: randomBytes(16).toString("hex"),
    });
  }

  // Champions: athletes with place 1-3
  const { data: entries } = await supabase
    .from("heat_entries")
    .select("place, registrations(athlete_id, event_number_id, id)")
    .eq("registrations.event_id", eventId)
    .in("place", [1, 2, 3]);

  const medalNames = ["Juara 1", "Juara 2", "Juara 3"];
  for (const e of entries ?? []) {
    const reg = e.registrations as unknown as {
      athlete_id: string;
      event_number_id: string;
      id: string;
    };
    if (!reg) continue;

    const { data: existing } = await supabase
      .from("certificates")
      .select("id")
      .eq("registration_id", reg.id)
      .eq("cert_type", "juara");
    if (existing && existing.length > 0) continue;

    await supabase.from("certificates").insert({
      event_id: eventId,
      athlete_id: reg.athlete_id,
      registration_id: reg.id,
      cert_type: "juara",
      title: "Sertifikat Juara",
      place: e.place,
      qr_token: randomBytes(16).toString("hex"),
    });
  }

  void medalNames;
  revalidatePath(`/events/${eventId}/certificates`);
  redirect(`/events/${eventId}/certificates`);
}