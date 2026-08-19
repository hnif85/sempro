import { loadPesertaData } from "@/lib/peserta-data";
import { Icon, SectionHeading, ProgressGraphic, DesktopResults, NoAthleteNotice } from "@/components/peserta/ui";
import { BottomNav } from "@/components/peserta/bottom-nav";

export default async function PesertaHasilPage() {
  const data = await loadPesertaData();
  if (!data.athleteId) return <NoAthleteNotice />;

  const { pbs, results } = data;

  return (
    <>
      <div className="-mx-4 -mt-4 min-h-screen bg-[#f5f8ff] pb-28 md:hidden">
        <div className="space-y-5 px-4 pt-5 text-[#102353]">
          <div className="flex items-center gap-2">
            <Icon name="stopwatch" className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Hasil</h1>
          </div>

          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(28,74,137,.05)]">
            <SectionHeading icon="user" title="Personal Best (PB)" />
            <div className="divide-y divide-slate-100 px-4">
              {pbs.map((pb, index) => (
                <div key={pb.name} className="flex items-center gap-3 py-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${index % 3 === 0 ? "bg-blue-50 text-blue-600" : index % 3 === 1 ? "bg-violet-50 text-violet-600" : "bg-emerald-50 text-emerald-600"}`}><Icon name="swim" className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{pb.name}</p>
                    <p className={`text-xs ${index === 0 ? "font-semibold text-emerald-600" : "text-slate-500"}`}>{index === 0 ? "PB Terbaru" : "PB"}</p>
                  </div>
                  <p className="text-base font-bold tracking-tight">{pb.list[0]?.result_time ?? "-"}</p>
                </div>
              ))}
              {pbs.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Belum ada hasil tercatat.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(28,74,137,.05)]">
            <SectionHeading icon="stopwatch" title={`Progress ${pbs[0]?.name ?? "PB"}`} />
            <ProgressGraphic values={pbs[0]?.list.slice(0, 3).map((item) => item.result_time).filter(Boolean) as string[] | undefined} />
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(28,74,137,.05)]">
            <SectionHeading icon="badge" title="Riwayat Lomba" />
            <div className="divide-y divide-slate-100 px-4">
              {results.map((result, index) => (
                <div key={`${result.event_id}-${result.number_name}-${index}`} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{result.number_name}</p>
                    <p className="truncate text-xs text-slate-500">{result.event_name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold">{result.result_time}</p>
                    <p className="text-xs text-slate-500">{result.place ? `Juara ${result.place}` : "-"}</p>
                  </div>
                </div>
              ))}
              {results.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Belum ada riwayat lomba.</p>}
            </div>
          </section>
        </div>
      </div>

      <div className="hidden space-y-8 md:block">
        <h1 className="text-2xl font-semibold">Hasil</h1>
        <DesktopResults pbs={pbs} results={results} />
      </div>

      <BottomNav />
    </>
  );
}
