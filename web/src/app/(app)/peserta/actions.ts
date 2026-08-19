"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAuthenticatedRegistration } from "@/app/event/[id]/actions";

export async function registerPeserta(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("athlete_id")
    .eq("id", user.id)
    .single();
  const athleteId = profile?.athlete_id;
  if (!athleteId) throw new Error("Akun belum terhubung ke data atlet");

  formData.set("athlete_id", athleteId);
  await createAuthenticatedRegistration(formData);
}
