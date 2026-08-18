import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

type IconName =
  | "users"
  | "swim"
  | "ticket"
  | "card"
  | "trophy"
  | "certificate"
  | "calendar"
  | "waves"
  | "timer"
  | "chart";

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, React.ReactNode> = {
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    swim: (
      <>
        <circle cx="17" cy="5" r="2" />
        <path d="m15.5 7-3.5 3 2.5 2.5M12 10l-4-1.5M14.5 12.5 11 17l-3.5 2" />
        <path d="M3 15c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0" />
      </>
    ),
    ticket: (
      <>
        <path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3v4Z" />
        <path d="M13 4v2M13 12v2M13 18v-2" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 21h8M12 17v4M6 3h12v5a6 6 0 0 1-12 0V3Z" />
        <path d="M6 5H3v2a4 4 0 0 0 4 4M18 5h3v2a4 4 0 0 1-4 4" />
      </>
    ),
    certificate: (
      <>
        <path d="M5 3h14v18l-4-2-3 2-3-2-4 2V3Z" />
        <path d="M8 8h8M8 12h5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 9h18" />
      </>
    ),
    waves: (
      <>
        <path d="M2 8c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
        <path d="M2 13c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
        <path d="M2 18c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
      </>
    ),
    timer: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2 2M9 2h6M12 2v3" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

const features: { icon: IconName; title: string; text: string }[] = [
  { icon: "calendar", title: "Event Management", text: "Kelola event renang dari awal hingga selesai dengan mudah." },
  { icon: "users", title: "Registrasi Online", text: "Pendaftaran atlet dan club secara online lebih cepat & praktis." },
  { icon: "waves", title: "Heat & Seeding", text: "Generate heat dan seeding otomatis berdasarkan seed time." },
  { icon: "timer", title: "Hasil Perlombaan", text: "Input waktu, ranking, dan rekap hasil secara real-time." },
  { icon: "certificate", title: "Sertifikat Digital", text: "Sertifikat digital dengan QR Code verifikasi yang valid." },
  { icon: "chart", title: "Riwayat Atlet", text: "Lihat riwayat prestasi atlet di berbagai event." },
];

const imagePositions = ["center 58%", "72% 42%", "92% 62%"];

function fmtDate(d: string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtRange(start: string | null, end: string | null) {
  if (!start && !end) return "-";
  if (start && end && start !== end) return `${fmtDate(start)} - ${fmtDate(end)}`;
  return fmtDate(start ?? end);
}

async function verifyCertificate(formData: FormData) {
  "use server";
  const token = String(formData.get("certificate") ?? "").trim();
  if (token) redirect(`/verify/${encodeURIComponent(token)}`);
}

export default async function Home() {
  const admin = await createAdminClient();

  const { data: activeEvents } = await admin
    .from("events")
    .select("id, name, start_date, end_date, location, banner_url")
    .eq("status", "registration_open")
    .order("start_date", { ascending: true })
    .limit(3);

  const { data: recentRaw } = await admin
    .from("events")
    .select("id, name, banner_url")
    .eq("status", "finished")
    .order("end_date", { ascending: false })
    .limit(3);

  const recentEvents = await Promise.all(
    (recentRaw ?? []).map(async (e) => {
      const [athletesRes, clubsRes, numbersRes] = await Promise.all([
        admin.from("registrations").select("athlete_id").eq("event_id", e.id),
        admin.from("registrations").select("club_id").eq("event_id", e.id),
        admin
          .from("event_numbers")
          .select("id", { count: "exact", head: true })
          .eq("event_id", e.id),
      ]);

      const athletes = new Set((athletesRes.data ?? []).map((r) => r.athlete_id)).size;
      const clubs = new Set((clubsRes.data ?? []).map((r) => r.club_id)).size;

      return {
        id: e.id,
        name: e.name,
        bannerUrl: e.banner_url,
        athletes: athletes.toLocaleString("id-ID"),
        clubs: clubs.toLocaleString("id-ID"),
        numbers: String(numbersRes.count ?? 0),
      };
    })
  );

  const [{ count: totalEvents }, { count: totalAthletes }, { count: totalClubs }, { count: totalCerts }] =
    await Promise.all([
      admin.from("events").select("id", { count: "exact", head: true }),
      admin.from("athletes").select("id", { count: "exact", head: true }),
      admin.from("clubs").select("id", { count: "exact", head: true }),
      admin.from("certificates").select("id", { count: "exact", head: true }),
    ]);
  return (
    <main className="overflow-hidden bg-white text-[#0b2348]">
      <header className="sticky top-0 z-50 border-b border-slate-100/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Swim Event home">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#eaf3ff] text-[#0878eb]">
              <Icon name="waves" size={29} />
            </div>
            <div className="leading-none">
              <p className="text-[17px] font-black tracking-[-0.04em] text-[#082451]">SWIM EVENT</p>
              <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.17em] text-[#6f84a2]">Management Platform</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] font-semibold text-[#18335c] lg:flex">
            <a href="#beranda" className="relative py-3 text-[#086df0] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-[#086df0]">Beranda</a>
            <a href="#events" className="py-3 transition-colors hover:text-[#086df0]">Event</a>
            <a href="#hasil" className="py-3 transition-colors hover:text-[#086df0]">Hasil</a>
            <a href="#sertifikat" className="py-3 transition-colors hover:text-[#086df0]">Sertifikat</a>
            <a href="#tentang" className="py-3 transition-colors hover:text-[#086df0]">Tentang Kami</a>
            <a href="#kontak" className="py-3 transition-colors hover:text-[#086df0]">Kontak</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/daftar" className="hidden rounded-lg border border-[#bcd6fb] px-5 py-3 text-xs font-bold text-[#086df0] transition hover:bg-blue-50 sm:inline-flex">
              Daftar
            </Link>
            <Link href="/login" className="hidden rounded-lg bg-[#076cf0] px-5 py-3 text-xs font-bold text-white shadow-[0_8px_18px_rgba(7,108,240,0.2)] transition hover:-translate-y-0.5 hover:bg-[#005cd4] sm:inline-flex">
              <span className="mr-2">↗</span> Login
            </Link>
            <details className="relative lg:hidden">
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 text-[#0b2348] [&::-webkit-details-marker]:hidden">
                <span className="text-xl">☰</span>
              </summary>
              <nav className="absolute right-0 top-12 w-52 rounded-2xl border border-slate-100 bg-white p-3 text-sm font-semibold shadow-2xl">
                <a href="#events" className="block rounded-lg px-3 py-2 hover:bg-blue-50">Event</a>
                <a href="#hasil" className="block rounded-lg px-3 py-2 hover:bg-blue-50">Hasil</a>
                <a href="#sertifikat" className="block rounded-lg px-3 py-2 hover:bg-blue-50">Sertifikat</a>
                <Link href="/daftar" className="mt-2 block rounded-lg border border-blue-200 px-3 py-2 text-center text-[#086df0]">Daftar Club / Peserta</Link>
                <Link href="/login" className="mt-2 block rounded-lg bg-[#076cf0] px-3 py-2 text-center text-white">Login Panitia</Link>
              </nav>
            </details>
          </div>
        </div>
      </header>

      <section id="beranda" className="relative isolate min-h-[590px] overflow-visible bg-[#061c3b] lg:min-h-[650px]">
        <Image src="/hero-1.png" alt="Atlet renang melakukan start di kolam pertandingan" fill priority sizes="100vw" className="absolute inset-0 z-0 object-cover object-[63%_center]" />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(3,24,53,0.98)_0%,rgba(3,25,55,0.9)_32%,rgba(4,28,60,0.3)_72%,rgba(4,28,60,0.1)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-t from-[#061c3b] to-transparent" />
        <div className="relative z-10 mx-auto flex max-w-[1240px] items-center px-5 pb-44 pt-24 lg:min-h-[650px] lg:px-8 lg:pb-36 lg:pt-12">
          <div className="max-w-[580px] text-white">
            <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#53d8ff]"><span className="h-px w-10 bg-[#53d8ff]" /> SEMP Platform</p>
            <h1 className="text-4xl font-black leading-[1.06] tracking-[-0.055em] sm:text-5xl lg:text-[62px]">Kelola Kejuaraan<br /><span className="text-[#48d9ff]">Renang Lebih Mudah</span></h1>
            <p className="mt-6 max-w-[450px] text-sm leading-7 text-blue-50/85 sm:text-base">Dari pendaftaran peserta, pembayaran, penyusunan heat, hasil perlombaan, hingga sertifikat digital dalam satu platform.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/daftar" className="inline-flex items-center gap-2 rounded-lg bg-[#0878f9] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(8,120,249,0.28)] transition hover:-translate-y-1 hover:bg-[#1687ff]">Daftar Club / Peserta <span>→</span></Link>
              <a href="#events" className="inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/15">Lihat Event Aktif</a>
            </div>
            <div className="mt-10 flex items-center gap-2"><span className="h-1.5 w-8 rounded-full bg-white" /><span className="h-1.5 w-4 rounded-full bg-white/45" /><span className="h-1.5 w-4 rounded-full bg-white/45" /></div>
          </div>
        </div>

        <div className="absolute inset-x-5 -bottom-14 z-20 mx-auto grid max-w-[1140px] grid-cols-2 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_22px_50px_rgba(16,55,99,0.15)] backdrop-blur md:grid-cols-4 lg:inset-x-8">
          {[
            ["users", `${(totalEvents ?? 0).toLocaleString("id-ID")}+`, "Event Dikelola"],
            ["swim", `${(totalAthletes ?? 0).toLocaleString("id-ID")}+`, "Atlet Terdaftar"],
            ["ticket", `${(totalClubs ?? 0).toLocaleString("id-ID")}+`, "Club & Sekolah"],
            ["certificate", `${(totalCerts ?? 0).toLocaleString("id-ID")}+`, "Sertifikat Diterbitkan"],
          ].map(([icon, value, label], index) => (
            <div key={label} className={`flex items-center gap-3 px-5 py-5 sm:px-7 sm:py-6 ${index < 3 ? "border-r border-slate-100" : ""} ${index > 1 ? "border-t border-slate-100 md:border-t-0" : ""}`}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf5ff] text-[#0872ef]"><Icon name={icon as IconName} size={23} /></span>
              <div><p className="text-lg font-black tracking-tight text-[#0b2348] sm:text-xl">{value}</p><p className="mt-0.5 text-[10px] font-medium text-[#7183a0] sm:text-xs">{label}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="events" className="mx-auto max-w-[1240px] px-5 pb-8 pt-28 lg:px-8 lg:pt-32">
        <SectionHeading eyebrow="Agenda pilihan" title="Event Aktif" action="Lihat Semua Event Aktif" href="#events" description="Event yang sedang dibuka pendaftarannya" />
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {(activeEvents ?? []).map((event, index) => (
            <article key={event.id} className="group overflow-hidden rounded-2xl border border-[#e4ebf4] bg-white shadow-[0_8px_24px_rgba(16,55,99,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_32px_rgba(16,55,99,0.13)]">
              <div className="relative h-44 overflow-hidden bg-[#082d5a]">
                <Image
                  src={event.banner_url ?? "/hero-1.png"}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                  style={{ objectPosition: imagePositions[index % imagePositions.length] }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061d40]/70 via-transparent to-transparent" />
                <span className="absolute left-3 top-3 rounded-md bg-[#0878f9] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white">Pendaftaran Dibuka</span>
                <span className="absolute bottom-3 left-4 text-xs font-semibold text-white">SEMP {String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-[#0b2348]">{event.name}</h3>
                <div className="mt-4 space-y-2 text-xs text-[#687c9b]"><p className="flex items-center gap-2"><Icon name="calendar" size={14} /> {fmtRange(event.start_date, event.end_date)}</p><p className="flex items-center gap-2"><span className="text-sm">⌖</span> {event.location ?? "-"}</p></div>
                 <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4"><p className="text-[10px] text-[#7183a0]">Tanggal mulai:<strong className="mt-1 block text-xs text-[#086df0]">{fmtDate(event.start_date)}</strong></p><Link href={`/event/${event.id}`} className="rounded-lg bg-[#edf5ff] px-3 py-2 text-[10px] font-bold text-[#086df0] transition hover:bg-[#d9eaff]">Detail Event →</Link></div>
              </div>
            </article>
          ))}
          {(activeEvents ?? []).length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-[#cfdcf0] bg-[#f7faff] px-6 py-12 text-center text-sm text-[#7890af]">
              Belum ada event yang dibuka pendaftarannya. Silakan cek kembali nanti.
            </p>
          )}
        </div>
      </section>

      <section id="tentang" className="border-y border-[#e8eef6] bg-[#f7faff] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="mx-auto max-w-[620px] text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0878f9]">Workflow tanpa hambatan</p><h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-[#0b2348] sm:text-4xl">Cara Kerja</h2><p className="mt-4 text-sm leading-6 text-[#6c809e]">Satu alur digital untuk membuat setiap kejuaraan berjalan lebih rapi, cepat, dan terpercaya.</p></div>
          <div className="relative mt-14 grid gap-8 sm:grid-cols-3 lg:grid-cols-6">
            <div className="absolute left-[8%] right-[8%] top-7 hidden h-px bg-[#bbd6fa] lg:block" />
            {[ ["users", "Daftarkan Club", "Buat akun club dan lengkapi data", "/daftar?tab=club"], ["swim", "Input Atlet", "Tambah data atlet yang akan didaftarkan", "/daftar?tab=peserta"], ["ticket", "Pilih Nomor Lomba", "Pilih nomor lomba sesuai kategori atlet", "/client/login"], ["card", "Lakukan Pembayaran", "Bayar pendaftaran secara online", "/client/login"], ["trophy", "Ikuti Perlombaan", "Pantau jadwal dan ikuti perlombaan", "/login"], ["certificate", "Unduh Sertifikat", "Sertifikat digital dapat diunduh kapan saja", "/login"] ].map(([icon, title, text, href], index) => <div key={title} className="relative z-10 text-center"><a href={href} className="block"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1479ed] text-white shadow-[0_8px_18px_rgba(20,121,237,0.26)] ring-8 ring-[#f7faff]"><Icon name={icon as IconName} size={24} /></div><p className="mt-4 text-[11px] font-black text-[#0b2348]">{index + 1}.<br />{title}</p><p className="mx-auto mt-2 max-w-[140px] text-[10px] leading-4 text-[#7890af]">{text}</p></a></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-[620px] text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0878f9]">Semua yang dibutuhkan</p><h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-[#0b2348] sm:text-4xl">Fitur Utama</h2></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{features.map((feature) => <div key={feature.title} className="rounded-2xl border border-[#e3ebf5] bg-white p-5 text-center transition hover:-translate-y-1 hover:border-[#acd0ff] hover:shadow-[0_14px_28px_rgba(16,55,99,0.08)]"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf5ff] text-[#0878f9]"><Icon name={feature.icon} size={23} /></div><h3 className="mt-4 text-xs font-black text-[#0b2348]">{feature.title}</h3><p className="mt-2 text-[10px] leading-4 text-[#7185a3]">{feature.text}</p></div>)}</div>
      </section>

      <section id="hasil" className="bg-[#f7faff] px-5 py-20 lg:px-8"><div className="mx-auto max-w-[1240px]"><SectionHeading eyebrow="Performa terbaru" title="Hasil Event Terbaru" action="Lihat Semua Hasil" href="#hasil" description="Ringkasan hasil kejuaraan terbaru" /><div className="mt-6 grid gap-5 md:grid-cols-3">{recentEvents.map((event) => <article key={event.id} className="overflow-hidden rounded-2xl border border-[#e3ebf5] bg-white shadow-[0_7px_20px_rgba(16,55,99,0.04)]"><div className="relative h-32 overflow-hidden"><Image src={event.bannerUrl ?? "/hero-1.png"} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" style={{ objectPosition: "center 80%" }} /><div className="absolute inset-0 bg-[#092752]/25" /></div><div className="p-5"><h3 className="text-sm font-bold text-[#0b2348]">{event.name}</h3><div className="mt-5 grid grid-cols-3 gap-2 border-b border-slate-100 pb-4 text-center"><div><p className="text-sm font-black text-[#0b2348]">{event.athletes}</p><p className="mt-1 text-[9px] text-[#7890af]">Atlet</p></div><div><p className="text-sm font-black text-[#0b2348]">{event.clubs}</p><p className="mt-1 text-[9px] text-[#7890af]">Club</p></div><div><p className="text-sm font-black text-[#0b2348]">{event.numbers}</p><p className="mt-1 text-[9px] text-[#7890af]">Nomor Lomba</p></div></div><Link href={`/events/${event.id}/results`} className="mt-4 block rounded-lg bg-[#edf5ff] py-2.5 text-center text-[10px] font-bold text-[#086df0] transition hover:bg-[#dcecff]">Lihat Hasil</Link></div></article>)}{recentEvents.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-[#cfdcf0] px-6 py-12 text-center text-sm text-[#7890af]">Belum ada hasil event.</p>}</div></div></section>

      <section id="sertifikat" className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8"><div className="flex flex-col gap-8 rounded-3xl bg-[linear-gradient(110deg,#edf6ff,#f7fbff)] px-6 py-8 sm:px-10 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-2xl font-black tracking-[-0.04em] text-[#0b2348]">Cek Keaslian Sertifikat</h2><p className="mt-2 max-w-[330px] text-xs leading-5 text-[#7085a4]">Masukkan nomor sertifikat atau scan QR Code untuk memverifikasi keaslian sertifikat digital.</p></div><form action={verifyCertificate} className="flex w-full max-w-[600px] flex-col gap-3 sm:flex-row"><input name="certificate" required placeholder="Masukkan nomor sertifikat" className="min-w-0 flex-1 rounded-lg border border-[#dce7f3] bg-white px-4 py-3 text-sm text-[#0b2348] outline-none transition placeholder:text-[#a4b3c7] focus:border-[#0878f9] focus:ring-4 focus:ring-blue-100" /><button type="submit" className="rounded-lg bg-[#0878f9] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(8,120,249,0.2)] transition hover:bg-[#0066e8]">Verifikasi</button><span className="hidden self-center text-xs font-bold text-[#8496ae] sm:block">atau</span><Link href="/verify/scan" className="rounded-lg border border-[#0878f9] px-6 py-3 text-center text-sm font-bold text-[#0878f9] transition hover:bg-white">Scan QR Code</Link></form></div></section>

      <section className="border-t border-[#e8eef6] px-5 py-10 lg:px-8"><div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-center gap-x-14 gap-y-7 text-center"><p className="w-full text-xs font-bold text-[#516a8c]">Didukung Oleh</p><span className="text-2xl font-black tracking-[-0.12em] text-[#192238]">arena</span><span className="text-xl font-black italic tracking-[-0.08em] text-[#1f2737]">speedo</span><span className="text-xl font-black italic text-[#183f9b]">Mizuno</span><span className="text-xl font-black tracking-[-0.08em] text-[#e51b2a]">SWANS</span><span className="text-lg font-black italic text-[#1f2737]">FINIS</span><span className="text-xl font-black tracking-[-0.08em] text-[#111827]">MAD WAVE</span></div></section>

      <section className="px-5 pb-20 lg:px-8"><div className="mx-auto max-w-[1240px] overflow-hidden rounded-3xl bg-[#061c3b] px-8 py-14 text-center text-white sm:px-14"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#53d8ff]">Siap bertanding?</p><h2 className="mx-auto mt-3 max-w-[540px] text-3xl font-black tracking-[-0.045em] sm:text-4xl">Daftarkan Club & Peserta Sekarang</h2><p className="mx-auto mt-4 max-w-[460px] text-sm leading-6 text-blue-100/75">Gabung ke kejuaraan renang berikutnya. Pendaftaran club dan peserta dibuka sekarang — gratis dan cepat.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/daftar?tab=club" className="rounded-lg bg-[#0878f9] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(8,120,249,0.3)] transition hover:-translate-y-1 hover:bg-[#1687ff]">Daftar Club</Link><Link href="/daftar?tab=peserta" className="rounded-lg border border-white/50 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15">Daftar Peserta</Link></div></div></section>

      <footer id="kontak" className="bg-[#041d3e] px-5 pb-6 pt-12 text-blue-50 lg:px-8"><div className="mx-auto grid max-w-[1240px] gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr_1.2fr]"><div><Link href="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d4c91] text-[#53d8ff]"><Icon name="waves" size={25} /></span><span><strong className="block text-sm tracking-tight">SWIM EVENT</strong><small className="text-[7px] uppercase tracking-[0.16em] text-blue-200/70">Management Platform</small></span></Link><p className="mt-5 max-w-[260px] text-xs leading-5 text-blue-100/65">Platform digital untuk manajemen kejuaraan renang yang modern, cepat, dan terpercaya.</p><div className="mt-5 flex gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs">f</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs">◎</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs">▶</span></div></div><div><h3 className="text-xs font-bold text-white">Menu</h3><div className="mt-4 space-y-2 text-xs text-blue-100/65"><a href="#beranda" className="block hover:text-white">Beranda</a><a href="#events" className="block hover:text-white">Event</a><a href="#hasil" className="block hover:text-white">Hasil</a><a href="#sertifikat" className="block hover:text-white">Sertifikat</a><a href="#tentang" className="block hover:text-white">Tentang Kami</a></div></div><div><h3 className="text-xs font-bold text-white">Informasi</h3><div className="mt-4 space-y-2 text-xs text-blue-100/65"><a href="#tentang" className="block hover:text-white">Cara Kerja</a><a href="#tentang" className="block hover:text-white">Kebijakan Privasi</a><a href="#tentang" className="block hover:text-white">Syarat & Ketentuan</a><a href="#kontak" className="block hover:text-white">FAQ</a><a href="#kontak" className="block hover:text-white">Kontak</a></div></div><div><h3 className="text-xs font-bold text-white">Kontak Kami</h3><div className="mt-4 space-y-3 text-xs leading-5 text-blue-100/65"><p>⌖ Jl. Aquatic Center No.1<br />Jakarta Indonesia 10270</p><p>◌ +62 812-3456-7890</p><p>✉ info@swimevent.id</p></div></div></div><div className="mx-auto mt-10 max-w-[1240px] border-t border-white/10 pt-5 text-center text-[11px] text-blue-100/45">© 2026 Swim Event Management Platform. All rights reserved.</div></footer>
    </main>
  );
}

function SectionHeading({ eyebrow, title, action, href, description }: { eyebrow: string; title: string; action: string; href: string; description: string }) {
  return <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0878f9]">{eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-[#0b2348] sm:text-3xl">{title}</h2><p className="mt-2 text-xs text-[#7890af]">{description}</p></div><a href={href} className="hidden shrink-0 text-xs font-bold text-[#0878f9] sm:block">{action} <span className="ml-1">→</span></a></div>;
}
