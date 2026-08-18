import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { importAthletes } from "../actions";

export default async function ImportAthletesPage() {
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
  if (!isAdmin) redirect("/athletes");

  const { data: clubs } = await supabase.from("clubs").select("id, name").order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Import Data Atlet</h1>
        <p className="text-zinc-500">Upload template Excel / tempel data</p>
      </div>

      <form action={importAthletes} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Pilih Club *</label>
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
          <label className="mb-1 block text-sm font-medium">Data Atlet</label>
          <textarea
            name="data"
            rows={10}
            required
            placeholder={"Format per baris:\nNama Atlet<TAB>Putra/Putri<TAB>Tanggal Lahir (YYYY-MM-DD)\n\nContoh:\nAndi Wijaya\tPutra\t2015-03-01\nBudi Santoso\tPutra\t2014-07-15\nCici Lestari\tPutri\t2016-01-20"}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none"
          />
        </div>
        <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
          Dari Excel: pilih kolom, salin (Ctrl+C), lalu tempel (Ctrl+V). Pastikan pemisah tab
          atau koma. Kolom wajib hanya <b>Nama</b>.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Import
          </button>
          <Link
            href="/athletes"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}