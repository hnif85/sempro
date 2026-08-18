import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ScheduleItem = {
  id: string;
  acara_number: number | null;
  event_numbers: {
    id: string;
    name: string | null;
    gender: string | null;
    swimming_styles: { name: string | null }[] | { name: string | null } | null;
    distances: { meters: number | null }[] | { meters: number | null } | null;
    age_categories: { name: string | null }[] | { name: string | null } | null;
  } | null;
};

type HeatEntry = {
  id: string;
  lane: number | null;
  seed_time: string | null;
  result_time: string | null;
  place: number | null;
  status: string | null;
  registrations: {
    athletes: { name: string | null } | null;
    clubs: { name: string | null } | null;
  } | null;
};

type Heat = {
  id: string;
  schedule_item_id: string;
  heat_number: number | null;
  status: string | null;
  heat_entries: HeatEntry[] | null;
};

export default async function PrintResultsPage({
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

  const { data: event } = await supabase
    .from("events")
    .select("*, sponsors(*)")
    .eq("id", id)
    .single();
  if (!event) notFound();

  const { data: schedule } = await supabase
    .from("schedule_items")
    .select(
      "id, acara_number, event_numbers(id, name, gender, swimming_styles(name), distances(meters), age_categories(name))"
    )
    .eq("event_id", id)
    .order("acara_number");
  const scheduleItems = (schedule ?? []) as unknown as ScheduleItem[];

  const { data: heats } = await supabase
    .from("heats")
    .select(
      "id, schedule_item_id, heat_number, status, heat_entries(id, lane, seed_time, result_time, place, status, registrations(athletes(name), clubs(name)))"
    )
    .in(
      "schedule_item_id",
      scheduleItems.length
        ? scheduleItems.map((s) => s.id)
        : ["00000000-0000-0000-0000-000000000000"]
    )
    .order("heat_number");
  const heatsList = (heats ?? []) as unknown as Heat[];

  const heatsBySchedule = heatsList.reduce((acc, h) => {
    acc[h.schedule_item_id] ??= [];
    acc[h.schedule_item_id].push(h);
    return acc;
  }, {} as Record<string, Heat[]>);

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="no-print flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hasil Acara</h1>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Cetak / PDF
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-10 print:border-0 print:p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold uppercase">{event.name}</h1>
          <p className="text-zinc-600">
            Hasil Acara · {event.start_date ?? ""} · {event.location ?? ""}
          </p>
        </div>

        {(scheduleItems).map((s) => {
          const itemHeats = heatsBySchedule[s.id] ?? [];
          const hasResults = itemHeats.some((h) =>
            (h.heat_entries ?? []).some((e) => e.result_time)
          );
          if (!hasResults) return null;

          return (
            <div key={s.id} className="mb-8 break-before-page">
              <h2 className="mb-1 font-semibold">
                Acara {s.acara_number} — {s.event_numbers?.name}
              </h2>
              <p className="mb-3 text-sm text-zinc-500">
                {Array.isArray(s.event_numbers?.swimming_styles)
                  ? s.event_numbers.swimming_styles[0]?.name
                  : s.event_numbers?.swimming_styles?.name ?? "-"}{" "}
                ·{" "}
                {Array.isArray(s.event_numbers?.distances)
                  ? s.event_numbers.distances[0]
                    ? `${s.event_numbers.distances[0].meters}m`
                    : "-"
                  : s.event_numbers?.distances
                    ? `${s.event_numbers.distances.meters}m`
                    : "-"}{" "}
                · {s.event_numbers?.gender} ·{" "}
                {Array.isArray(s.event_numbers?.age_categories)
                  ? s.event_numbers.age_categories[0]?.name
                  : s.event_numbers?.age_categories?.name ?? "-"}
              </p>

              {itemHeats.map((h) => (
                <div key={h.id} className="mb-6">
                  <p className="mb-1 text-sm font-medium">Seri {h.heat_number}</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-zinc-800">
                        <th className="py-1.5 text-left">Rank</th>
                        <th className="py-1.5 text-left">Lint</th>
                        <th className="py-1.5 text-left">Nama Atlet</th>
                        <th className="py-1.5 text-left">Club</th>
                        <th className="py-1.5 text-left">Seed</th>
                        <th className="py-1.5 text-left">Hasil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(h.heat_entries ?? [])
                        .filter((e) => e.result_time && e.status !== "dns")
                        .sort((a, b) => (a.place ?? 999) - (b.place ?? 999))
                        .map((e) => (
                          <tr key={e.id} className="border-b border-zinc-100">
                            <td className="py-1.5">{e.place ?? "-"}</td>
                            <td className="py-1.5">{e.lane}</td>
                            <td className="py-1.5 font-medium">
                              {e.registrations?.athletes?.name ?? "-"}
                            </td>
                            <td className="py-1.5">{e.registrations?.clubs?.name ?? "-"}</td>
                            <td className="py-1.5">{e.seed_time ?? "-"}</td>
                            <td className="py-1.5 font-medium">{e.result_time}</td>
                          </tr>
                        ))}
                      {(h.heat_entries ?? []).filter((e) => e.status === "dns").length > 0 && (
                        <tr>
                          <td colSpan={6} className="py-1.5 text-zinc-500">
                            DNS:{" "}
                            {(h.heat_entries ?? [])
                              .filter((e) => e.status === "dns")
                              .map((e) => e.registrations?.athletes?.name)
                              .join(", ")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}