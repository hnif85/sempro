import { loadPesertaData } from "@/lib/peserta-data";
import { Icon, SectionHeading, NoAthleteNotice, medalEmoji } from "@/components/peserta/ui";
import { BottomNav } from "@/components/peserta/bottom-nav";

export default async function PesertaPrestasiPage() {
  const data = await loadPesertaData();
  if (!data.athleteId) return <NoAthleteNotice />;

  const { achievements } = data;

  return (
    <>
      <div className="-mx-4 -mt-4 min-h-screen bg-[#f5f8ff] pb-28 md:hidden">
        <div className="space-y-5 px-4 pt-5 text-[#102353]">
          <div className="flex items-center gap-2">
            <Icon name="trophy" className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Prestasi</h1>
          </div>

          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(28,74,137,.05)]">
            <SectionHeading icon="trophy" title="Prestasi Terbaru" />
            <div className="divide-y divide-slate-100 px-4">
              {achievements.map((achievement, index) => (
                <div key={`${achievement.event_id}-${achievement.number_name}-${index}`} className="flex items-center gap-3 py-3">
                  <span className="text-2xl">{medalEmoji(achievement.place)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">Juara {achievement.place}</p>
                    <p className="truncate text-xs text-slate-500">{achievement.event_name ?? "Event"}</p>
                  </div>
                  <p className="shrink-0 text-xs text-slate-400">{achievement.number_name}</p>
                </div>
              ))}
              {achievements.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Belum ada prestasi.</p>}
            </div>
          </section>
        </div>
      </div>

      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold">Prestasi</h1>
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white">
          <div className="divide-y divide-zinc-100">
            {achievements.map((achievement, index) => (
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
        </div>
      </div>

      <BottomNav />
    </>
  );
}
