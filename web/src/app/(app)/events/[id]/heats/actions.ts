"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireEventManager, requireTechnicalEventAccess } from "@/lib/event-access";

export async function generateHeats(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const scheduleItemId = String(formData.get("schedule_item_id") ?? "");
  const { supabase } = await requireEventManager(eventId);

  const { data: event } = await supabase
    .from("events")
    .select("lanes_count")
    .eq("id", eventId)
    .single();

  const lanes = event?.lanes_count ?? 6;

  const { data: existing } = await supabase
    .from("heats")
    .select("id")
    .eq("schedule_item_id", scheduleItemId);
  if (existing && existing.length > 0) {
    redirect(`/events/${eventId}/heats?error=exists`);
  }

  const { data: scheduleItem } = await supabase
    .from("schedule_items")
    .select("event_number_id")
    .eq("id", scheduleItemId)
    .single();

  const eventNumberId = scheduleItem?.event_number_id;
  const regs = eventNumberId
    ? await supabase
        .from("registrations")
        .select("id, seed_time")
        .eq("event_id", eventId)
        .eq("event_number_id", eventNumberId)
        .eq("status", "finalized")
        .order("seed_time", { ascending: true, nullsFirst: false })
        .then((res) => res.data ?? [])
    : [];

  const totalHeats = Math.max(1, Math.ceil(regs.length / lanes));

  for (let h = 0; h < totalHeats; h++) {
    const { data: heat } = await supabase
      .from("heats")
      .insert({
        schedule_item_id: scheduleItemId,
        heat_number: h + 1,
        status: "dns",
      })
      .select()
      .single();

    if (!heat) continue;

    const laneRegs = regs.slice(h * lanes, (h + 1) * lanes);
    const entries = laneRegs.map((r, idx) => ({
      heat_id: heat.id,
      registration_id: r.id,
      lane: idx + 1,
      seed_time: r.seed_time,
    }));
    if (entries.length > 0) {
      await supabase.from("heat_entries").insert(entries);
    }
  }

  revalidatePath(`/events/${eventId}/heats`);
  redirect(`/events/${eventId}/heats`);
}

export async function finalizeDNS(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const ids = JSON.parse(String(formData.get("ids") ?? "[]")) as string[];
  const { supabase } = await requireTechnicalEventAccess(eventId);

  if (ids.length > 0) {
    await supabase.from("heats").update({ status: "dnt" }).in("id", ids);
  }

  revalidatePath(`/events/${eventId}/heats`);
  redirect(`/events/${eventId}/heats`);
}

export async function addHeat(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const scheduleItemId = String(formData.get("schedule_item_id") ?? "");
  const { supabase } = await requireEventManager(eventId);

  const { data: lastHeat } = await supabase
    .from("heats")
    .select("heat_number")
    .eq("schedule_item_id", scheduleItemId)
    .order("heat_number", { ascending: false })
    .limit(1)
    .single();

  const nextHeat = (lastHeat?.heat_number ?? 0) + 1;
  const { error } = await supabase.from("heats").insert({
    schedule_item_id: scheduleItemId,
    heat_number: nextHeat,
    status: "dns",
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}/heats`);
  redirect(`/events/${eventId}/heats`);
}

export async function deleteHeat(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const id = String(formData.get("id") ?? "");
  const { supabase } = await requireEventManager(eventId);
  await supabase.from("heats").delete().eq("id", id);
  revalidatePath(`/events/${eventId}/heats`);
  redirect(`/events/${eventId}/heats`);
}
