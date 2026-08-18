import { createClient } from "@/lib/supabase/server";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: cert } = await supabase
    .from("certificates")
    .select(
      "*, athletes(name, birth_date, gender), registrations(event_numbers(name, swimming_styles(name), distances(meters))), events(name, start_date, location)"
    )
    .eq("qr_token", token)
    .single();

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
          ✅
        </div>
        <h1 className="text-xl font-semibold">Verifikasi Sertifikat</h1>

        {cert ? (
          <div className="mt-6 space-y-3 text-left">
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              Sertifikat ini <b>valid</b> dan terdaftar di sistem SEMP.
            </p>
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">Atlet</p>
              <p className="text-lg font-semibold">{cert.athletes?.name}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">Event</p>
              <p className="font-semibold">{cert.events?.name}</p>
              <p className="text-sm text-zinc-500">
                {cert.events?.start_date ?? "-"} · {cert.events?.location ?? "-"}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">Nomor</p>
              <p className="font-semibold">
                {cert.registrations?.event_numbers?.name ?? "Sertifikat Peserta"}
              </p>
              {cert.place && (
                <p className="text-sm font-medium text-amber-600">Juara {cert.place}</p>
              )}
            </div>
            <p className="text-center text-xs text-zinc-400">
              Tipe: <span className="capitalize">{cert.cert_type}</span> ·{" "}
              {new Date(cert.created_at).toLocaleDateString("id-ID")}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Sertifikat tidak ditemukan atau token tidak valid.
            </p>
            <p className="text-sm text-zinc-500">
              Pastikan QR code yang dipindai adalah sertifikat resmi dari penyelenggara.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}