"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/auth/actions";

function AvatarIcon({ name }: { name: string }) {
  const initial = (name.trim().charAt(0) || "U").toUpperCase();
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
      {initial}
    </span>
  );
}

export function AppShell({
  fullName,
  profileHref,
  children,
}: {
  fullName: string;
  profileHref?: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">S</div>
          <span className="text-sm font-semibold">SEMP</span>
          <span className="truncate text-sm text-zinc-500">· {fullName}</span>
        </div>

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
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                <div className="border-b border-zinc-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold">{fullName}</p>
                </div>
                {profileHref && (
                  <Link
                    href={profileHref}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M5 20a7 7 0 0 1 14 0" />
                    </svg>
                    Profil
                  </Link>
                )}
                <form action={logout} className="border-t border-zinc-100">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
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
      </header>
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}