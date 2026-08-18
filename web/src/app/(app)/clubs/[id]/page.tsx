import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateClub, deleteClub } from "../actions";
import LocationPicker from "@/components/LocationPicker";

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: club } = await supabase.from("clubs").select("*").eq("id", id).single();
  if (!club) notFound();

  const { data: athletes } = await supabase
    .from("athletes")
    .select("*")
    .eq("club_id", id)
    .order("name");

  const statuses = ["draft", "complete", "finalized"];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/clubs" className="text-sm text-primary hover:underline">
          ← Semua Club
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{club.name}</h1>
        <p className="text-zinc-500">
          {club.pic_name ?? "-"} · {club.whatsapp ?? "-"} · {club.city ?? "-"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={updateClub} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
          <input type="hidden" name="id" value={id} />
          <h2 className="text-base font-semibold">Edit Data Club</h2>
          <div>
            <label className="mb-1 block text-sm font-medium">Nama Club *</label>
            <input
              name="name"
              required
              defaultValue={club.name}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">PIC</label>
              <input
                name="pic_name"
                defaultValue={club.pic_name ?? ""}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">WhatsApp</label>
              <input
                name="whatsapp"
                defaultValue={club.whatsapp ?? ""}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Kota / Lokasi</label>
              <LocationPicker
                fieldPrefix="loc"
                initial={{
                  id: club.destination_id ?? undefined,
                  label: club.city
                    ? [club.subdistrict_name, club.district_name, club.city_name, club.province_name]
                        .filter(Boolean)
                        .join(", ") ||
                      club.city
                    : "",
                  province_name: club.province_name ?? "",
                  city_name: club.city_name ?? "",
                  district_name: club.district_name ?? "",
                  subdistrict_name: club.subdistrict_name ?? "",
                  zip_code: club.zip_code ?? "",
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Sekolah</label>
              <input
                name="school"
                defaultValue={club.school ?? ""}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              name="status"
              defaultValue={club.status}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm capitalize focus:border-primary focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-400">
              Setelah finalisasi, data tidak dapat diubah tanpa persetujuan admin.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Simpan
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-1 text-base font-semibold">Token Akses Web Client</h2>
          <p className="mb-3 text-sm text-zinc-500">
            Token untuk club mengakses portal pendaftaran mandiri.
          </p>
          <code className="block rounded-lg bg-zinc-100 px-3 py-2 text-sm break-all">
            {club.token ?? "-"}
          </code>
          <a
            href={`/client?token=${club.token ?? ""}`}
            className="mt-4 inline-block rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Buka Portal Club
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-base font-semibold">Atlet ({athletes?.length ?? 0})</h2>
          <Link href={`/athletes?club=${id}`} className="text-sm text-primary hover:underline">
            Kelola Atlet
          </Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {(athletes ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between px-6 py-3 text-sm">
              <span className="font-medium">{a.name}</span>
              <span className="capitalize text-zinc-500">{a.gender ?? "-"}</span>
            </div>
          ))}
          {(athletes ?? []).length === 0 && (
            <p className="px-6 py-6 text-center text-sm text-zinc-400">Belum ada atlet.</p>
          )}
        </div>
      </div>

      <form action={deleteClub} className="rounded-xl border border-red-200 bg-red-50 p-4">
        <input type="hidden" name="id" value={id} />
        <p className="mb-2 text-sm font-medium text-red-700">Hapus club ini</p>
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Hapus Club
        </button>
      </form>
    </div>
  );
}