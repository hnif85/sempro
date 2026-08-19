import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { BottomNav } from "@/components/peserta/bottom-nav";

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

  const profileHref = profile?.role === "peserta" ? "/peserta/profil" : undefined;

  return (
    <AppShell
      fullName={profile?.full_name ?? "User"}
      profileHref={profileHref}
      bottomNav={profile?.role === "peserta" ? <BottomNav /> : undefined}
    >
      {children}
    </AppShell>
  );
}
