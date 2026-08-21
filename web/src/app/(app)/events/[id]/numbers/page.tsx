import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createEventNumber,
  updateEventNumber,
  deleteEventNumber,
} from "./actions";

export default async function EventNumbersPage({
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
  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin_event";
  if (profile?.role === "official") {
    const { data: assignment } = await supabase.from("event_officials").select("id").eq("event_id", id).eq("user_id", user.id).maybeSingle();
    if (!assignment) redirect("/events");
  }

  const { data: event } = await supabase.from("events").select("name").eq("id", id).single();
  if (!event) notFound();

  const { data: numbers } = await supabase
    .from("event_numbers")
    .select("*, swimming_styles(name), distances(meters), age_categories(name)")
    .eq("event_id", id)
    .order("name");

  const { data: styles } = await supabase.from("swimming_styles").select("*").order("name");
  const { data: distances } = await supabase.from("distances").select("*").order("meters");
  const { data: categories } = await supabase.from("age_categories").select("*").order("name");

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/events/${id}`} className="text-sm text-primary hover:underline">
          ← {event.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Nomor Lomba</h1>
      </div>

      {isAdmin && (
        <form action={createEventNumber} className="rounded-xl border border-zinc-200 bg-white p-6">
          <input type="hidden" name="event_id" value={id} />
          <h2 className="mb-4 text-base font-semibold">Tambah Nomor</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-4">
              <label className="mb-1 block text-sm font-medium">Nama Nomor *</label>
              <input
                name="name"
                required
                placeholder="Contoh: 50m Gaya Bebas Putra KU10"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Gaya</label>
              <select
                name="style_id"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">—</option>
                {(styles ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Jarak</label>
              <select
                name="distance_id"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">—</option>
                {(distances ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.meters}m
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Gender</label>
              <select
                name="gender"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="putra">Putra</option>
                <option value="putri">Putri</option>
                <option value="campuran">Campuran</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kategori Umur</label>
              <select
                name="age_category_id"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">—</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Maks Peserta</label>
              <input
                name="max_participants"
                type="number"
                min={0}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Biaya (Rp)</label>
              <input
                name="fee"
                type="number"
                min={0}
                defaultValue={0}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Tambah
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Nomor</th>
              <th className="px-4 py-3 font-medium">Gaya</th>
              <th className="px-4 py-3 font-medium">Jarak</th>
              <th className="px-4 py-3 font-medium">Gender</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Biaya</th>
              {isAdmin && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(numbers ?? []).map((n) => (
              <tr key={n.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">{n.name}</td>
                <td className="px-4 py-3">{n.swimming_styles?.name ?? "-"}</td>
                <td className="px-4 py-3">{n.distances ? `${n.distances.meters}m` : "-"}</td>
                <td className="px-4 py-3 capitalize">{n.gender}</td>
                <td className="px-4 py-3">{n.age_categories?.name ?? "-"}</td>
                <td className="px-4 py-3">
                  {Number(n.fee) > 0 ? `Rp ${Number(n.fee).toLocaleString("id-ID")}` : "Gratis"}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <details className="relative">
                        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700">
                          Ubah
                        </summary>
                        <div className="absolute right-0 z-10 mt-1 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg">
                          <form action={updateEventNumber} className="space-y-3">
                            <input type="hidden" name="id" value={n.id} />
                            <input type="hidden" name="event_id" value={id} />
                            <input
                              name="name"
                              defaultValue={n.name}
                              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select name="style_id" defaultValue={n.style_id ?? ""}>
                                <option value="">Gaya</option>
                                {(styles ?? []).map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                              <select name="distance_id" defaultValue={n.distance_id ?? ""}>
                                <option value="">Jarak</option>
                                {(distances ?? []).map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.meters}m
                                  </option>
                                ))}
                              </select>
                              <select name="gender" defaultValue={n.gender}>
                                <option value="putra">Putra</option>
                                <option value="putri">Putri</option>
                                <option value="campuran">Campuran</option>
                              </select>
                              <select name="age_category_id" defaultValue={n.age_category_id ?? ""}>
                                <option value="">Kategori</option>
                                {(categories ?? []).map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <input
                              name="fee"
                              type="number"
                              defaultValue={n.fee}
                              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                            />
                            <button
                              type="submit"
                              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                            >
                              Simpan
                            </button>
                          </form>
                        </div>
                      </details>
                      <form action={deleteEventNumber}>
                        <input type="hidden" name="id" value={n.id} />
                        <input type="hidden" name="event_id" value={id} />
                        <button className="text-xs text-red-600 hover:underline">Hapus</button>
                      </form>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {(numbers ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                  Belum ada nomor lomba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
