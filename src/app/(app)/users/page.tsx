import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createUser, deactivateUser, activateUser, resetPassword } from "./actions";

export default async function UsersPage() {
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

  if (profile?.role !== "super_admin") redirect("/dashboard");

  const { data: users } = await supabase
    .from("profiles")
    .select("*, clubs(name)")
    .order("created_at", { ascending: false });

  const { data: clubs } = await supabase.from("clubs").select("id, name").order("name");

  const { data: athletes } = await supabase
    .from("athletes")
    .select("id, name, clubs(name)")
    .order("name");

  const athletesList = (athletes ?? []) as unknown as {
    id: string;
    name: string;
    clubs: { name: string | null }[] | null;
  }[];

  const roles = ["super_admin", "admin_event", "club_manager", "official", "peserta"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Data Pengguna</h1>
        <p className="text-zinc-500">Kelola akses aplikasi</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold">Tambahkan Pengguna</h2>
        <form action={createUser} className="grid gap-4 md:grid-cols-6">
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium">Nama Lengkap *</label>
            <input
              name="full_name"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium">Email *</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium">Password *</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select
              name="role"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm capitalize focus:border-primary focus:outline-none"
            >
              {roles.map((r) => (
                <option key={r} value={r} className="capitalize">
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium">Club</label>
            <select
              name="club_id"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Tidak ada</option>
              {(clubs ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium">Atlet (untuk Peserta)</label>
            <select
              name="athlete_id"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Tidak ada</option>
              {(athletesList ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.clubs?.[0]?.name ?? "-"}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-6">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Tambah Pengguna
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Club</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(users ?? []).map((u) => (
              <tr key={u.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">{u.full_name ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize">
                    {u.role.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">{u.clubs?.name ?? "-"}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <form action={deactivateUser} className="inline">
                    <input type="hidden" name="id" value={u.id} />
                    <button className="text-xs text-red-600 hover:underline">Nonaktifkan</button>
                  </form>
                  <form action={activateUser} className="inline">
                    <input type="hidden" name="id" value={u.id} />
                    <button className="text-xs text-green-600 hover:underline">Aktifkan</button>
                  </form>
                </td>
              </tr>
            ))}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                  Belum ada pengguna.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold">Reset Password</h2>
        <form action={resetPassword} className="flex gap-3">
          <select
            name="id"
            required
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Pilih pengguna…</option>
            {(users ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name ?? u.id}
              </option>
            ))}
          </select>
          <input
            name="new_password"
            required
            type="password"
            placeholder="Password baru"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Reset
          </button>
        </form>
      </div>
    </div>
  );
}