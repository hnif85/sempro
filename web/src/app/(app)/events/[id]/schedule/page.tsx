import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  generateSchedule,
} from "./actions";

export default async function SchedulePage({
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

  const { data: event } = await supabase.from("events").select("name").eq("id", id).single();
  if (!event) notFound();

  const { data: items } = await supabase
    .from("schedule_items")
    .select("*, event_numbers(name, gender, swimming_styles(name), distances(meters))")
    .eq("event_id", id)
    .order("acara_number");

  const { data: numbers } = await supabase
    .from("event_numbers")
    .select("id, name")
    .eq("event_id", id)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/events/${id}`} className="text-sm text-primary hover:underline">
          ← {event.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Susunan Acara</h1>
        <p className="text-zinc-500">Urutan perlombaan</p>
      </div>

      {sp.error === "nonumbers" && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Belum ada nomor lomba. Tambahkan nomor lomba terlebih dahulu.
        </p>
      )}
      {sp.error === "exists" && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Susunan acara sudah dibuat.
        </p>
      )}

      {(items ?? []).length === 0 && (
        <form action={generateSchedule} className="rounded-xl border border-dashed border-zinc-300 p-8 text-center">
          <input type="hidden" name="event_id" value={id} />
          <p className="mb-4 text-zinc-500">
            Belum ada susunan acara. Buat otomatis dari seluruh nomor lomba.
          </p>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Generate Susunan Acara
          </button>
        </form>
      )}

      <form action={createScheduleItem} className="rounded-xl border border-zinc-200 bg-white p-6">
        <input type="hidden" name="event_id" value={id} />
        <h2 className="mb-4 text-base font-semibold">Tambah Acara</h2>
        <div className="flex gap-3">
          <div className="w-24">
            <label className="mb-1 block text-sm font-medium">Nomor</label>
            <input
              name="acara_number"
              type="number"
              min={1}
              required
              placeholder="1"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Nomor Lomba</label>
            <select
              name="event_number_id"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Pilih nomor lomba…</option>
              {(numbers ?? []).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Tambah
            </button>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Acara</th>
              <th className="px-4 py-3 font-medium">Nomor Lomba</th>
              <th className="px-4 py-3 font-medium">JK</th>
              <th className="px-4 py-3 font-medium">Gaya</th>
              <th className="px-4 py-3 font-medium">Jarak</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(items ?? []).map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">Acara {item.acara_number}</td>
                <td className="px-4 py-3">{item.event_numbers?.name ?? "-"}</td>
                <td className="px-4 py-3 capitalize">{item.event_numbers?.gender ?? "-"}</td>
                <td className="px-4 py-3">{item.event_numbers?.swimming_styles?.name ?? "-"}</td>
                <td className="px-4 py-3">
                  {item.event_numbers?.distances ? `${item.event_numbers.distances.meters}m` : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <details className="relative inline-block">
                    <summary className="mr-3 cursor-pointer text-xs text-zinc-500 hover:text-zinc-700">
                      Ubah
                    </summary>
                    <div className="absolute right-0 z-10 mt-1 w-72 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg">
                      <form action={updateScheduleItem} className="space-y-3">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="event_id" value={id} />
                        <input
                          name="acara_number"
                          type="number"
                          defaultValue={item.acara_number}
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                        />
                        <select
                          name="event_number_id"
                          defaultValue={item.event_number_id}
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                        >
                          {(numbers ?? []).map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                        >
                          Simpan
                        </button>
                      </form>
                    </div>
                  </details>
                  <form action={deleteScheduleItem} className="inline">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="event_id" value={id} />
                    <button className="text-xs text-red-600 hover:underline">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}