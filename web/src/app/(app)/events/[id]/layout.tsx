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
        counts={{ numbers: numberCount, registrations: regCount }}
      />
      {children}
    </div>
  );
}
