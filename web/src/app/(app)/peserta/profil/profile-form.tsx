"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "./actions";

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
};

export function ProfileForm({
  userId,
  data,
}: {
  userId: string;
  data: ProfileData | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="user_id" value={userId} />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(28,74,137,.05)]">
        <h2 className="mb-4 text-base font-bold text-[#102353]">Data Diri</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Lengkap</label>
            <input name="full_name" defaultValue={data?.full_name ?? ""} required className={inputClass} placeholder="Nama lengkap" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Tanggal Lahir</label>
            <input type="date" name="birth_date" defaultValue={data?.birth_date ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Jenis Kelamin</label>
            <select name="gender" defaultValue={data?.gender ?? ""} className={inputClass}>
              <option value="">Pilih…</option>
              <option value="putra">Putra</option>
              <option value="putri">Putri</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Telepon</label>
            <input name="phone" defaultValue={data?.phone ?? ""} className={inputClass} placeholder="08xxxxxxxxxx" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(28,74,137,.05)]">
        <h2 className="mb-4 text-base font-bold text-[#102353]">Alamat</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Alamat Lengkap</label>
            <textarea name="address" rows={3} defaultValue={data?.address ?? ""} className={`${inputClass} resize-none`} placeholder="Alamat lengkap" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Kota</label>
            <input name="city" defaultValue={data?.city ?? ""} className={inputClass} placeholder="Kota" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Provinsi</label>
            <input name="province" defaultValue={data?.province ?? ""} className={inputClass} placeholder="Provinsi" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Kode Pos</label>
            <input name="postal_code" defaultValue={data?.postal_code ?? ""} className={inputClass} placeholder="Kode pos" />
          </div>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.type === "success" ? "border border-emerald-100 bg-emerald-50 text-emerald-700" : "border border-red-100 bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#07377d] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#052d66] active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}