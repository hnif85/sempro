import Link from "next/link";
import { loadPesertaData } from "@/lib/peserta-data";
import { Icon, MetricCard, SectionHeading, SuccessMessage, DesktopStat, NoAthleteNotice, medalEmoji } from "@/components/peserta/ui";

export default async function PesertaPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const sp = await searchParams;
  const data = await loadPesertaData();

  if (!data.athleteId) {
    return <NoAthleteNotice />;
  }

  const { profile, pbs, best, totalMedals, totalEvents, totalNumbers, openEvents, achievements } = data;
  const clubName = profile?.clubs?.name ?? "-";
  const genderLabel = profile?.gender === "putri" ? "Putri" : profile?.gender === "putra" ? "Putra" : "-";
  const nearestEvent = openEvents[0];

  return (
    <>
      <div className="-mx-4 -mt-4 min-h-screen bg-[#f5f8ff] pb-28 md:hidden">
        <div className="text-[#102353]">
          <section
            className="relative overflow-hidden rounded-b-[2rem] bg-[#d9efff] bg-cover bg-[position:68%_center]"
            style={{
              backgroundImage: "linear-gradient(90deg, rgba(255,255,255,.95) 0%, rgba(255,255,255,.7) 40%, rgba(255,255,255,.05) 80%), url('/hero-putri-mobile.png.png')",
            }}
          >
            {sp.registered && <div className="relative z-10 mx-4 mt-4"><SuccessMessage /></div>}

            <section className="relative z-10 mx-4 mt-4 grid grid-cols-2 gap-3 pb-6">
              <div className="flex items-center gap-3 rounded-2xl border border-white/40 bg-white/60 p-4 shadow-[0_8px_24px_rgba(28,74,137,.05)] backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50"><Icon name="medal" className="h-5 w-5 text-amber-500" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Ranking Klub</p>
                  <p className="truncate text-lg font-bold">—</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/40 bg-white/60 p-4 shadow-[0_8px_24px_rgba(28,74,137,.05)] backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50"><Icon name="swim" className="h-5 w-5 text-blue-600" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Personal Best</p>
                  <p className="truncate text-lg font-bold">{best?.result_time ?? "—"}</p>
                </div>
              </div>
            </section>
          </section>

          <div className="space-y-5 px-4 pt-5">
            <section className="grid grid-cols-2 gap-3">
              <MetricCard icon="stopwatch" label="PB Aktif" value={pbs.length} detail="Nomor" tone="blue" />
              <MetricCard icon="medal" label="Medali" value={totalMedals} detail="Total" tone="green" />
              <MetricCard icon="calendar" label="Event" value={totalEvents} detail="Tahun ini" tone="purple" />
              <MetricCard icon="trophy" label="Ranking Klub" value="—" detail="Belum tersedia" tone="orange" />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(28,74,137,.05)]">
              <SectionHeading icon="calendar" title="Event Terdekat" action="Lihat Semua" actionHref="/peserta/event" />
              {nearestEvent ? (
                <Link href={`/event/${nearestEvent.id}`} className="flex items-start gap-3 p-4 transition-colors active:bg-slate-50">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#06285f] to-[#0c55b8] text-center text-[9px] font-bold leading-tight text-white">SEMP<br />OPEN</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold">{nearestEvent.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{nearestEvent.start_date ?? "Tanggal menyusul"}</p>
                    <p className="truncate text-sm text-slate-500">{nearestEvent.location ?? "Lokasi menyusul"}</p>
                  </div>
                  <span className="shrink-0 text-xl text-slate-400">›</span>
                </Link>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-3xl">🏊</p>
                  <p className="mt-2 text-sm font-semibold">Belum ada event</p>
                  <p className="mt-1 text-xs text-slate-500">Tidak ada event yang dibuka pendaftarannya saat ini.</p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(28,74,137,.05)]">
              <SectionHeading icon="trophy" title="Prestasi" action="Lihat Semua" actionHref="/peserta/prestasi" />
              <div className="divide-y divide-slate-100 px-4">
                {achievements.slice(0, 5).map((achievement, index) => (
                  <div key={`${achievement.event_id}-${achievement.number_name}-${index}`} className="flex items-center gap-3 py-3">
                    <span className="text-2xl">{medalEmoji(achievement.place)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">Juara {achievement.place}</p>
                      <p className="truncate text-xs text-slate-500">{achievement.event_name ?? "Event"}</p>
                    </div>
                    <p className="shrink-0 text-xs text-slate-400">{achievement.number_name}</p>
                  </div>
                ))}
                {achievements.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-400">Belum ada prestasi. Ayo raih medali pertamamu!</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="hidden space-y-8 md:block">
        <div>
          <h1 className="text-2xl font-semibold">Halo, {profile?.full_name ?? "Atlet"}</h1>
          <p className="text-zinc-500">
            {clubName} · {genderLabel} · {profile?.birth_date ?? "-"}
          </p>
        </div>

        {sp.registered && <SuccessMessage />}

        <div className="grid gap-4 md:grid-cols-3">
          <DesktopStat label="Total Event" value={totalEvents} />
          <DesktopStat label="Total Nomor" value={totalNumbers} />
          <DesktopStat label="Total Medali" value={totalMedals} accent />
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <h2 className="text-base font-semibold">Event Terdekat</h2>
            <Link href="/peserta/event" className="text-sm text-primary hover:underline">Lihat Semua</Link>
          </div>
          <div className="p-6">
            {nearestEvent ? (
              <Link href={`/event/${nearestEvent.id}`} className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#06285f] to-[#0c55b8] text-center text-[10px] font-bold leading-tight text-white">SEMP</div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{nearestEvent.name}</p>
                  <p className="text-sm text-zinc-500">{nearestEvent.start_date ?? "-"} · {nearestEvent.location ?? "-"}</p>
                </div>
                <span className="text-zinc-400">›</span>
              </Link>
            ) : (
              <p className="text-center text-sm text-zinc-400">Belum ada event yang dibuka pendaftarannya.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <h2 className="text-base font-semibold">Prestasi</h2>
            <Link href="/peserta/prestasi" className="text-sm text-primary hover:underline">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {achievements.slice(0, 5).map((achievement, index) => (
              <div key={`${achievement.event_id}-${achievement.number_name}-${index}`} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medalEmoji(achievement.place)}</span>
                  <div>
                    <p className="font-medium">Juara {achievement.place}</p>
                    <p className="text-sm text-zinc-500">{achievement.event_name}</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-500">{achievement.number_name}</p>
              </div>
            ))}
            {achievements.length === 0 && <p className="px-6 py-8 text-center text-zinc-400">Belum ada prestasi.</p>}
          </div>
        </section>
      </div>

    </>
  );
}
