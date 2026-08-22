export type ResultRow = {
  place: number;
  athlete: string;
  club: string;
  time: string;
};

export type DummyNumber = {
  id: string;
  name: string;
  style: string;
  distance: string;
  gender: string;
  age: string;
  fee: number;
  status: "selesai" | "berlangsung" | "akan_datang";
  results: ResultRow[];
};

export type DummySession = {
  time: string;
  title: string;
  detail: string;
  status: "selesai" | "berlangsung" | "akan_datang";
};

export type DummyDay = {
  label: string;
  date: string;
  sessions: DummySession[];
};

export type ClubStanding = {
  club: string;
  gold: number;
  silver: number;
  bronze: number;
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
  stats: { athletes: number; clubs: number; numbers: number; heats: number };
  numbers: DummyNumber[];
  clubStandings: ClubStanding[];
  schedule: DummyDay[];
  sponsors: string[];
};

export const dummyEvent: DummyEvent = {
  slug: "pantura-2026",
  name: "Pantura Swimming Championship 2026",
  description:
    "Kejuaraan renang antar-club terbesar di pesisir utara Jawa Tengah. Ajang bergengsi untuk atlet usia dini hingga senior memperebutkan Piala Bergilir Pantura dengan total hadiah dan sertifikat digital resmi.",
  status: "running",
  start_date: "2026-09-12",
  end_date: "2026-09-13",
  location: "Kolam Renang Tirta Jaya, Pekalongan, Jawa Tengah",
  organizer: "Pengkab PRSI Kabupaten Pekalongan",
  entry_fee: 75000,
  banner: "/hero-1.png",
  stats: { athletes: 312, clubs: 24, numbers: 6, heats: 38 },
  numbers: [
    {
      id: "n1",
      name: "50m Gaya Bebas Putra KU 8-10",
      style: "Gaya Bebas",
      distance: "50m",
      gender: "putra",
      age: "KU 8-10",
      fee: 75000,
      status: "selesai",
      results: [
        { place: 1, athlete: "Bima Saputra", club: "Aqua Prima", time: "00:31.45" },
        { place: 2, athlete: "Rendi Pratama", club: "Tirta Sport", time: "00:32.10" },
        { place: 3, athlete: "Arga Nugroho", club: "Garuda Aquatic", time: "00:32.88" },
        { place: 4, athlete: "Bagus Setiawan", club: "Tirta Swimming", time: "00:33.02" },
        { place: 5, athlete: "Dimas Arya", club: "Kucing Kolam", time: "00:33.40" },
      ],
    },
    {
      id: "n2",
      name: "100m Gaya Dada Putri KU 11-12",
      style: "Gaya Dada",
      distance: "100m",
      gender: "putri",
      age: "KU 11-12",
      fee: 90000,
      status: "berlangsung",
      results: [
        { place: 1, athlete: "Salsabila R. P.", club: "Aqua Prima", time: "01:18.22" },
        { place: 2, athlete: "Dewi Anggraini", club: "Tirta Swimming", time: "01:20.05" },
        { place: 3, athlete: "Nadia Permata", club: "Kucing Kolam", time: "01:21.60" },
      ],
    },
    {
      id: "n3",
      name: "50m Gaya Kupu Putra KU 8-10",
      style: "Gaya Kupu",
      distance: "50m",
      gender: "putra",
      age: "KU 8-10",
      fee: 75000,
      status: "selesai",
      results: [
        { place: 1, athlete: "Fajar Maulana", club: "Garuda Aquatic", time: "00:34.90" },
        { place: 2, athlete: "Yoga Prasetyo", club: "Aqua Prima", time: "00:35.40" },
        { place: 3, athlete: "Hendra Wibowo", club: "Tirta Sport", time: "00:36.12" },
      ],
    },
    {
      id: "n4",
      name: "100m Gaya Bebas Putra Open",
      style: "Gaya Bebas",
      distance: "100m",
      gender: "putra",
      age: "Open",
      fee: 100000,
      status: "akan_datang",
      results: [],
    },
    {
      id: "n5",
      name: "50m Gaya Dada Putri Senior",
      style: "Gaya Dada",
      distance: "50m",
      gender: "putri",
      age: "Senior",
      fee: 85000,
      status: "akan_datang",
      results: [],
    },
    {
      id: "n6",
      name: "400m Gaya Bebas Terbuka",
      style: "Gaya Bebas",
      distance: "400m",
      gender: "campuran",
      age: "Open",
      fee: 120000,
      status: "akan_datang",
      results: [],
    },
  ],
  clubStandings: [
    { club: "Aqua Prima", gold: 2, silver: 1, bronze: 0 },
    { club: "Garuda Aquatic", gold: 1, silver: 0, bronze: 1 },
    { club: "Tirta Sport", gold: 0, silver: 2, bronze: 1 },
    { club: "Tirta Swimming", gold: 0, silver: 1, bronze: 0 },
    { club: "Kucing Kolam", gold: 0, silver: 0, bronze: 1 },
  ],
  schedule: [
    {
      label: "Hari 1",
      date: "Sabtu, 12 September 2026",
      sessions: [
        { time: "07.00", title: "Pendaftaran & Nomor Dada", detail: "Registrasi ulang atlet", status: "selesai" },
        { time: "08.30", title: "Technical Meeting", detail: "Briefing official & pelatih", status: "selesai" },
        { time: "09.00", title: "Heat 1–4 (50m & 100m)", detail: "Babak penyisihan", status: "berlangsung" },
        { time: "14.00", title: "Final A & B", detail: "Penentuan juara per nomor", status: "akan_datang" },
      ],
    },
    {
      label: "Hari 2",
      date: "Minggu, 13 September 2026",
      sessions: [
        { time: "08.00", title: "Heat 5–8 (400m & Estafet)", detail: "Jarak jauh & estafet", status: "akan_datang" },
        { time: "13.00", title: "Final & Rekor", detail: "Perebutan medali emas", status: "akan_datang" },
        { time: "15.30", title: "Penyerahan Piala", detail: "Closing ceremony", status: "akan_datang" },
      ],
    },
  ],
  sponsors: ["Arena Indonesia", "Speedo", "Mizuno", "Aqua Pure", "Bank Nusantara", "SWANS"],
};

export function getDummyEvent(slug: string): DummyEvent {
  return { ...dummyEvent, slug };
}
