"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTechnicalEventAccess } from "@/lib/event-access";

function timeToSeconds(t: string): number | null {
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length === 2) {
    const m = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    if (isNaN(m) || isNaN(s)) return null;
    return m * 60 + s;
  }
  const s = parseFloat(t);
  return isNaN(s) ? null : s;
}

export async function saveResults(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const heatId = String(formData.get("heat_id") ?? "");
  const entries = JSON.parse(String(formData.get("entries") ?? "[]")) as {
    id: string;
    result_time: string;
    status: string;
  }[];
  const { supabase } = await requireTechnicalEventAccess(eventId);

  const { data: heat } = await supabase
    .from("heats")
    .select("*, heat_entries(id, result_time, status)")
    .eq("id", heatId)
    .single();

  if (!heat) throw new Error("Heat tidak ditemukan");

  // Update times
  const heatEntries = (heat.heat_entries ?? []) as unknown as {
    id: string;
    result_time: string | null;
    status: string | null;
  }[];
  for (const e of entries) {
    const entry = heatEntries.find((x) => x.id === e.id);
    if (!entry) continue;

    const status =
      e.status === "dns" ? "dns" : e.status === "hadir" ? "hadir" : e.status;

    const { error } = await supabase
      .from("heat_entries")
      .update({
        result_time: e.result_time || null,
        status,
      })
      .eq("id", e.id);
    if (error) throw new Error(error.message);
  }

  // Re-fetch updated entries and compute ranking
  const { data: updated } = await supabase
    .from("heat_entries")
    .select("id")
    .eq("heat_id", heatId);

  const ranked = (updated ?? [])
    .map((u) => u.id)
    .filter((id) => {
      const e = heatEntries.find((x) => x.id === id);
      const t = e?.result_time ?? "";
      return t && e?.status !== "dns";
    });

  // Fetch all entries with times for ranking across heats of this schedule item
  const { data: allEntries } = await supabase
    .from("heat_entries")
    .select("id, result_time, status")
    .in(
      "heat_id",
      heat.schedule_item_id
        ? await supabase.from("heats").select("id").eq("schedule_item_id", heat.schedule_item_id).then((r) => r.data?.map((h) => h.id) ?? [])
        : []
    );

  const timed = (allEntries ?? [])
    .filter((e) => e.result_time && e.status !== "dns")
    .sort((a, b) => {
      const ta = timeToSeconds(a.result_time!) ?? Infinity;
      const tb = timeToSeconds(b.result_time!) ?? Infinity;
      return ta - tb;
    });

  timed.forEach((e, i) => {
    // update place
    void supabase.from("heat_entries").update({ place: i + 1 }).eq("id", e.id);
  });

  void ranked;
  revalidatePath(`/events/${eventId}/results`);
  redirect(`/events/${eventId}/results`);
}

export async function updateEntryStatus(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "registered");
  const { supabase } = await requireTechnicalEventAccess(eventId);

  await supabase.from("heat_entries").update({ status }).eq("id", id);
  revalidatePath(`/events/${eventId}/results`);
  redirect(`/events/${eventId}/results`);
}
