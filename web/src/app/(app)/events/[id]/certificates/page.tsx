import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateCertificates } from "./actions";

export default async function CertificatesPage({
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

  const { data: accessProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (accessProfile?.role === "official") redirect(`/events/${id}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin_event";

  const { data: event } = await supabase.from("events").select("name").eq("id", id).single();
  if (!event) notFound();

  const { data: certs } = await supabase
    .from("certificates")
    .select("*, athletes(name), registrations(event_numbers(name))")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  const participantCount = (certs ?? []).filter((c) => c.cert_type === "peserta").length;
  const juaraCount = (certs ?? []).filter((c) => c.cert_type === "juara").length;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/events/${id}`} className="text-sm text-primary hover:underline">
          ← {event.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Sertifikat Digital</h1>
        <p className="text-zinc-500">
          Sertifikat peserta & juara dengan verifikasi QR
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="grid flex-1 grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Sertifikat Peserta</p>
            <p className="mt-1 text-xl font-semibold">{participantCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Sertifikat Juara</p>
            <p className="mt-1 text-xl font-semibold">{juaraCount}</p>
          </div>
        </div>
        {isAdmin && (
          <form action={generateCertificates}>
            <input type="hidden" name="event_id" value={id} />
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
              Generate Sertifikat
            </button>
          </form>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Atlet</th>
              <th className="px-4 py-3 font-medium">Nomor</th>
              <th className="px-4 py-3 font-medium">Jenis</th>
              <th className="px-4 py-3 font-medium">Posisi</th>
              <th className="px-4 py-3 font-medium">QR</th>
              <th className="px-4 py-3 text-right">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(certs ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">{c.athletes?.name ?? "-"}</td>
                <td className="px-4 py-3">{c.registrations?.event_numbers?.name ?? "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.cert_type === "juara"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {c.cert_type}
                  </span>
                </td>
                <td className="px-4 py-3">{c.place ? `Juara ${c.place}` : "-"}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.qr_token.slice(0, 10)}…</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/verify/${c.qr_token}`}
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    Lihat
                  </Link>
                </td>
              </tr>
            ))}
            {(certs ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  Belum ada sertifikat. Klik Generate Sertifikat setelah hasil tersedia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
