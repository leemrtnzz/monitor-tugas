import type { Tugas } from "./types";

export const MENIT_MS = 60_000;
export const JAM_MS = 3_600_000;
export const HARI_MS = 86_400_000;

/** Dipakai bersama oleh form kelola dan validasi API. */
export const DAFTAR_HARI = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

/** Urutan dari paling santai ke paling bahaya. Dipakai untuk membandingkan tingkat. */
export const URUTAN_TINGKAT = ["aman", "waspada", "mendesak", "kritis", "terlewat"] as const;

export type Tingkat = (typeof URUTAN_TINGKAT)[number];

export type InfoTenggat = {
  terbit: Date;
  tenggat: Date;
  /** Selisih tenggat dengan sekarang dalam milidetik (negatif = sudah lewat). */
  msSisa: number;
  /** Total hari pengerjaan dari tanggal terbit sampai tanggal dikumpulkan. */
  totalHari: number;
  /** Sisa hari (desimal, negatif = sudah lewat). */
  hariSisa: number;
  /** 0..1 — seberapa penuh timeline dari tanggal terbit menuju tenggat. */
  progress: number;
  persen: number;
  tingkat: Tingkat;
  lewat: boolean;
};

/** Terima "20.00", "20:00", "20:00:00" → "20:00:00". */
export function normalisasiJam(nilai?: string | null): string | null {
  if (!nilai) return null;
  const cocok = nilai.trim().match(/^(\d{1,2})[.:](\d{2})/);
  if (!cocok) return null;
  const jam = Number(cocok[1]);
  const menit = Number(cocok[2]);
  if (jam > 23 || menit > 59) return null;
  return `${String(jam).padStart(2, "0")}:${String(menit).padStart(2, "0")}:00`;
}

function bacaTanggal(nilai: string | null | undefined, akhirHari = false): Date | null {
  if (!nilai) return null;
  const teks = String(nilai).trim();
  if (!teks) return null;
  const hanyaTanggal = /^\d{4}-\d{2}-\d{2}$/.test(teks);
  const iso = hanyaTanggal ? `${teks}T${akhirHari ? "23:59:59" : "00:00:00"}` : teks;
  const hasil = new Date(iso);
  return Number.isNaN(hasil.getTime()) ? null : hasil;
}

/** Gabungkan tanggal_dikumpulkan + maksimal_dikumpulkan_jam jadi satu Date. */
export function tenggatDari(
  tugas: Pick<Tugas, "tanggal_dikumpulkan" | "maksimal_dikumpulkan_jam">,
): Date | null {
  const tanggal = bacaTanggal(tugas.tanggal_dikumpulkan, true);
  if (!tanggal) return null;
  const jam = normalisasiJam(tugas.maksimal_dikumpulkan_jam);
  if (!jam) return tanggal;
  const [h, m, s] = jam.split(":").map(Number);
  const hasil = new Date(tanggal);
  hasil.setHours(h, m, s, 0);
  return hasil;
}

function tingkatDari(hariSisa: number, progress: number): Tingkat {
  if (hariSisa <= 0) return "terlewat";

  const dariWaktu: Tingkat =
    hariSisa <= 1 ? "kritis" : hariSisa <= 3 ? "mendesak" : hariSisa <= 7 ? "waspada" : "aman";

  // Timeline yang hampir penuh juga menandakan bahaya.
  const dariProgress: Tingkat =
    progress >= 0.9 ? "kritis" : progress >= 0.75 ? "mendesak" : progress >= 0.5 ? "waspada" : "aman";

  return URUTAN_TINGKAT.indexOf(dariWaktu) >= URUTAN_TINGKAT.indexOf(dariProgress)
    ? dariWaktu
    : dariProgress;
}

/** Hitung semua detail tenggat: sisa hari, durasi pengerjaan, progress timeline, dan tingkat bahaya. */
export function hitungInfo(tugas: Tugas, sekarang: Date): InfoTenggat {
  const tenggat = tenggatDari(tugas) ?? new Date(sekarang.getTime() + HARI_MS * 30);
  const terbit = bacaTanggal(tugas.tanggal_diterbitkan) ?? new Date(tenggat.getTime() - HARI_MS * 7);

  const totalMs = Math.max(tenggat.getTime() - terbit.getTime(), 1);
  const terpakaiMs = sekarang.getTime() - terbit.getTime();
  const msSisa = tenggat.getTime() - sekarang.getTime();
  const progress = Math.min(Math.max(terpakaiMs / totalMs, 0), 1);
  const hariSisa = msSisa / HARI_MS;
  const tingkat = tingkatDari(hariSisa, progress);

  return {
    terbit,
    tenggat,
    msSisa,
    totalHari: Math.max(Math.round(totalMs / HARI_MS), 0),
    hariSisa,
    progress,
    persen: Math.round(progress * 100),
    tingkat,
    lewat: msSisa <= 0,
  };
}

export type TemaTingkat = {
  label: string;
  ikon: string;
  /** Ringkasan warna timeline: hijau → kuning → oranye → merah. */
  bilah: string;
  aksen: string;
  kartu: string;
  chip: string;
  kotak: string;
  teks: string;
  denyut: boolean;
};

export const TEMA: Record<Tingkat, TemaTingkat> = {
  aman: {
    label: "Aman",
    ikon: '',
    bilah: "bg-linear-to-r from-emerald-500 via-emerald-400 to-teal-300",
    aksen: "bg-emerald-400",
    kartu: "border-emerald-500/20 hover:border-emerald-400/40",
    chip: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
    kotak: "border-emerald-500/20 bg-emerald-500/5",
    teks: "text-emerald-300",
    denyut: false,
  },
  waspada: {
    label: "Waspada",
    ikon: "",
    bilah: "bg-linear-to-r from-lime-400 via-yellow-400 to-amber-400",
    aksen: "bg-yellow-400",
    kartu: "border-yellow-500/25 hover:border-yellow-400/45",
    chip: "bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-400/30",
    kotak: "border-yellow-500/25 bg-yellow-500/5",
    teks: "text-yellow-300",
    denyut: false,
  },
  mendesak: {
    label: "Mendesak",
    ikon: "",
    bilah: "bg-linear-to-r from-amber-400 via-orange-500 to-orange-600",
    aksen: "bg-orange-500",
    kartu: "border-orange-500/30 hover:border-orange-400/50",
    chip: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/30",
    kotak: "border-orange-500/30 bg-orange-500/10",
    teks: "text-orange-300",
    denyut: false,
  },
  kritis: {
    label: "Kritis",
    ikon: "",
    bilah: "bg-linear-to-r from-orange-500 via-red-500 to-red-600",
    aksen: "bg-red-500",
    kartu: "border-red-500/40 hover:border-red-400/60",
    chip: "bg-red-500/20 text-red-200 ring-1 ring-red-400/40",
    kotak: "border-red-500/40 bg-red-500/10",
    teks: "text-red-300",
    denyut: true,
  },
  terlewat: {
    label: "Terlewat",
    ikon: "",
    bilah: "bg-linear-to-r from-red-700 via-red-600 to-rose-500",
    aksen: "bg-red-600",
    kartu: "border-red-600/50 hover:border-red-500/70",
    chip: "bg-red-950 text-red-200 ring-1 ring-red-500/50",
    kotak: "border-red-600/50 bg-red-950/60",
    teks: "text-red-200",
    denyut: true,
  },
};
