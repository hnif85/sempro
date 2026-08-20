export const ROLES = {
  super_admin: "super_admin",
  admin_event: "admin_event",
  club_manager: "club_manager",
  club_coach: "club_coach",
  official: "official",
  peserta: "peserta",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = Object.values(ROLES);

export const ADMIN_ROLES: Role[] = [ROLES.super_admin, ROLES.admin_event];

export const CLUB_ROLES: Role[] = [ROLES.club_manager, ROLES.club_coach];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin_event: "Admin Event",
  club_manager: "Manager Club",
  club_coach: "Pelatih / PIC Club",
  official: "Official",
  peserta: "Peserta",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Pemilik platform — akses penuh seluruh sistem",
  admin_event: "Penyelenggara event — kelola event, peserta, dan perlombaan",
  club_manager: "Penanggung jawab club — data club, atlet, registrasi, dan pembayaran",
  club_coach: "Pelatih / PIC — kelola atlet dan daftarkan atlet, tanpa akses pembayaran",
  official: "Petugas perlombaan — kelola heat & hasil pada event yang ditugaskan",
  peserta: "Atlet individu — daftar nomor dan lihat hasil sendiri",
};

export type NavItem = { href: string; label: string };

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  super_admin: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/events", label: "Event" },
    { href: "/clubs", label: "Club / Sekolah" },
    { href: "/athletes", label: "Data Atlet" },
    { href: "/users", label: "Data Pengguna" },
    { href: "/reference", label: "Data Referensi" },
  ],
  admin_event: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/events", label: "Event" },
    { href: "/clubs", label: "Club / Sekolah" },
    { href: "/athletes", label: "Data Atlet" },
    { href: "/reference", label: "Data Referensi" },
  ],
  club_manager: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/events", label: "Event" },
    { href: "/athletes", label: "Data Atlet" },
  ],
  club_coach: [
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

export function isAdmin(role: string | null | undefined): boolean {
  return role === ROLES.super_admin || role === ROLES.admin_event;
}

export function isClubRole(role: string | null | undefined): boolean {
  return role === ROLES.club_manager || role === ROLES.club_coach;
}

export function canManageResults(role: string | null | undefined): boolean {
  return isAdmin(role) || role === ROLES.official;
}

export function canManageBilling(role: string | null | undefined): boolean {
  return isAdmin(role) || role === ROLES.club_manager;
}

export function canRegisterAthletes(role: string | null | undefined): boolean {
  return isAdmin(role) || isClubRole(role);
}

export function navForRole(role: string | null | undefined): NavItem[] {
  if (role && role in NAV_BY_ROLE) return NAV_BY_ROLE[role as Role];
  return NAV_BY_ROLE.club_manager;
}

export function roleLabel(role: string | null | undefined): string {
  if (role && role in ROLE_LABELS) return ROLE_LABELS[role as Role];
  return role ?? "-";
}