import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getEventRole(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? null;
  let officialAssigned = false;
  if (role === "official") {
    const { data: assignment } = await supabase
      .from("event_officials")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();
    officialAssigned = Boolean(assignment);
  }

  return { supabase, user, role, officialAssigned };
}

export async function requireTechnicalEventAccess(eventId: string) {
  const access = await getEventRole(eventId);
  const allowed = access.role === "super_admin" || access.role === "admin_event" || (access.role === "official" && access.officialAssigned);
  if (!allowed) throw new Error("Anda tidak memiliki akses teknis ke event ini.");
  return access;
}

export async function requireEventManager(eventId: string) {
  const access = await getEventRole(eventId);
  const allowed = access.role === "super_admin" || access.role === "admin_event";
  if (!allowed) throw new Error("Hanya admin event yang dapat melakukan aksi ini.");
  return access;
}
