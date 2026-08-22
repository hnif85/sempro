import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Countdown from "@/components/public-event/countdown";
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

export default async function PublicEventLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getDummyEvent(slug);
  const status = statusMeta(event.status);
  const canRegister = event.status === "registration_open";

  return (
    <main className="min-h-screen bg-white text-[#0b2348]">
      {/* HERO */}
      <section className="relative isolate min-h-[640px] overflow-hidden bg-[#061c3b] lg:min-h-[720px]">
        <Image src={event.banner} alt={event.name} fill priority sizes="100vw" className="absolute inset-0 z-0 object-cover object-[60%_center]" />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(3,24,53,0.98)_0%,rgba(3,25,55,0.82)_38%,rgba(4,28,60,0.35)_78%)]" />
        <div className="absolute inset-x-0 bottom-0 z-[2] h-48 bg-gradient-to-t from-[#061c3b] to-transparent" />

        <div className="relative z-10 mx-auto flex max-w-[1240px] flex-col items-start px-5 pb-16 pt-24 lg:min-h-[720px] lg:px-8 lg:pb-20 lg:pt-28">
          <span className={`rounded-full ${status.className} px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white`}>
            {status.label}
          </span>
          <h1 className="mt-4 max-w-[760px] text-4xl font-black leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl lg:text-[60px]">
            {event.name}
          </h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-blue-50/85">
            <span>⌖ {event.location}</span>
            <span className="hidden sm:inline">•</span>
            <span>{fmtDate(event.start_date)}{event.end_date && event.end_date !== event.start_date ? ` — ${fmtDate(event.end_date)}` : ""}</span>
          </p>
          <p className="mt-1 text-xs text-blue-100/60">Diselenggarakan oleh {event.organizer}</p>

          <div className="mt-8">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#53d8ff]">Menuju Hari H</p>
            <Countdown target={event.start_date} />
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            {canRegister ? (
              <Link
                href={`/event/${event.slug}/register`}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0878f9] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(8,120,249,0.3)] transition hover:-translate-y-0.5 hover:bg-[#1687ff]"
              >
                Daftar Sekarang <span>→</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-6 py-3.5 text-sm font-bold text-white/80">
                Pendaftaran Belum Dibuka
              </span>
            )}
            <ShareButton
              title={event.name}
              className="inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15"
            />
          </div>
        </div>
      </section>

      {/* STICKY ACTION BAR */}
      <div className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-3 lg:px-8">
          <p className="truncate text-sm font-bold text-[#0b2348]">{event.name}</p>
          <div className="flex items-center gap-2">
            <ShareButton title={event.name} className="rounded-lg border border-[#bcd6fb] px-4 py-2 text-xs font-bold text-[#086df0] transition hover:bg-blue-50" />
            {canRegister && (
              <Link
                href={`/event/${event.slug}/register`}
                className="rounded-lg bg-[#076cf0] px-4 py-2 text-xs font-bold text-white shadow-[0_8px_18px_rgba(7,108,240,0.2)] transition hover:bg-[#005cd4]"
              >
                Daftar
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* INFO CARDS */}
      <section className="bg-[#f7faff] px-5 py-12 lg:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Tanggal", value: fmtDate(event.start_date) + (event.end_date && event.end_date !== event.start_date ? ` — ${fmtDate(event.end_date)}` : "") },
            { label: "Lokasi", value: event.location },
            { label: "Penyelenggara", value: event.organizer },
            { label: "Biaya Pendaftaran", value: `Rp ${event.entry_fee.toLocaleString("id-ID")}` },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-[#e3ebf5] bg-white p-5 shadow-[0_7px_20px_rgba(16,55,99,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#7185a3]">{card.label}</p>
              <p className="mt-2 text-sm font-bold leading-snug text-[#0b2348]">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TENTANG */}
      <Section eyebrow="Tentang Event" title={event.name} description="Ringkasan kejuaraan dan tujuan diselenggarakannya event ini.">
        {event.description.split("\n\n").map((para, i) => (
          <p key={i} className="mx-auto max-w-[760px] whitespace-pre-wrap text-center text-sm leading-7 text-[#6c809e]">
            {para}
          </p>
        ))}
      </Section>

      {/* NOMOR LOMBA */}
      <Section eyebrow="Daftar Pertandingan" title="Nomor Lomba" description={`${event.numbers.length} nomor perlombaan tersedia`} dark>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {event.numbers.map((number) => (
            <div key={number.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
              <p className="text-sm font-bold text-white">{number.name}</p>
              <p className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-blue-50/80">{number.style}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-blue-50/80">{number.distance}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-blue-50/80 capitalize">{number.gender}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-blue-50/80">{number.age}</span>
              </p>
              <p className="mt-4 text-sm font-bold text-[#53d8ff]">Rp {number.fee.toLocaleString("id-ID")}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* JADWAL */}
      <Section eyebrow="Susunan Acara" title="Jadwal Event">
        <div className="grid gap-6 lg:grid-cols-2">
          {event.schedule.map((day) => (
            <div key={day.label} className="rounded-2xl border border-[#e3ebf5] bg-white p-6 shadow-[0_7px_20px_rgba(16,55,99,0.04)]">
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black text-[#0b2348]">{day.label}</h3>
                <p className="text-xs font-medium text-[#7185a3]">{day.date}</p>
              </div>
              <ul className="mt-4 space-y-4">
                {day.sessions.map((session, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="w-14 shrink-0 text-sm font-black tabular-nums text-[#0878f9]">{session.time}</span>
                    <div className="border-l border-slate-100 pl-4">
                      <p className="text-sm font-bold text-[#0b2348]">{session.title}</p>
                      <p className="text-xs text-[#7185a3]">{session.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* HASIL / MEDALI */}
      <Section eyebrow="Performa Terbaru" title="Hasil & Perolehan Medali" dark>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10 text-[11px] uppercase tracking-wide text-blue-50/70">
              <tr>
                <th className="px-5 py-3 font-bold">Nomor Lomba</th>
                <th className="px-5 py-3 font-bold text-yellow-300">Emas</th>
                <th className="px-5 py-3 font-bold text-zinc-300">Perak</th>
                <th className="px-5 py-3 font-bold text-orange-300">Perunggu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {event.medals.map((row) => (
                <tr key={row.number} className="align-top">
                  <td className="px-5 py-4 font-semibold text-white">{row.number}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-white">{row.gold.name}</p>
                    <p className="text-xs text-blue-100/60">{row.gold.club} • {row.gold.time}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-white">{row.silver.name}</p>
                    <p className="text-xs text-blue-100/60">{row.silver.club} • {row.silver.time}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-white">{row.bronze.name}</p>
                    <p className="text-xs text-blue-100/60">{row.bronze.club} • {row.bronze.time}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* SPONSOR */}
      <Section eyebrow="Mitra & Pendukung" title="Sponsor">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {event.sponsors.map((sponsor) => (
            <div key={sponsor} className="flex h-20 items-center justify-center rounded-2xl border border-[#e3ebf5] bg-white text-center text-sm font-black tracking-[-0.06em] text-[#192238] shadow-[0_7px_20px_rgba(16,55,99,0.04)]">
              {sponsor}
            </div>
          ))}
        </div>
      </Section>

      {/* GALERI */}
      <Section eyebrow="Dokumentasi" title="Galeri" dark>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {event.gallery.map((src, i) => (
            <div key={i} className="relative h-48 overflow-hidden rounded-2xl border border-white/10">
              <Image src={src} alt={`Galeri ${i + 1}`} fill sizes="(max-width:768px) 50vw, 33vw" className="object-cover transition duration-500 hover:scale-105" />
            </div>
          ))}
        </div>
      </Section>

      {/* CTA AKHIR */}
      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-3xl bg-[#061c3b] px-8 py-14 text-center text-white sm:px-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#53d8ff]">Siap bertanding?</p>
          <h2 className="mx-auto mt-3 max-w-[540px] text-3xl font-black tracking-[-0.045em] sm:text-4xl">
            Daftarkan Atlet Anda Sekarang
          </h2>
          <p className="mx-auto mt-4 max-w-[460px] text-sm leading-6 text-blue-100/75">
            Jangan lewatkan kejuaraan renang terbesar di pesisir utara Jawa Tengah. Pendaftaran club & atlet dibuka sekarang.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {canRegister ? (
              <Link href={`/event/${event.slug}/register`} className="rounded-lg bg-[#0878f9] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(8,120,249,0.3)] transition hover:-translate-y-1 hover:bg-[#1687ff]">
                Daftar Sekarang
              </Link>
            ) : (
              <span className="rounded-lg border border-white/50 bg-white/5 px-6 py-3.5 text-sm font-bold text-white/80">Pendaftaran Belum Dibuka</span>
            )}
            <ShareButton title={event.name} className="rounded-lg border border-white/50 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#041d3e] px-5 py-8 text-center text-xs text-blue-100/60 lg:px-8">
        <p className="font-black tracking-tight text-white">SWIM EVENT</p>
        <p className="mt-2">Platform Manajemen Kejuaraan Renang • {event.organizer}</p>
      </footer>
    </main>
  );
}
