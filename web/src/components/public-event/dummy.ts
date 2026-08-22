export type DummyNumber = {
  id: string;
  name: string;
  style: string;
  distance: string;
  gender: string;
  age: string;
  fee: number;
};

export type DummySession = {
  time: string;
  title: string;
  detail: string;
};

export type DummyDay = {
  label: string;
  date: string;
  sessions: DummySession[];
};

export type DummyMedalRow = {
  number: string;
  gold: { name: string; club: string; time: string };
  silver: { name: string; club: string; time: string };
  bronze: { name: string; club: string; time: string };
};

export type DummyEvent = {
  slug: string;
  name: string;
  description: string;
  status: "registration_open" | "running" | "finished" | "registration_closed";
  start_date: string;
  end_date: string;
  location: string;
  organizer: string;
  entry_fee: number;
  banner: string;
  numbers: DummyNumber[];
  schedule: DummyDay[];
  medals: DummyMedalRow[];
  sponsors: string[];
  gallery: string[];
};

export const dummyEvent: DummyEvent = {
  slug: "pantura-2026",
  name: "Pantura Swimming Championship 2026",
  description:
    "Kejuaraan renang antar-club terbesar di pesisir utara Jawa Tengah. Ajang bergengsi untuk atlet usia dini hingga senior memperebutkan Piala Bergilir Pantura dengan total hadiah dan sertifikat digital resmi.\n\nEvent ini diselenggarakan untuk memfasilitasi pembinaan atlet renang daerah sekaligus menjadi ajang silaturahmi antar-club se-Jawa Tengah.",
  status: "registration_open",
  start_date: "2026-09-12",
  end_date: "2026-09-13",
  location: "Kolam Renang Tirta Jaya, Pekalongan, Jawa Tengah",
  organizer: "Pengkab PRSI Kabupaten Pekalongan",
  entry_fee: 75000,
  banner: "/hero-1.png",
  numbers: [
    { id: "n1", name: "50m Gaya Bebas Putra KU 8-10", style: "Gaya Bebas", distance: "50m", gender: "putra", age: "KU 8-10", fee: 75000 },
    { id: "n2", name: "100m Gaya Dada Putri KU 11-12", style: "Gaya Dada", distance: "100m", gender: "putri", age: "KU 11-12", fee: 90000 },
    { id: "n3", name: "50m Gaya Kupu Putra KU 8-10", style: "Gaya Kupu", distance: "50m", gender: "putra", age: "KU 8-10", fee: 75000 },
    { id: "n4", name: "100m Gaya Bebas Putra Open", style: "Gaya Bebas", distance: "100m", gender: "putra", age: "Open", fee: 100000 },
    { id: "n5", name: "50m Gaya Dada Putri Senior", style: "Gaya Dada", distance: "50m", gender: "putri", age: "Senior", fee: 85000 },
    { id: "n6", name: "400m Gaya Bebas Terbuka", style: "Gaya Bebas", distance: "400m", gender: "campuran", age: "Open", fee: 120000 },
  ],
  schedule: [
    {
      label: "Hari 1",
      date: "Sabtu, 12 September 2026",
      sessions: [
        { time: "07.00", title: "Pendaftaran & Pengambilan Nomor Dada", detail: "Registrasi ulang atlet di area lobi kolam" },
        { time: "08.30", title: "Sesi Pemanasan & Technical Meeting", detail: "Briefing official dan pelatih" },
        { time: "09.00", title: "Heat 1–4 (Nomor 50m & 100m)", detail: "Babak penyisihan putra/putri" },
        { time: "14.00", title: "Final A & B", detail: "Penentuan juara per nomor" },
      ],
    },
    {
      label: "Hari 2",
      date: "Minggu, 13 September 2026",
      sessions: [
        { time: "08.00", title: "Heat 5–8 (400m & Estafet)", detail: "Nomor jarak jauh & estafet" },
        { time: "13.00", title: "Final & Rekor", detail: "Perebutan medali emas" },
        { time: "15.30", title: "Penyerahan Piala & Sertifikat", detail: "Closing ceremony" },
      ],
    },
  ],
  medals: [
    {
      number: "50m Gaya Bebas Putra KU 8-10",
      gold: { name: "Bima Saputra", club: "Aqua Prima", time: "00:31.45" },
      silver: { name: "Rendi Pratama", club: "Tirta Sport", time: "00:32.10" },
      bronze: { name: "Arga Nugroho", club: "Garuda Aquatic", time: "00:32.88" },
    },
    {
      number: "100m Gaya Dada Putri KU 11-12",
      gold: { name: "Salsabila R. P.", club: "Aqua Prima", time: "01:18.22" },
      silver: { name: "Dewi Anggraini", club: "Tirta Swimming", time: "01:20.05" },
      bronze: { name: "Nadia Permata", club: "Kucing Kolam", time: "01:21.60" },
    },
    {
      number: "50m Gaya Kupu Putra KU 8-10",
      gold: { name: "Fajar Maulana", club: "Garuda Aquatic", time: "00:34.90" },
      silver: { name: "Yoga Prasetyo", club: "Aqua Prima", time: "00:35.40" },
      bronze: { name: "Hendra Wibowo", club: "Tirta Sport", time: "00:36.12" },
    },
  ],
  sponsors: ["Arena Indonesia", "Speedo", "Mizuno", "Aqua Pure", "Bank Nusantara", "SWANS"],
  gallery: ["/hero-1.png", "/hero-putri-mobile.png.png", "/hero-1.png", "/hero-putri-mobile.png.png", "/hero-1.png", "/hero-putri-mobile.png.png"],
};

export function getDummyEvent(slug: string): DummyEvent {
  return { ...dummyEvent, slug };
}
