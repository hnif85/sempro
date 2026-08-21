import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateHeats, addHeat } from "./actions";
import DNTButton from "./dnt-button";
import { getEventRole } from "@/lib/event-access";

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

export default async function HeatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase.from("events").select("name, lanes_count").eq("id", id).single();
  if (!event) notFound();
  const { role, officialAssigned } = await getEventRole(id);
  const isAdmin = role === "super_admin" || role === "admin_event";
  const isOfficial = role === "official" && officialAssigned;
  if (!isAdmin && !isOfficial) redirect("/events");

  const { data: scheduleItems } = await supabase
    .from("schedule_items")
    .select("*, event_numbers(name, gender, swimming_styles(name), distances(meters))")
    .eq("event_id", id)
    .order("acara_number");

  let heatsQuery = supabase
    .from("heats")
    .select("*, schedule_item_id, heat_entries(*, registrations(*, athletes(name), clubs(name)))");

  const scheduleItemIds = (scheduleItems ?? []).map((s) => s.id);
  if (scheduleItemIds.length > 0) {
    heatsQuery = heatsQuery.in("schedule_item_id", scheduleItemIds);
  } else {
    heatsQuery = heatsQuery.eq("schedule_item_id", "00000000-0000-0000-0000-000000000000");
  }

  const { data: heats } = await heatsQuery.order("heat_number");
  const heatsList = (heats ?? []) as unknown as Heat[];

  const dnsIds = heatsList.filter((h) => h.status === "dns").map((h) => h.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/events/${id}`} className="text-sm text-primary hover:underline">
          ← {event.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Heat & Seeding</h1>
        <p className="text-zinc-500">
          Kelompok / seri / lintasan · {event.lanes_count} lintasan
        </p>
      </div>

      {sp.error === "exists" && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Heat untuk acara ini sudah dibuat.
        </p>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Rekap Heat</h2>
        <DNTButton ids={dnsIds} eventId={id} />
      </div>

      <div className="space-y-6">
        {(scheduleItems ?? []).map((item) => {
          const itemHeats = heatsList.filter((h) => h.schedule_item_id === item.id);
          return (
            <div key={item.id} className="rounded-xl border border-zinc-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-6 py-4">
                <div>
                  <p className="font-semibold">
                    Acara {item.acara_number} — {item.event_numbers?.name ?? "-"}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {item.event_numbers?.swimming_styles?.name ?? "-"} ·{" "}
                    {item.event_numbers?.distances
                      ? `${item.event_numbers.distances.meters}m`
                      : "-"}{" "}
                    · {item.event_numbers?.gender ?? "-"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {itemHeats.length === 0 && isAdmin && (
                    <form action={generateHeats}>
                      <input type="hidden" name="event_id" value={id} />
                      <input type="hidden" name="schedule_item_id" value={item.id} />
                      <button className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                        Generate Heat
                      </button>
                    </form>
                  )}
                  {itemHeats.length > 0 && isAdmin && (
                    <form action={addHeat}>
                      <input type="hidden" name="event_id" value={id} />
                      <input type="hidden" name="schedule_item_id" value={item.id} />
                      <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                        Tambah Seri
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {itemHeats.length > 0 && (
                <div className="grid gap-4 p-6 md:grid-cols-2">
                  {itemHeats.map((heat) => (
                    <div key={heat.id} className="rounded-lg border border-zinc-200">
                      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2">
                        <p className="text-sm font-semibold">Seri {heat.heat_number}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            heat.status === "dnt"
                              ? "bg-green-100 text-green-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {heat.status?.toUpperCase()}
                        </span>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs text-zinc-500">
                          <tr>
                            <th className="px-4 py-2 font-medium">Lint</th>
                            <th className="px-4 py-2 font-medium">Atlet</th>
                            <th className="px-4 py-2 font-medium">Club</th>
                            <th className="px-4 py-2 font-medium">Seed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {(heat.heat_entries ?? []).map((entry) => (
                            <tr key={entry.id}>
                              <td className="px-4 py-2">{entry.lane}</td>
                              <td className="px-4 py-2 font-medium">
                                {entry.registrations?.athletes?.name ?? "-"}
                              </td>
                              <td className="px-4 py-2 text-zinc-500">
                                {entry.registrations?.clubs?.name ?? "-"}
                              </td>
                              <td className="px-4 py-2">{entry.seed_time ?? "-"}</td>
                            </tr>
                          ))}
                          {(heat.heat_entries ?? []).length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-4 text-center text-zinc-400">
                                Kosong
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {itemHeats.length === 0 && (
                <p className="px-6 py-6 text-sm text-zinc-400">
                  Belum ada heat untuk acara ini.
                </p>
              )}
            </div>
          );
        })}

        {(scheduleItems ?? []).length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-400">
            Buat susunan acara terlebih dahulu.
          </div>
        )}
      </div>
    </div>
  );
}
