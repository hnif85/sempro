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

type Sponsor = {
  id: string;
  name: string | null;
  logo_url: string | null;
};

export default async function PrintBookPage({
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
      "id, schedule_item_id, heat_number, status, heat_entries(id, lane, seed_time, registrations(athletes(name), clubs(name)))"
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
        <h1 className="text-2xl font-semibold">Buku Acara</h1>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Cetak / PDF
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-10 print:border-0 print:p-6">
        {/* Cover */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
            SEMP
          </div>
          <h1 className="text-3xl font-bold uppercase">{event.name}</h1>
          <p className="mt-2 text-lg">
            {event.start_date ?? "-"}
            {event.end_date ? ` — ${event.end_date}` : ""}
          </p>
          <p className="text-zinc-600">{event.location ?? ""}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {event.organizer ?? "Penyelenggara"}
          </p>

          {event.sponsors && event.sponsors.length > 0 && (
            <div className="mt-8">
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-400">
                Didukung oleh
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {((event.sponsors ?? []) as unknown as Sponsor[]).map((s) => (
                  <div key={s.id} className="text-center">
                    <div className="flex h-12 w-24 items-center justify-center rounded-lg border border-zinc-200 text-xs text-zinc-400">
                      {s.logo_url ? "Logo" : s.name}
                    </div>
                    <p className="mt-1 text-xs">{s.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="break-before-page">
          <h2 className="mb-4 text-xl font-semibold uppercase">Susunan Acara</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-zinc-800">
                <th className="py-2 text-left font-semibold">Acara</th>
                <th className="py-2 text-left font-semibold">Nomor</th>
                <th className="py-2 text-left font-semibold">Gaya</th>
                <th className="py-2 text-left font-semibold">Jarak</th>
                <th className="py-2 text-left font-semibold">JK</th>
                <th className="py-2 text-left font-semibold">Kategori</th>
              </tr>
            </thead>
            <tbody>
              {scheduleItems.map((s) => (
                <tr key={s.id} className="border-b border-zinc-200">
                  <td className="py-2">Acara {s.acara_number}</td>
                  <td className="py-2 font-medium">{s.event_numbers?.name}</td>
                  <td className="py-2">
                    {Array.isArray(s.event_numbers?.swimming_styles)
                      ? s.event_numbers.swimming_styles[0]?.name
                      : s.event_numbers?.swimming_styles?.name ?? "-"}
                  </td>
                  <td className="py-2">
                    {Array.isArray(s.event_numbers?.distances)
                      ? s.event_numbers.distances[0]
                        ? `${s.event_numbers.distances[0].meters}m`
                        : "-"
                      : s.event_numbers?.distances
                        ? `${s.event_numbers.distances.meters}m`
                        : "-"}
                  </td>
                  <td className="py-2 capitalize">{s.event_numbers?.gender}</td>
                  <td className="py-2">
                    {Array.isArray(s.event_numbers?.age_categories)
                      ? s.event_numbers.age_categories[0]?.name
                      : s.event_numbers?.age_categories?.name ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="break-before-page">
          <h2 className="mb-4 text-xl font-semibold uppercase">Heat Sheet</h2>
          {scheduleItems.map((s) => {
            const itemHeats = heatsBySchedule[s.id] ?? [];
            if (itemHeats.length === 0) return null;
            return (
              <div key={s.id} className="mb-8">
                <h3 className="mb-2 font-semibold">
                  Acara {s.acara_number} — {s.event_numbers?.name}
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-400">
                      <th className="py-1.5 text-left">Seri</th>
                      <th className="py-1.5 text-left">Lintasan</th>
                      <th className="py-1.5 text-left">Nama Atlet</th>
                      <th className="py-1.5 text-left">Club</th>
                      <th className="py-1.5 text-left">Seed Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemHeats.map((h) =>
                      (h.heat_entries ?? []).map((e) => (
                        <tr key={e.id} className="border-b border-zinc-100">
                          <td className="py-1.5">{h.heat_number}</td>
                          <td className="py-1.5">{e.lane}</td>
                          <td className="py-1.5">{e.registrations?.athletes?.name ?? "-"}</td>
                          <td className="py-1.5">{e.registrations?.clubs?.name ?? "-"}</td>
                          <td className="py-1.5">{e.seed_time ?? "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}