"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function EventTabs({
  eventId,
  isAdmin = false,
  isOfficial = false,
  counts,
}: {
  eventId: string;
  isAdmin?: boolean;
  isOfficial?: boolean;
  counts?: { numbers?: number | null; registrations?: number | null };
}) {
  const pathname = usePathname();

  const adminTabs = [
    ...(isAdmin
      ? [{ href: `/events/${eventId}/edit`, label: "Edit Event" }]
      : []),
    { href: `/events/${eventId}/numbers`, label: "Nomor Lomba", count: counts?.numbers },
    { href: `/events/${eventId}/registrations`, label: "Registrasi", count: counts?.registrations },
    { href: `/events/${eventId}/schedule`, label: "Susunan Acara" },
    { href: `/events/${eventId}/heats`, label: "Heat & Seeding" },
    { href: `/events/${eventId}/invoices`, label: "Pembayaran" },
    { href: `/events/${eventId}/results`, label: "Hasil & Ranking" },
    { href: `/events/${eventId}/certificates`, label: "Sertifikat" },
    { href: `/events/${eventId}/sponsors`, label: "Sponsor" },
    { href: `/events/${eventId}/docs`, label: "Dokumentasi" },
    { href: `/events/${eventId}/print/book`, label: "Cetak Buku Acara" },
    { href: `/events/${eventId}/print/results`, label: "Cetak Hasil" },
  ];
  const tabs = isOfficial
    ? adminTabs.filter((tab) => ["Nomor Lomba", "Registrasi", "Susunan Acara", "Heat & Seeding", "Hasil & Ranking", "Cetak Hasil"].includes(tab.label))
    : adminTabs;

  return (
    <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-px">
      {tabs.map((t) => {
        const isActive = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              isActive
                ? "rounded-t-lg border-b-2 border-primary px-4 py-2 text-sm font-medium text-primary"
                : "rounded-t-lg border-b-2 border-transparent px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-primary hover:text-primary"
            }
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className="ml-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
