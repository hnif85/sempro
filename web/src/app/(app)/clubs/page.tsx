import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ClubsPage() {
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
    .from("clubs")
    .select("*, athletes(count), invoices(count)")
    .order("name");

  if (!isAdmin && profile?.club_id) {
    query = query.eq("id", profile.club_id);
  }

  const { data: clubs } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Club / Sekolah</h1>
          <p className="text-zinc-500">Data pelatih / PIC dan club peserta</p>
        </div>
        {isAdmin && (
          <Link
            href="/clubs/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Tambah Club
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Club</th>
              <th className="px-4 py-3 font-medium">PIC</th>
              <th className="px-4 py-3 font-medium">WhatsApp</th>
              <th className="px-4 py-3 font-medium">Kota</th>
              <th className="px-4 py-3 font-medium">Atlet</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(clubs ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">
                  {c.name}
                  {c.school && <p className="text-xs text-zinc-400">{c.school}</p>}
                </td>
                <td className="px-4 py-3">{c.pic_name ?? "-"}</td>
                <td className="px-4 py-3">{c.whatsapp ?? "-"}</td>
                <td className="px-4 py-3">{c.city ?? "-"}</td>
                <td className="px-4 py-3">{c.athletes?.length ?? 0}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize">
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/clubs/${c.id}`} className="text-primary hover:underline">
                    Kelola
                  </Link>
                </td>
              </tr>
            ))}
            {(clubs ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                  Belum ada club.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}