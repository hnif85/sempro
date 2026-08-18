"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createScheduleItem(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") ?? "");
  const eventNumberId = String(formData.get("event_number_id") ?? "");
  const acaraNumber = Number(formData.get("acara_number") ?? 0);

  const { error } = await supabase.from("schedule_items").insert({
    event_id: eventId,
    event_number_id: eventNumberId,
    acara_number: acaraNumber,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}/schedule`);
  redirect(`/events/${eventId}/schedule`);
}

export async function updateScheduleItem(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");

  const { error } = await supabase
    .from("schedule_items")
    .update({
      event_number_id: String(formData.get("event_number_id") ?? ""),
      acara_number: Number(formData.get("acara_number") ?? 0),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}/schedule`);
  redirect(`/events/${eventId}/schedule`);
}

export async function deleteScheduleItem(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");
  await supabase.from("schedule_items").delete().eq("id", id);
  revalidatePath(`/events/${eventId}/schedule`);
  redirect(`/events/${eventId}/schedule`);
}

export async function generateSchedule(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") ?? "");

  const { data: numbers } = await supabase
    .from("event_numbers")
    .select("id")
    .eq("event_id", eventId)
    .order("name");

  if (!numbers || numbers.length === 0) {
    redirect(`/events/${eventId}/schedule?error=nonumbers`);
  }

  const { data: existing } = await supabase
    .from("schedule_items")
    .select("id")
    .eq("event_id", eventId);

  if (existing && existing.length > 0) {
    redirect(`/events/${eventId}/schedule?error=exists`);
  }

  const rows = numbers.map((n, i) => ({
    event_id: eventId,
    event_number_id: n.id,
    acara_number: i + 1,
  }));

  const { error } = await supabase.from("schedule_items").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}/schedule`);
  redirect(`/events/${eventId}/schedule`);
}