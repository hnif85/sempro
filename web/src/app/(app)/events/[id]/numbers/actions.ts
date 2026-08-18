"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createEventNumber(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") ?? "");
  const name = String(formData.get("name") ?? "");
  const styleId = String(formData.get("style_id") ?? "") || null;
  const distanceId = String(formData.get("distance_id") ?? "") || null;
  const gender = String(formData.get("gender") ?? "");
  const ageCategoryId = String(formData.get("age_category_id") ?? "") || null;
  const maxParticipants = Number(formData.get("max_participants") ?? 0) || null;
  const fee = Number(formData.get("fee") ?? 0) || 0;

  const { error } = await supabase.from("event_numbers").insert({
    event_id: eventId,
    name,
    style_id: styleId,
    distance_id: distanceId,
    gender,
    age_category_id: ageCategoryId,
    max_participants: maxParticipants,
    fee,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}/numbers`);
  redirect(`/events/${eventId}/numbers`);
}

export async function updateEventNumber(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");

  const { error } = await supabase
    .from("event_numbers")
    .update({
      name: String(formData.get("name") ?? ""),
      style_id: String(formData.get("style_id") ?? "") || null,
      distance_id: String(formData.get("distance_id") ?? "") || null,
      gender: String(formData.get("gender") ?? ""),
      age_category_id: String(formData.get("age_category_id") ?? "") || null,
      max_participants: Number(formData.get("max_participants") ?? 0) || null,
      fee: Number(formData.get("fee") ?? 0) || 0,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}/numbers`);
  redirect(`/events/${eventId}/numbers`);
}

export async function deleteEventNumber(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");
  await supabase.from("event_numbers").delete().eq("id", id);
  revalidatePath(`/events/${eventId}/numbers`);
  redirect(`/events/${eventId}/numbers`);
}