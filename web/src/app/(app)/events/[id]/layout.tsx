import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EventTabs from "@/components/EventTabs";

export default async function EventDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin_event";
  const { data: officialAssignment } = profile?.role === "official"
    ? await supabase.from("event_officials").select("id").eq("event_id", id).eq("user_id", user.id).maybeSingle()
    : { data: null };
  const isOfficial = profile?.role === "official" && Boolean(officialAssignment);
  if (profile?.role === "official" && !isOfficial) redirect("/events");

  const { count: numberCount } = await supabase
    .from("event_numbers")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  const { count: regCount } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  return (
    <div className="space-y-6">
      <EventTabs
        eventId={id}
        isAdmin={isAdmin}
        isOfficial={isOfficial}
        counts={{ numbers: numberCount, registrations: regCount }}
      />
      {children}
    </div>
  );
}
