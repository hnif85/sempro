import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShareButton from "@/components/public-event/share-button";
import { Section } from "@/components/public-event/section";
import { getDummyEvent } from "@/components/public-event/dummy";

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function statusMeta(status: string) {
  switch (status) {
    case "registration_open":
      return { label: "Pendaftaran Dibuka", className: "bg-emerald-500" };
    case "running":
      return { label: "Sedang Berlangsung", className: "bg-[#0878f9]" };
    case "finished":
      return { label: "Selesai", className: "bg-zinc-500" };
    case "registration_closed":
      return { label: "Pendaftaran Ditutup", className: "bg-amber-500" };
    default:
      return { label: status, className: "bg-zinc-500" };
  }
}

function numberStatusMeta(status: string) {
  switch (status) {
    case "selesai":
      return { label: "SELESAI", className: "bg-emerald-500/15 text-emerald-300" };
    case "berlangsung":
      return { label: "LIVE", className: "bg-red-500/20 text-red-300 animate-pulse" };
    default:
      return { label: "AKAN DATANG", className: "bg-white/10 text-blue-100/60" };
  }
}

function sessionStatusMeta(status: string) {
  switch (status) {
    case "selesai":
      return { label: "Selesai", className: "bg-emerald-500" };
    case "berlangsung":
      return { label: "Berlangsung", className: "bg-red-500" };
    default:
      return { label: "Akan Datang", className: "bg-zinc-400" };
  }
}

const medalColor = (place: number) =>
  place === 1 ? "text-yellow-300" : place === 2 ? "text-zinc-200" : place === 3 ? "text-orange-300" : "text-white/70";

export default async function PublicEventLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getDummyEvent(slug);
  const status = statusMeta(event.status);
  const isLive = event.status === "running";

  const totalMedals =
    event.clubStandings.reduce((s, c) => s + c.gold + c.silver + c.bronze, 0);

  return (
    <main className="min-h-screen bg-[#061c3b] text-white">
      {/* HEADER (compact) */}
      <header className="relative isolate overflow-hidden border-b border-white/10">
        <Image src={event.banner} alt="" fill sizes="100vw" className="absolute inset-0 z-0 object-cover opacity-25" />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(120deg,rgba(3,24,53,0.96),rgba(4,28,60,0.85))]" />
        <div className="relative z-10 mx-auto flex max-w-[1240px] flex-wrap items-start justify-between gap-4 px-5 py-6 lg:px-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full ${status.className} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white`}>
                {status.label}
              </span>
              {isLive && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> Live Score
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-[-0.04em] sm:text-3xl lg:text-4xl">{event.name}</h1>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-100/70">
              <span>⌖ {event.location}</span>
              <span>{fmtDate(event.start_date)}{event.end_date && event.end_date !== event.start_date ? ` — ${fmtDate(event.end_date)}` : ""}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton title={event.name} className="rounded-lg border border-white/30 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15" />
            <Link href={`/event/${event.slug}/register`} className="rounded-lg bg-[#0878f9] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1687ff]">
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* STAT STRIP */}
      <section className="border-b border-white/10 bg-[#082451]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 divide-white/10 sm:grid-cols-4">
          {[
            { value: event.stats.athletes, label: "Atlet" },
            { value: event.stats.clubs, label: "Club" },
            { value: event.stats.numbers, label: "Nomor" },
            { value: event.stats.heats, label: "Heat" },
          ].map((s, i) => (
            <div key={s.label} className={`px-5 py-4 text-center ${i < 3 ? "border-r border-white/10" : ""}`}>
              <p className="text-2xl font-black tabular-nums text-white">{s.value}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-blue-100/60">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE SCORE */}
      <section className="px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#53d8ff]">Realtime</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Live Score</h2>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold text-blue-100/60">
              {totalMedals} medali diperebutkan
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {event.numbers.map((number) => {
              const ns = numberStatusMeta(number.status);
              return (
                <div key={number.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{number.name}</p>
                      <p className="text-[11px] text-blue-100/55">{number.style} • {number.distance} • {number.gender} • {number.age}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${ns.className}`}>{ns.label}</span>
                  </div>
                  {number.results.length > 0 ? (
                    <table className="w-full text-left text-sm">
                      <tbody>
                        {number.results.map((r) => (
                          <tr key={r.place} className="border-b border-white/5 last:border-0">
                            <td className={`w-12 px-5 py-2.5 text-center font-black tabular-nums ${medalColor(r.place)}`}>{r.place}</td>
                            <td className="px-2 py-2.5 font-semibold text-white">{r.athlete}</td>
                            <td className="px-2 py-2.5 text-xs text-blue-100/60">{r.club}</td>
                            <td className={`px-5 py-2.5 text-right font-bold tabular-nums ${medalColor(r.place)}`}>{r.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="px-5 py-6 text-center text-xs text-blue-100/40">Belum dimulai</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* KLASMEN MEDALI */}
      <Section eyebrow="Klasemen" title="Perolehan Medali" description="Total medali per club sementara" dark>
        <div className="mx-auto max-w-[860px] overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10 text-[11px] uppercase tracking-wide text-blue-100/70">
              <tr>
                <th className="px-5 py-3 font-bold">Club</th>
                <th className="px-5 py-3 text-center font-bold text-yellow-300">Emas</th>
                <th className="px-5 py-3 text-center font-bold text-zinc-200">Perak</th>
                <th className="px-5 py-3 text-center font-bold text-orange-300">Perunggu</th>
                <th className="px-5 py-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {event.clubStandings.map((c) => {
                const total = c.gold + c.silver + c.bronze;
                return (
                  <tr key={c.club} className="hover:bg-white/5">
                    <td className="px-5 py-3 font-semibold text-white">{c.club}</td>
                    <td className="px-5 py-3 text-center font-black tabular-nums text-yellow-300">{c.gold}</td>
                    <td className="px-5 py-3 text-center font-black tabular-nums text-zinc-200">{c.silver}</td>
                    <td className="px-5 py-3 text-center font-black tabular-nums text-orange-300">{c.bronze}</td>
                    <td className="px-5 py-3 text-right font-bold tabular-nums text-white">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* JADWAL */}
      <Section eyebrow="Susunan Acara" title="Jadwal">
        <div className="mx-auto grid max-w-[900px] gap-6 lg:grid-cols-2">
          {event.schedule.map((day) => (
            <div key={day.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
                <h3 className="text-base font-black text-white">{day.label}</h3>
                <p className="text-xs text-blue-100/55">{day.date}</p>
              </div>
              <ul className="mt-3 space-y-3">
                {day.sessions.map((s, i) => {
                  const ss = sessionStatusMeta(s.status);
                  return (
                    <li key={i} className="flex gap-3">
                      <span className="w-14 shrink-0 text-sm font-black tabular-nums text-[#53d8ff]">{s.time}</span>
                      <div className="border-l border-white/10 pl-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">{s.title}</p>
                          <span className={`rounded-full ${ss.className} px-1.5 py-0.5 text-[8px] font-bold text-white`}>{ss.label}</span>
                        </div>
                        <p className="text-xs text-blue-100/55">{s.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* NOMOR LOMBA */}
      <Section eyebrow="Daftar Pertandingan" title="Nomor Lomba" dark>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {event.numbers.map((number) => (
            <div key={number.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-bold text-white">{number.name}</p>
              <p className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-blue-50/80">{number.style}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-blue-50/80">{number.distance}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-blue-50/80 capitalize">{number.gender}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-blue-50/80">{number.age}</span>
              </p>
              <p className="mt-3 text-xs font-bold text-[#53d8ff]">Rp {number.fee.toLocaleString("id-ID")}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* SPONSOR */}
      <section className="px-5 pb-12 lg:px-8">
        <div className="mx-auto max-w-[1240px] border-t border-white/10 pt-8">
          <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100/50">Didukung Oleh</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {event.sponsors.map((sponsor) => (
              <div key={sponsor} className="flex h-16 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-center text-sm font-black tracking-[-0.06em] text-white/90">
                {sponsor}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#041d3e] px-5 py-6 text-center text-xs text-blue-100/60 lg:px-8">
        <p className="font-black tracking-tight text-white">SWIM EVENT</p>
        <p className="mt-1">{event.organizer}</p>
      </footer>
    </main>
  );
}
