import { redirect } from "next/navigation";

export default async function ClientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  async function handleLogin(formData: FormData) {
    "use server";
    const token = String(formData.get("token") ?? "");
    redirect(`/client?token=${encodeURIComponent(token)}`);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold">Web Data Client</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Masuk menggunakan token club Anda
          </p>
        </div>

        <form action={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Token / Key</label>
            <input
              name="token"
              required
              placeholder="Masukkan token club"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {sp.error === "invalid" && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              Token tidak valid.
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            PROSES
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Token diberikan oleh panitia penyelenggara.
        </p>
      </div>
    </div>
  );
}