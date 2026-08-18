import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/age";

export default async function AthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string; imported?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin_event";

  let query = supabase
    .from("athletes")
    .select("*, clubs(name)")
    .order("name");

  if (!isAdmin && profile?.club_id) {
    query = query.eq("club_id", profile.club_id);
  }
  if (params.club) {
    query = query.eq("club_id", params.club);
  }

  const { data: athletes } = await query;
  const { data: clubs } = await supabase.from("clubs").select("id, name").order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Data Atlet</h1>
          <p className="text-zinc-500">Kelola atlet peserta</p>
        </div>
        <Link
            href="/athletes/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Tambah Atlet
          </Link>
      </div>

      {params.imported && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          Berhasil import {params.imported} atlet.
        </p>
      )}

      {isAdmin && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-3 text-base font-semibold">Import Atlet (Excel / TSV)</h2>
          <form action="/athletes/import" className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Pilih Club</label>
              <select
                name="club_id"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Pilih club…</option>
                {(clubs ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Data (satu atlet per baris)</label>
              <textarea
                name="data"
                rows={6}
                required
                placeholder={"Format: Nama[TAB]JK[TAB]TanggalLahir\nContoh:\nAndi\tPutra\t2015-03-01\nBudi\tPutra\t2014-07-15"}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Import
            </button>
          </form>
          <p className="mt-2 text-xs text-zinc-400">
            Excel: ekspor sheet jadi tab-separated, atau tempel langsung dengan tab/pemisah koma.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Club</th>
              <th className="px-4 py-3 font-medium">JK</th>
              <th className="px-4 py-3 font-medium">Tanggal Lahir</th>
              <th className="px-4 py-3 font-medium">Umur</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(athletes ?? []).map((a) => {
              const age = a.birth_date ? calculateAge(a.birth_date) : null;
              return (
                <tr key={a.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3">{a.clubs?.name ?? "-"}</td>
                  <td className="px-4 py-3 capitalize">{a.gender ?? "-"}</td>
                  <td className="px-4 py-3">{a.birth_date ?? "-"}</td>
                  <td className="px-4 py-3">{age !== null ? `${age} th` : "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/athletes/${a.id}/profile`} className="mr-3 text-primary hover:underline">
                      Riwayat
                    </Link>
                    <Link href={`/athletes/${a.id}`} className="text-primary hover:underline">
                      Ubah
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(athletes ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  Belum ada atlet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}