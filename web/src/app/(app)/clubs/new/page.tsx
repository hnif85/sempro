import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClub } from "../actions";
import LocationPicker from "@/components/LocationPicker";

export default async function NewClubPage() {
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
  if (!isAdmin) redirect("/clubs");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tambah Club</h1>
        <p className="text-zinc-500">Data club / sekolah peserta</p>
      </div>

      <form action={createClub} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Nama Club *</label>
          <input
            name="name"
            required
            placeholder="Contoh: Tirta Sport Club"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nama PIC / Pelatih</label>
          <input
            name="pic_name"
            placeholder="Nama penanggung jawab"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nomor WhatsApp</label>
          <input
            name="whatsapp"
            placeholder="Contoh: 081234567890"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Kota / Lokasi</label>
          <LocationPicker fieldPrefix="loc" placeholder="Cari kota / kecamatan (mis. Pondok Aren)…" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Sekolah (Opsional)</label>
          <input
            name="school"
            placeholder="Nama sekolah bila dari sekolah"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Simpan
          </button>
          <Link
            href="/clubs"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}