import Link from "next/link";
import type { Result } from "@/lib/peserta-data";

export type IconName =
  | "medal"
  | "swim"
  | "calendar"
  | "badge"
  | "stopwatch"
  | "trophy"
  | "user"
  | "bell";

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "medal":
      return (
        <svg {...common}>
          <path d="m8 3 2 4h4l2-4" />
          <circle cx="12" cy="13" r="5" />
          <path d="m9.8 13 1.5 1.5 2.9-3" />
        </svg>
      );
    case "swim":
      return (
        <svg {...common}>
          <circle cx="16.5" cy="5.5" r="2" />
          <path d="m14.8 8-4.5 3 2.7 2.4 3.5-2.1" />
          <path d="m10.3 11-4.1 1.4M4 16c2.2 1.6 4.2 1.6 6.3 0 2.2 1.6 4.2 1.6 6.4 0 1.4 1 2.4 1.2 3.3 1.1" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M7.5 3v4M16.5 3v4M3.5 9h17" />
          <path d="M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01" strokeWidth="2.5" />
        </svg>
      );
    case "badge":
      return (
        <svg {...common}>
          <path d="M6 4.5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" />
          <circle cx="9" cy="10" r="2" />
          <path d="M13 9h4M13 12h3M7 16h10" />
        </svg>
      );
    case "stopwatch":
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="7" />
          <path d="M12 6V3M9.5 3h5M17 8l1.5-1.5M12 13V9M12 13l2.5 1.5" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...common}>
          <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
          <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 12v4M8 20h8M9 16h6" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
      );
  }
}

export function MetricCard({ icon, label, value, detail, tone }: { icon: IconName; label: string; value: number | string; detail: string; tone: "blue" | "green" | "purple" | "orange" }) {
  const tones = {
    blue: "border-blue-100 bg-blue-50/40 text-blue-700",
    green: "border-emerald-100 bg-emerald-50/40 text-emerald-700",
    purple: "border-violet-100 bg-violet-50/40 text-violet-700",
    orange: "border-orange-100 bg-orange-50/40 text-orange-700",
  };
  const bubbles = { blue: "bg-blue-100", green: "bg-emerald-100", purple: "bg-violet-100", orange: "bg-orange-100" };
  return (
    <div className={`rounded-2xl border p-3 ${tones[tone]}`}>
      <div className="flex items-center gap-2.5">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bubbles[tone]}`}>
          <Icon name={icon} className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{label}</p>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <p className="text-2xl font-bold leading-none text-[#102353]">{value}</p>
            <p className="truncate text-[10px] text-slate-500">{detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionHeading({ icon, title, action, actionHref }: { icon: IconName; title: string; action?: string; actionHref?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
      <Icon name={icon} className="h-5 w-5 text-blue-600" />
      <h2 className="min-w-0 flex-1 truncate text-base font-bold">{title}</h2>
      {action && actionHref && <Link href={actionHref} className="shrink-0 text-xs font-semibold text-blue-600">{action}</Link>}
    </div>
  );
}

export function ProgressGraphic({ values }: { values?: string[] }) {
  return (
    <div className="pt-4">
      <svg viewBox="0 0 320 120" className="h-28 w-full overflow-visible">
        <defs>
          <linearGradient id="pbFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#2563eb" stopOpacity=".2" />
            <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M18 91 C80 70, 117 75, 170 55 S250 44, 302 28 L302 105 L18 105Z" fill="url(#pbFill)" />
        <path d="M18 91 C80 70, 117 75, 170 55 S250 44, 302 28" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
        {[{ x: 18, y: 91 }, { x: 170, y: 55 }, { x: 302, y: 28 }].map((point) => <circle key={point.x} cx={point.x} cy={point.y} r="5" fill="#2563eb" stroke="white" strokeWidth="3" />)}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{values?.[values.length - 1] ?? "Belum ada data"}</span>
        <span>{values?.[0] ?? "-"}</span>
      </div>
    </div>
  );
}

export function medalEmoji(place: number | null) {
  if (place === 1) return "🥇";
  if (place === 2) return "🥈";
  if (place === 3) return "🥉";
  return "🏅";
}

export function SuccessMessage() {
  return <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Pendaftaran berhasil diajukan. Menunggu verifikasi panitia.</p>;
}

export function DesktopStat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return <div className={`rounded-xl border p-5 ${accent ? "border-amber-100 bg-amber-50" : "border-zinc-200 bg-white"}`}><p className={`text-sm ${accent ? "text-amber-700" : "text-zinc-500"}`}>{label}</p><p className={`mt-1 text-2xl font-semibold ${accent ? "text-amber-800" : ""}`}>{value}</p></div>;
}

export function DesktopResults({ pbs, results }: { pbs: { name: string; list: Result[] }[]; results: Result[] }) {
  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4"><h2 className="text-base font-semibold">Personal Best</h2></div>
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left"><tr><th className="px-6 py-3 font-medium">Nomor</th><th className="px-6 py-3 font-medium">Waktu Terbaik</th><th className="px-6 py-3 font-medium">Event</th></tr></thead>
          <tbody className="divide-y divide-zinc-50">
            {pbs.map((pb) => <tr key={pb.name}><td className="px-6 py-3 font-medium">{pb.name}</td><td className="px-6 py-3">{pb.list[0]?.result_time}</td><td className="px-6 py-3 text-zinc-500">{pb.list[0]?.event_name}</td></tr>)}
            {pbs.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-zinc-400">Belum ada hasil tercatat.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4"><h2 className="text-base font-semibold">Riwayat Lomba</h2></div>
        <div className="divide-y divide-zinc-100">
          {results.map((result, index) => <div key={`${result.event_id}-${result.number_name}-${index}`} className="flex items-center justify-between px-6 py-4"><div><p className="font-medium">{result.number_name}</p><p className="text-sm text-zinc-500">{result.event_name}</p></div><div className="text-right"><p className="font-medium">{result.result_time}</p><p className="text-sm text-zinc-500">{result.place ? `Juara ${result.place}` : "-"}</p></div></div>)}
          {results.length === 0 && <p className="px-6 py-8 text-center text-zinc-400">Belum ada riwayat lomba.</p>}
        </div>
      </div>
    </>
  );
}

export function NoAthleteNotice() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Profil Peserta</h1>
      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
        Akun ini belum terhubung ke data atlet. Hubungi panitia untuk menghubungkan akun Anda dengan data atlet.
      </p>
    </div>
  );
}
