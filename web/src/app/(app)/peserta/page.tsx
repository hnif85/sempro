import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerPeserta } from "./actions";

export default async function PesertaPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, athletes(*, clubs(name))")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "peserta") redirect("/dashboard");

  const athleteId = profile.athlete_id;

  if (!athleteId) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold">Profil Peserta</h1>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
          Akun ini belum terhubung ke data atlet. Hubungi panitia untuk
          menghubungkan akun Anda dengan data atlet.
        </p>
      </div>
    );
  }

  const { data: results } = await supabase
    .from("athlete_results")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("result_time");

  const { data: openEvents } = await supabase
    .from("events")
    .select("*, event_numbers(id, name, fee)")
    .eq("status", "registration_open")
    .order("start_date");

  const openEventsList = (openEvents ?? []) as unknown as {
    id: string;
    name: string;
    start_date: string | null;
    location: string | null;
    event_numbers: { id: string; name: string; fee: number | null }[] | null;
  }[];

  const pbByNumber = new Map<string, NonNullable<typeof results>>();
  for (const r of results ?? []) {
    const key = r.number_name ?? "?";
    if (!pbByNumber.has(key)) pbByNumber.set(key, []);
    pbByNumber.get(key)!.push(r);
  }
  const pbs = Array.from(pbByNumber.entries()).map(([name, list]) => ({
    name,
    list,
  }));
  const totalMedals = results?.filter((r) => r.place && r.place <= 3).length ?? 0;
  const totalEvents = new Set((results ?? []).map((r) => r.event_id)).size;

  const athlete = profile.athletes;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Halo, {athlete?.name ?? profile.full_name}</h1>
        <p className="text-zinc-500">
          {athlete?.clubs?.name ?? "-"} ·{" "}
          {athlete?.gender ? <span className="capitalize">{athlete.gender}</span> : "-"} ·{" "}
          {athlete?.birth_date ?? "-"}
        </p>
      </div>

      {sp.registered && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Pendaftaran berhasil diajukan. Menunggu verifikasi panitia.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Total Event</p>
          <p className="mt-1 text-2xl font-semibold">{totalEvents}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Total Nomor</p>
          <p className="mt-1 text-2xl font-semibold">
            {new Set((results ?? []).map((r) => r.number_name)).size}
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-sm text-amber-700">Total Medali</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">{totalMedals}</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold">Personal Best</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left">
            <tr>
              <th className="px-6 py-3 font-medium">Nomor</th>
              <th className="px-6 py-3 font-medium">Waktu Terbaik</th>
              <th className="px-6 py-3 font-medium">Event</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {pbs.map((pb) => (
              <tr key={pb.name}>
                <td className="px-6 py-3 font-medium">{pb.name}</td>
                <td className="px-6 py-3">{pb.list[0]?.result_time}</td>
                <td className="px-6 py-3 text-zinc-500">{pb.list[0]?.event_name}</td>
              </tr>
            ))}
            {pbs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-zinc-400">
                  Belum ada hasil tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold">Riwayat Lomba</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {(results ?? []).map((r, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium">{r.number_name}</p>
                <p className="text-sm text-zinc-500">{r.event_name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{r.result_time}</p>
                <p className="text-sm text-zinc-500">{r.place ? `Juara ${r.place}` : "-"}</p>
              </div>
            </div>
          ))}
          {(results ?? []).length === 0 && (
            <p className="px-6 py-8 text-center text-zinc-400">Belum ada riwayat lomba.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold">Event Terbuka — Daftar</h2>
        </div>
        <div className="space-y-4 p-6">
          {openEventsList.map((event) => (
            <div key={event.id} className="rounded-lg border border-zinc-100 p-4">
              <p className="font-semibold">{event.name}</p>
              <p className="text-sm text-zinc-500">
                {event.start_date ?? "-"} · {event.location ?? "-"}
              </p>
              <form action={registerPeserta} className="mt-4 flex flex-wrap items-end gap-3">
                <input type="hidden" name="event_id" value={event.id} />
                <div className="min-w-[200px] flex-1">
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    Nomor Lomba
                  </label>
                  <select
                    name="event_number_id"
                    required
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">Pilih nomor…</option>
                    {(event.event_numbers ?? []).map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                        {Number(n.fee) > 0 ? ` — Rp ${Number(n.fee).toLocaleString("id-ID")}` : " (Gratis)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    Seed Time (opsional)
                  </label>
                  <input
                    name="seed_time"
                    placeholder="00:32.10"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Daftar
                </button>
              </form>
            </div>
          ))}
          {openEventsList.length === 0 && (
            <p className="text-sm text-zinc-400">Belum ada event yang dibuka pendaftarannya.</p>
          )}
        </div>
      </div>
    </div>
  );
}
