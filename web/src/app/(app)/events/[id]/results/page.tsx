import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResultInputForm from "./result-input-form";

type ResultEntry = {
  id: string;
  lane: number | null;
  result_time: string | null;
  place: number | null;
  status: string | null;
  registrations: {
    athletes: { id: string | null; name: string | null } | null;
    clubs: { name: string | null } | null;
  } | null;
};

type ResultHeat = {
  id: string;
  schedule_item_id: string;
  heat_number: number | null;
  heat_entries: ResultEntry[] | null;
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role;
  const isAdmin = role === "super_admin" || role === "admin_event";
  const isOfficial = role === "official";

  let officialAssigned = false;
  if (isOfficial) {
    const { data: assigned } = await supabase
      .from("event_officials")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id);
    officialAssigned = Boolean(assigned && assigned.length > 0);
    if (!officialAssigned) redirect("/events");
  }

  const canManage = isAdmin || officialAssigned;

  const { data: event } = await supabase.from("events").select("name").eq("id", id).single();
  if (!event) notFound();

  const { data: scheduleItems } = await supabase
    .from("schedule_items")
    .select("*, event_numbers(name, gender, swimming_styles(name), distances(meters))")
    .eq("event_id", id)
    .order("acara_number");

  const scheduleIds = (scheduleItems ?? []).map((s) => s.id);

  let heatsQuery = supabase
    .from("heats")
    .select(
      "*, schedule_item_id, heat_entries(id, lane, result_time, place, status, registrations(*, athletes(name), clubs(name)))"
    );
  if (scheduleIds.length > 0) {
    heatsQuery = heatsQuery.in("schedule_item_id", scheduleIds);
  } else {
    heatsQuery = heatsQuery.eq("schedule_item_id", "00000000-0000-0000-0000-000000000000");
  }
  const { data: heats } = await heatsQuery.order("heat_number");
  const heatsList = (heats ?? []) as unknown as ResultHeat[];

  // Aggregate medal tally
  const medals: Record<string, { gold: number; silver: number; bronze: number }> = {};
  const medalMap: Record<string, string> = {};
  for (const h of heatsList) {
    for (const e of h.heat_entries ?? []) {
      if (!e.place || e.status === "dns") continue;
      const athleteName = e.registrations?.athletes?.name ?? "?";
      const key = e.registrations?.athletes?.id ?? `ath-${e.id}`;
      medalMap[key] = athleteName;
      if (!medals[key]) medals[key] = { gold: 0, silver: 0, bronze: 0 };
      if (e.place === 1) medals[key].gold += 1;
      if (e.place === 2) medals[key].silver += 1;
      if (e.place === 3) medals[key].bronze += 1;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/events/${id}`} className="text-sm text-primary hover:underline">
          ← {event.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Hasil & Ranking</h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold">Input Waktu Timer</h2>
        </div>
        <div className="space-y-4 p-6">
          {(scheduleItems ?? []).map((item) => {
            const itemHeats = heatsList.filter((h) => h.schedule_item_id === item.id);
            return (
              <div key={item.id} className="rounded-lg border border-zinc-200">
                <div className="border-b border-zinc-100 px-4 py-3">
                  <p className="font-medium">
                    Acara {item.acara_number} — {item.event_numbers?.name ?? "-"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {item.event_numbers?.swimming_styles?.name ?? "-"} ·{" "}
                    {item.event_numbers?.distances ? `${item.event_numbers.distances.meters}m` : "-"}{" "}
                    · {item.event_numbers?.gender ?? "-"}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {itemHeats.map((heat) => (
                    <div key={heat.id} className="rounded-lg border border-zinc-100 p-2">
                      <p className="px-4 py-2 text-sm font-semibold">Seri {heat.heat_number}</p>
                      {canManage ? (
                        <ResultInputForm
                          heatId={heat.id}
                          eventId={id}
                          entries={(heat.heat_entries ?? []).map((e) => ({
                            id: e.id,
                            athlete: e.registrations?.athletes?.name ?? "-",
                            lane: e.lane ?? 0,
                            result_time: e.result_time ?? "",
                            status: e.status ?? "",
                          }))}
                        />
                      ) : (
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-zinc-50">
                            {(heat.heat_entries ?? []).map((e) => (
                              <tr key={e.id}>
                                <td className="px-4 py-2">{e.lane}</td>
                                <td className="px-4 py-2 font-medium">
                                  {e.registrations?.athletes?.name ?? "-"}
                                </td>
                                <td className="px-4 py-2">{e.result_time ?? "-"}</td>
                                <td className="px-4 py-2">
                                  {e.place ? `#${e.place}` : ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                  {itemHeats.length === 0 && (
                    <p className="px-4 py-4 text-sm text-zinc-400">
                      Belum ada heat. Generate heat di menu Heat & Seeding.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {(scheduleItems ?? []).length === 0 && (
            <p className="text-sm text-zinc-400">Buat susunan acara terlebih dahulu.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold">Rekap Medali</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left">
            <tr>
              <th className="px-6 py-3 font-medium">Atlet</th>
              <th className="px-6 py-3 font-medium text-center">🥇</th>
              <th className="px-6 py-3 font-medium text-center">🥈</th>
              <th className="px-6 py-3 font-medium text-center">🥉</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {Object.entries(medals)
              .sort((a, b) => b[1].gold - a[1].gold || b[1].silver - a[1].silver)
              .map(([key, m]) => (
                <tr key={key}>
                  <td className="px-6 py-3 font-medium">{medalMap[key]}</td>
                  <td className="px-6 py-3 text-center">{m.gold}</td>
                  <td className="px-6 py-3 text-center">{m.silver}</td>
                  <td className="px-6 py-3 text-center">{m.bronze}</td>
                </tr>
              ))}
            {Object.keys(medals).length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-400">
                  Belum ada hasil.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}