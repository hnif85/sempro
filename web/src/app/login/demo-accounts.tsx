"use client";

const demoAccounts = [
  { role: "Super Admin", email: "admin@renang.com", desc: "Akses penuh + kelola pengguna" },
  { role: "Admin Event", email: "eo01@renang.com", desc: "Kelola event sendiri" },
  { role: "Official / Panitia", email: "panitia01@renang.com", desc: "Input hasil & heat (per event)" },
  { role: "Club Manager", email: "kucing@kucing.com", desc: "Daftarkan atlet club" },
  { role: "Peserta", email: "peserta001@renang.com", desc: "Portal peserta" },
];

export default function DemoAccounts() {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
      <p className="text-xs font-semibold text-zinc-700">Akun Demo</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">
        Password semua: <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[10px]">password123</code>
      </p>
      <div className="mt-3 space-y-2">
        {demoAccounts.map((acc) => (
          <button
            key={acc.email}
            type="button"
            onClick={() => {
              const email = document.getElementById("email") as HTMLInputElement | null;
              const pass = document.getElementById("password") as HTMLInputElement | null;
              if (email) email.value = acc.email;
              if (pass) pass.value = "password123";
            }}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left transition hover:border-primary hover:bg-blue-50/40"
          >
            <span className="block text-xs font-medium text-zinc-800">{acc.role}</span>
            <span className="block font-mono text-[11px] text-zinc-500">{acc.email}</span>
            <span className="block text-[10px] text-zinc-400">{acc.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
