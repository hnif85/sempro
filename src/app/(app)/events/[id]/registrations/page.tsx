import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createRegistration, deleteRegistration } from "./actions";
import FinalizeButton from "./finalize-button";

export default async function RegistrationsPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, club_id")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin_event";

  const { data: event } = await supabase.from("events").select("name").eq("id", id).single();
  if (!event) notFound();

  let regQuery = supabase
    .from("registrations")
    .select("*, athletes(name, gender, birth_date), clubs(name), event_numbers(name, fee)")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  if (!isAdmin && profile?.club_id) {
    regQuery = regQuery.eq("club_id", profile.club_id);
  }
  const { data: regs } = await regQuery;

  const { data: athletes } = await supabase
    .from("athletes")
    .select("*, clubs(name)")
    .eq("club_id", profile?.club_id ?? "00000000-0000-0000-0000-000000000000")
    .order("name");

  const { data: numbers } = await supabase
    .from("event_numbers")
    .select("id, name, fee")
    .eq("event_id", id)
    .order("name");

  const { data: clubs } = await supabase.from("clubs").select("id, name").order("name");

  const errors: Record<string, string> = {
    gender: "Gender atlet tidak sesuai dengan nomor lomba.",
    age: "Umur atlet tidak sesuai kategori.",
    quota: "Kuota nomor lomba sudah penuh.",
    duplicate: "Atlet sudah terdaftar di nomor ini.",
  };

  const draftIds = (regs ?? []).filter((r) => r.status === "draft").map((r) => r.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/events/${id}`} className="text-sm text-primary hover:underline">
          ← {event.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Registrasi</h1>
        <p className="text-zinc-500">Daftarkan atlet ke nomor perlombaan</p>
      </div>

      {sp.error && errors[sp.error] && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          {errors[sp.error]}
        </p>
      )}

      <form action={createRegistration} className="rounded-xl border border-zinc-200 bg-white p-6">
        <input type="hidden" name="event_id" value={id} />
        <h2 className="mb-4 text-base font-semibold">Registrasi Baru</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {isAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium">Club</label>
              <select
                name="club_id"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Club saya</option>
                {(clubs ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={isAdmin ? "" : "md:col-span-2"}>
            <label className="mb-1 block text-sm font-medium">Atlet *</label>
            <select
              name="athlete_id"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Pilih atlet…</option>
              {(athletes ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.clubs?.name ?? "Tanpa club"}
                </option>
              ))}
            </select>
          </div>
          <div className={isAdmin ? "" : "md:col-span-2"}>
            <label className="mb-1 block text-sm font-medium">Nomor Lomba *</label>
            <select
              name="event_number_id"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Pilih nomor…</option>
              {(numbers ?? []).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                  {Number(n.fee) > 0 ? ` — Rp ${Number(n.fee).toLocaleString("id-ID")}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Seed Time (opsional)</label>
            <input
              name="seed_time"
              placeholder="Contoh: 34.21"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Daftarkan
            </button>
          </div>
        </div>
      </form>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Daftar Pendaftaran ({regs?.length ?? 0})</h2>
        <FinalizeButton ids={draftIds} eventId={id} />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Atlet</th>
              <th className="px-4 py-3 font-medium">Club</th>
              <th className="px-4 py-3 font-medium">Nomor</th>
              <th className="px-4 py-3 font-medium">Biaya</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(regs ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">{r.athletes?.name ?? "-"}</td>
                <td className="px-4 py-3">{r.clubs?.name ?? "-"}</td>
                <td className="px-4 py-3">{r.event_numbers?.name ?? "-"}</td>
                <td className="px-4 py-3">
                  {Number(r.event_numbers?.fee ?? 0) > 0
                    ? `Rp ${Number(r.event_numbers?.fee).toLocaleString("id-ID")}`
                    : "Gratis"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize">
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteRegistration} className="inline">
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="event_id" value={id} />
                    <button className="text-xs text-red-600 hover:underline">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
            {(regs ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  Belum ada pendaftaran.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}