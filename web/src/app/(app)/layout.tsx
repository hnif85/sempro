import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

const NAV_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  super_admin: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/events", label: "Event" },
    { href: "/clubs", label: "Club / Sekolah" },
    { href: "/athletes", label: "Data Atlet" },
    { href: "/users", label: "Data Pengguna" },
    { href: "/reference", label: "Data Referensi" },
    { href: "/daftar", label: "Pendaftaran" },
  ],
  admin_event: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/events", label: "Event" },
    { href: "/clubs", label: "Club / Sekolah" },
    { href: "/athletes", label: "Data Atlet" },
    { href: "/reference", label: "Data Referensi" },
    { href: "/daftar", label: "Pendaftaran" },
  ],
  club_manager: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/events", label: "Event" },
    { href: "/athletes", label: "Data Atlet" },
  ],
  official: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/events", label: "Event Saya" },
  ],
  peserta: [{ href: "/peserta", label: "Profil Saya" }],
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "club_manager";
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.club_manager;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-zinc-200 bg-white">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            SEMP
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">SEMP</p>
            <p className="text-xs text-zinc-500">Swimming Organizer</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-zinc-200 px-4 py-4">
          <p className="truncate text-sm font-medium">{profile?.full_name ?? "User"}</p>
          <p className="mb-3 truncate text-xs capitalize text-zinc-500">
            {profile?.role ?? "-"}
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <main className="ml-60 flex-1 p-8">{children}</main>
    </div>
  );
}