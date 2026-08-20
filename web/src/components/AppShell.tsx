"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { navForRole } from "@/lib/rbac";
import { BottomNav, PESERTA_NAV } from "@/components/peserta/bottom-nav";
import { Icon, type IconName } from "@/components/peserta/ui";

const SIDEBAR_ICONS: Record<string, IconName> = {
  "/dashboard": "home",
  "/events": "calendar",
  "/clubs": "users",
  "/athletes": "swim",
  "/users": "user",
  "/reference": "file",
  "/peserta": "badge",
  "/peserta/event": "calendar",
  "/peserta/hasil": "stopwatch",
  "/peserta/prestasi": "trophy",
  "/peserta/profil": "user",
};

function isNavActive(href: string, pathname: string, isPeserta: boolean) {
  if (isPeserta && href === "/peserta/event" && pathname.startsWith("/event")) return true;
  return pathname === href || pathname.startsWith(href + "/");
}

function AvatarIcon({ name, className = "" }: { name: string; className?: string }) {
  const initial = (name.trim().charAt(0) || "U").toUpperCase();
  return (
    <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white ${className}`}>
      {initial}
    </span>
  );
}

export function AppShell({
  fullName,
  role,
  children,
}: {
  fullName: string;
  role?: string | null;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isPeserta = role === "peserta";
  const profileHref = isPeserta ? "/peserta/profil" : undefined;

  const navItems = isPeserta
    ? PESERTA_NAV.map(({ href, label }) => ({ href, label }))
    : navForRole(role);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">S</div>
          <span className="text-sm font-semibold">SEMP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Menu akun"
              className="rounded-full ring-2 ring-transparent transition hover:ring-primary/40"
            >
              <AvatarIcon name={fullName} />
            </button>

            {menuOpen && (
              <>
                <button type="button" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 cursor-default" />
                <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                  <div className="border-b border-zinc-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold">{fullName}</p>
                  </div>
                  {profileHref && (
                    <Link href={profileHref} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M5 20a7 7 0 0 1 14 0" />
                      </svg>
                      Profil
                    </Link>
                  )}
                  <form action={logout} className="border-t border-zinc-100">
                    <button type="submit" className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      Keluar
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-gradient-to-b from-[#082d5a] to-[#0b5ca8] text-white md:flex">
        <div className="px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="16.5" cy="5.5" r="2" />
                <path d="m14.8 8-4.5 3 2.7 2.4 3.5-2.1" />
                <path d="m10.3 11-4.1 1.4M4 16c2.2 1.6 4.2 1.6 6.3 0 2.2 1.6 4.2 1.6 6.4 0 1.4 1 2.4 1.2 3.3 1.1" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold tracking-wide">SEMP</p>
              <p className="text-[10px] font-medium tracking-widest text-white/60 uppercase">Championship 2026</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const active = isNavActive(item.href, pathname, isPeserta);
            const iconName = SIDEBAR_ICONS[item.href] ?? "calendar";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-white text-[#082d5a]" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon name={iconName} className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <AvatarIcon name={fullName} className="bg-white/20" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{fullName}</p>
              <p className="truncate text-xs text-white/60">{role === "super_admin" ? "Super Admin" : role === "admin_event" ? "Admin Event" : role === "club_manager" ? "Manager Club" : role === "official" ? "Official" : "Peserta"}</p>
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="md:pl-64">
        <main className={`p-4 md:p-8 ${isPeserta ? "pb-24 md:pb-8" : ""}`}>{children}</main>
      </div>

      {isPeserta && <BottomNav />}
    </div>
  );
}
