import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateAthlete, deleteAthlete } from "../actions";

export default async function EditAthletePage({
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
        <h1 className="text-2xl font-semibold">Ubah Atlet</h1>
        <p className="text-zinc-500">{athlete.clubs?.name}</p>
      </div>

      <form action={updateAthlete} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
        <input type="hidden" name="id" value={id} />
        {isAdmin && (
          <div>
            <label className="mb-1 block text-sm font-medium">Club *</label>
            <select
              name="club_id"
              required
              defaultValue={athlete.club_id}
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
            defaultValue={athlete.name}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Jenis Kelamin</label>
            <select
              name="gender"
              defaultValue={athlete.gender ?? ""}
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
              defaultValue={athlete.birth_date ?? ""}
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

      <form action={deleteAthlete} className="rounded-xl border border-red-200 bg-red-50 p-4">
        <input type="hidden" name="id" value={id} />
        <p className="mb-2 text-sm font-medium text-red-700">Hapus atlet ini</p>
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Hapus Atlet
        </button>
      </form>
    </div>
  );
}