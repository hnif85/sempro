"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function assignOfficial(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");

  if (eventId && userId) {
    const { error } = await supabase
      .from("event_officials")
      .upsert({ event_id: eventId, user_id: userId }, { onConflict: "event_id,user_id" });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}

export async function removeOfficial(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") ?? "");
  const id = String(formData.get("id") ?? "");

  if (id) {
    const { error } = await supabase.from("event_officials").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}
