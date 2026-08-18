import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AthleteProfilePage({
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

  const { data: athlete } = await supabase
    .from("athletes")
    .select("*, clubs(name)")
    .eq("id", id)
    .single();
  if (!athlete) notFound();

  // Riwayat hasil lintas event
  const { data: results } = await supabase
    .from("athlete_results")
    .select("*")
    .eq("athlete_id", id)
    .order("result_time");

  // Personal best: hasil terbaik per nomor
  const pbByNumber = new Map<string, NonNullable<typeof results>>();
  for (const r of results ?? []) {
    const key = r.number_name ?? "?";
    if (!pbByNumber.has(key)) pbByNumber.set(key, []);
    pbByNumber.get(key)!.push(r);
  }

  const pbs = Array.from(pbByNumber.entries())
    .map(([name, list]) => ({ name, list }))
    .filter((p) => p.list.length > 0);

  const totalMedals =
    results?.filter((r) => r.place && r.place <= 3).length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/athletes" className="text-sm text-primary hover:underline">
          ← Data Atlet
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{athlete.name}</h1>
        <p className="text-zinc-500">
          {athlete.clubs?.name ?? "-"} · {athlete.gender ? (
            <span className="capitalize">{athlete.gender}</span>
          ) : (
            "-"
          )}{" "}
          · {athlete.birth_date ?? "-"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Total Event</p>
          <p className="mt-1 text-2xl font-semibold">
            {new Set((results ?? []).map((r) => r.event_id)).size}
          </p>
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
          <h2 className="text-base font-semibold">Riwayat Prestasi</h2>
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
                <p className="text-sm text-zinc-500">
                  {r.place ? `Juara ${r.place}` : "-"}
                </p>
              </div>
            </div>
          ))}
          {(results ?? []).length === 0 && (
            <p className="px-6 py-8 text-center text-zinc-400">
              Belum ada riwayat prestasi.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}