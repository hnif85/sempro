"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./ui";

export const PESERTA_NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/peserta", label: "Beranda", icon: "badge" },
  { href: "/peserta/event", label: "Event", icon: "calendar" },
  { href: "/peserta/hasil", label: "Hasil", icon: "stopwatch" },
  { href: "/peserta/prestasi", label: "Prestasi", icon: "trophy" },
  { href: "/peserta/profil", label: "Profil", icon: "user" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 rounded-t-[1.8rem] border-t border-slate-200/80 bg-white/95 px-2 pb-[calc(0.6rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(10,48,103,.1)] backdrop-blur md:hidden">
      {PESERTA_NAV.map((item) => {
        const active =
          (item.href === "/peserta/event" && pathname.startsWith("/event")) ||
          (item.href === "/peserta" ? pathname === "/peserta" : pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${active ? "text-blue-600" : "text-slate-500"}`}
          >
            <Icon name={item.icon} className="h-6 w-6" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
