export const ROLES = {
  super_admin: "super_admin",
  admin_event: "admin_event",
  club_manager: "club_manager",
  official: "official",
  peserta: "peserta",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_ROLES: Role[] = [ROLES.super_admin, ROLES.admin_event];

export function isAdmin(role: string | null | undefined): boolean {
  return role === ROLES.super_admin || role === ROLES.admin_event;
}

export function canManageResults(role: string | null | undefined): boolean {
  return isAdmin(role) || role === ROLES.official;
}
