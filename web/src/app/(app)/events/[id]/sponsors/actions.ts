"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSponsor(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") ?? "");

  const { error } = await supabase.from("sponsors").insert({
    event_id: eventId,
    name: String(formData.get("name") ?? ""),
    logo_url: String(formData.get("logo_url") ?? "") || null,
    position: Number(formData.get("position") ?? 1) || 1,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}/sponsors`);
  redirect(`/events/${eventId}/sponsors`);
}

export async function deleteSponsor(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") ?? "");
  const id = String(formData.get("id") ?? "");
  await supabase.from("sponsors").delete().eq("id", id);
  revalidatePath(`/events/${eventId}/sponsors`);
  redirect(`/events/${eventId}/sponsors`);
}