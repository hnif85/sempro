import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAthlete } from "../actions";

export default async function NewAthletePage() {
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
  const { data: clubs } = isAdmin
    ? await supabase.from("clubs").select("id, name").order("name")
    : { data: null };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tambah Atlet</h1>
        <p className="text-zinc-500">Input data atlet satu per satu</p>
      </div>

      <form action={createAthlete} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
        {isAdmin && (
          <div>
            <label className="mb-1 block text-sm font-medium">Club *</label>
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
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Nama Atlet *</label>
          <input
            name="name"
            required
            placeholder="Nama lengkap atlet"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Jenis Kelamin</label>
            <select
              name="gender"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Pilih…</option>
              <option value="putra">Putra</option>
              <option value="putri">Putri</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tanggal Lahir</label>
            <input
              name="birth_date"
              type="date"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Simpan
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