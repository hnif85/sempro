import Link from "next/link";
import { login } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
    searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            SEMP
          </div>
          <h1 className="text-xl font-semibold">Masuk</h1>
          <p className="mt-1 text-sm text-zinc-500">Swimming Event Management Platform</p>
        </div>

        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={sp.next ?? ""} />
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="nama@email.com"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {sp.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {sp.error === "created" ? "Akun dibuat, tetapi login otomatis gagal. Silakan login ulang." : "Email atau password salah."}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            MASUK
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-medium text-primary hover:underline">
            Daftar club / peserta
          </Link>
        </p>
      </div>
    </div>
  );
}
