import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ClientPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token;

  if (!token) {
    redirect("/client/login");
  }

  const supabase = await createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("token", token)
    .single();

  if (!club) {
    redirect("/client/login?error=invalid");
  }

  const { data: events } = await supabase
    .from("events")
    .select("id, name, status, start_date, end_date, location")
    .order("start_date", { ascending: false });

  const { data: athletes } = await supabase
    .from("athletes")
    .select("id, name, gender, birth_date")
    .eq("club_id", club.id)
    .order("name");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Portal {club.name}</h1>
          <p className="text-zinc-500">
            {club.pic_name ?? "-"} · {club.city ?? "-"} · Status:{" "}
            <span className="capitalize">{club.status}</span>
          </p>
        </div>
        <a href="/client/login" className="text-sm text-primary hover:underline">
          Ganti club
        </a>
      </div>

      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-3 text-base font-semibold">Atlet ({athletes?.length ?? 0})</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-100">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nama</th>
                <th className="px-4 py-2 font-medium">JK</th>
                <th className="px-4 py-2 font-medium">Tanggal Lahir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {(athletes ?? []).map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 font-medium">{a.name}</td>
                  <td className="px-4 py-2 capitalize">{a.gender ?? "-"}</td>
                  <td className="px-4 py-2">{a.birth_date ?? "-"}</td>
                </tr>
              ))}
              {(athletes ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
                    Belum ada atlet. Hubungi admin untuk input atau import.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-3 text-base font-semibold">Event Terbuka</h2>
        <div className="space-y-3">
          {(events ?? [])
            .filter((e) => e.status === "registration_open")
            .map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-4">
                <div>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-sm text-zinc-500">
                    {e.start_date ?? "-"} · {e.location ?? "-"}
                  </p>
                </div>
                <a
                  href={`/client/register?token=${token}&event=${e.id}`}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Daftar
                </a>
              </div>
            ))}
          {events?.length === 0 && (
            <p className="text-sm text-zinc-400">Belum ada event.</p>
          )}
        </div>
      </div>
    </div>
  );
}