import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerAthlete } from "./actions";

export default async function ClientRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; event?: string; success?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token;
  const eventId = sp.event;

  if (!token) redirect("/client/login");
  if (!eventId) redirect(`/client?token=${encodeURIComponent(token)}`);

  const supabase = await createClient();
  const { data: club } = await supabase.from("clubs").select("*").eq("token", token).single();
  if (!club) redirect("/client/login?error=invalid");

  const { data: event } = await supabase.from("events").select("*").eq("id", eventId).single();
  if (!event) redirect(`/client?token=${encodeURIComponent(token)}`);

  const { data: athletes } = await supabase
    .from("athletes")
    .select("id, name, gender, birth_date")
    .eq("club_id", club.id)
    .order("name");

  const { data: numbers } = await supabase
    .from("event_numbers")
    .select("*, age_categories(name), swimming_styles(name), distances(meters)")
    .eq("event_id", eventId)
    .order("name");

  async function handleRegister(formData: FormData) {
    "use server";
    formData.set("token", token ?? "");
    await registerAthlete(formData);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <a href={`/client?token=${encodeURIComponent(token)}`} className="text-sm text-primary hover:underline">
          ← Portal {club.name}
        </a>
        <h1 className="mt-1 text-2xl font-semibold">Registrasi — {event.name}</h1>
        <p className="text-zinc-500">
          {event.start_date ?? "-"} · {event.location ?? "-"}
        </p>
      </div>

      {sp.success && (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          Pendaftaran berhasil. Admin akan memfinalisasi dan membuat tagihan.
        </p>
      )}
      {sp.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          Gagal mendaftar ({sp.error}). Atlet mungkin sudah terdaftar di nomor ini.
        </p>
      )}

      <form action={handleRegister} className="rounded-xl border border-zinc-200 bg-white p-6">
        <input type="hidden" name="club_id" value={club.id} />
        <input type="hidden" name="event_id" value={eventId} />
        <h2 className="mb-4 text-base font-semibold">Daftarkan Atlet</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Atlet *</label>
            <select
              name="athlete_id"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Pilih atlet…</option>
              {(athletes ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.gender ?? "-"})
                </option>
              ))}
            </select>
          </div>
          <div>
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
                  {Number(n.fee) > 0 ? ` — Rp ${Number(n.fee).toLocaleString("id-ID")}` : " (Gratis)"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Seed Time</label>
            <input
              name="seed_time"
              placeholder="Contoh: 34.21"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-4">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
            Daftarkan
          </button>
        </div>
      </form>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-3 text-base font-semibold">Daftar Nomor Lomba ({numbers?.length ?? 0})</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(numbers ?? []).map((n) => (
            <div key={n.id} className="rounded-lg border border-zinc-100 p-4 text-sm">
              <p className="font-medium">{n.name}</p>
              <p className="text-xs text-zinc-500">
                {n.swimming_styles?.name ?? "-"} ·{" "}
                {n.distances ? `${n.distances.meters}m` : "-"} · {n.gender} ·{" "}
                {n.age_categories?.name ?? "-"}
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-700">
                {Number(n.fee) > 0 ? `Rp ${Number(n.fee).toLocaleString("id-ID")}` : "Gratis"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}