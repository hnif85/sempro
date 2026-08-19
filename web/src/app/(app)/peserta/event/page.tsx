import { loadPesertaData, type ParticipantEvent } from "@/lib/peserta-data";
import { Icon, NoAthleteNotice } from "@/components/peserta/ui";
import { registerPeserta } from "../actions";

function RegistrationForm({ event, compact = false }: { event: ParticipantEvent; compact?: boolean }) {
  return (
    <form action={registerPeserta} className={`mt-4 flex flex-wrap items-end gap-3 ${compact ? "flex-col sm:flex-row" : ""}`}>
      <input type="hidden" name="event_id" value={event.id} />
      <div className={compact ? "w-full sm:flex-1" : "min-w-[200px] flex-1"}>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Nomor Lomba</label>
        <select name="event_number_id" required className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none">
          <option value="">Pilih nomor…</option>
          {(event.event_numbers ?? []).map((number) => (
            <option key={number.id} value={number.id}>
              {number.name}
              {Number(number.fee) > 0 ? ` — Rp ${Number(number.fee).toLocaleString("id-ID")}` : " (Gratis)"}
            </option>
          ))}
        </select>
      </div>
      {!compact && (
        <div className="w-32">
          <label className="mb-1 block text-xs font-medium text-zinc-500">Seed Time (opsional)</label>
          <input name="seed_time" placeholder="00:32.10" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
      )}
      <button type="submit" className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark">Daftar</button>
    </form>
  );
}

function MobileEventCard({ event }: { event: ParticipantEvent }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(28,74,137,.05)]">
      <div className="bg-gradient-to-br from-[#06285f] to-[#0c55b8] p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-center text-[10px] font-bold leading-tight text-[#0a3b87]">SEMP<br />OPEN</div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{event.name}</p>
            <p className="mt-1 text-sm text-blue-100">{event.start_date ?? "Tanggal menyusul"}</p>
            <p className="mt-0.5 truncate text-sm text-blue-100">{event.location ?? "Lokasi menyusul"}</p>
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nomor Tersedia</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(event.event_numbers ?? []).map((number) => (
            <span key={number.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[10px] text-white">✓</span>
              {number.name}
            </span>
          ))}
          {(event.event_numbers ?? []).length === 0 && <span className="text-sm text-slate-400">Nomor belum tersedia.</span>}
        </div>
        <RegistrationForm event={event} compact />
      </div>
    </div>
  );
}

function DesktopRegistrationCard({ event }: { event: ParticipantEvent }) {
  return (
    <div className="rounded-lg border border-zinc-100 p-4">
      <p className="font-semibold">{event.name}</p>
      <p className="text-sm text-zinc-500">{event.start_date ?? "-"} · {event.location ?? "-"}</p>
      <RegistrationForm event={event} />
    </div>
  );
}

export default async function PesertaEventPage() {
  const data = await loadPesertaData();
  if (!data.athleteId) return <NoAthleteNotice />;

  const { openEvents } = data;

  return (
    <>
      <div className="-mx-4 -mt-4 min-h-screen bg-[#f5f8ff] pb-28 md:hidden">
        <div className="px-4 pt-5 text-[#102353]">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="calendar" className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Event</h1>
          </div>
          <div className="space-y-4">
            {openEvents.map((event) => <MobileEventCard key={event.id} event={event} />)}
            {openEvents.length === 0 && (
              <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">Belum ada event yang dibuka pendaftarannya.</p>
            )}
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold">Event Terbuka — Daftar</h1>
        <section className="mt-6 rounded-xl border border-zinc-200 bg-white">
          <div className="space-y-4 p-6">
            {openEvents.map((event) => <DesktopRegistrationCard key={event.id} event={event} />)}
            {openEvents.length === 0 && <p className="text-sm text-zinc-400">Belum ada event yang dibuka pendaftarannya.</p>}
          </div>
        </section>
      </div>

    </>
  );
}
