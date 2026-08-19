import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

type ProfileData = {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  clubs: { id: string; name: string | null } | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, clubs(id, name)")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "peserta") redirect("/dashboard");

  const data = profile as unknown as ProfileData | null;

  return (
    <div className="mx-auto max-w-2xl pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#102353]">Profil Saya</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola informasi profil Anda</p>
      </div>

      <ProfileForm userId={user.id} data={data} />

      <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(28,74,137,.05)]">
        <h2 className="mb-4 text-base font-bold text-[#102353]">Informasi Akun</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Role</span>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Peserta</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Club</span>
            <span className="font-medium">{data?.clubs?.name ?? "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}