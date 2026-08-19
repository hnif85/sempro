import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Result = {
  event_id: string;
  number_name: string | null;
  result_time: string | null;
  place: number | null;
  event_name: string | null;
};

export type ParticipantEvent = {
  id: string;
  name: string;
  start_date: string | null;
  location: string | null;
  event_numbers: { id: string; name: string; fee: number | null }[] | null;
};

export type PesertaProfile = {
  full_name: string | null;
  role: string;
  club_id: string | null;
  athlete_id: string | null;
  gender: string | null;
  birth_date: string | null;
  clubs: { id: string; name: string | null } | null;
};

export async function loadPesertaData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, clubs(name)")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "peserta") redirect("/dashboard");

  const athleteId = profile?.athlete_id ?? null;

  let results: Result[] = [];
  let openEvents: ParticipantEvent[] = [];

  if (athleteId) {
    const [{ data: rawResults }, { data: rawOpen }] = await Promise.all([
      supabase.from("athlete_results").select("*").eq("athlete_id", athleteId).order("result_time"),
      supabase
        .from("events")
        .select("*, event_numbers(id, name, fee)")
        .eq("status", "registration_open")
        .order("start_date"),
    ]);
    results = (rawResults ?? []) as Result[];
    openEvents = (rawOpen ?? []) as unknown as ParticipantEvent[];
  }

  const pbByNumber = new Map<string, Result[]>();
  for (const result of results) {
    const key = result.number_name ?? "Nomor lomba";
    if (!pbByNumber.has(key)) pbByNumber.set(key, []);
    pbByNumber.get(key)!.push(result);
  }

  const pbs = Array.from(pbByNumber.entries()).map(([name, list]) => ({ name, list }));
  const totalMedals = results.filter((r) => r.place && r.place <= 3).length;
  const totalEvents = new Set(results.map((r) => r.event_id)).size;
  const totalNumbers = new Set(results.map((r) => r.number_name)).size;
  const best = pbs[0]?.list[0];
  const achievements = results.filter((r) => r.place && r.place <= 3);

  return {
    user,
    profile: profile as unknown as PesertaProfile | null,
    athleteId,
    results,
    openEvents,
    pbs,
    best,
    achievements,
    totalMedals,
    totalEvents,
    totalNumbers,
  };
}
