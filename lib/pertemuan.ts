import { HARI_MS } from "./deadline";
import type { MataKuliah } from "./types";

export type TipePertemuan = "Tatap Muka" | "Mentari (Online)" | "UTS" | "UAS";
export type StatusPertemuan = "selesai" | "hari-ini" | "akan-datang";

export type Pertemuan = {
  /** Nomor pertemuan (1..21 / 1..14). null untuk UTS & UAS. */
  ke: number | null;
  /** Label siap tampil: "Pertemuan 3" | "UTS" | "UAS". */
  label: string;
  tipe: TipePertemuan;
  /** Minggu ke-berapa (1..16) sejak tanggal mulai. */
  minggu: number;
  tanggal: Date;
  status: StatusPertemuan;
  /** Tanggalnya sudah tiba/lewat → centang otomatis (bukan input manual). */
  tercapai: boolean;
  /** Selisih hari kalender: 0 = hari ini, positif = akan datang, negatif = sudah lewat. */
  selisihHari: number;
  /** Pertemuan terdekat yang belum terlewat (untuk disorot). */
  berikutnya: boolean;
};

export type JadwalPertemuan = {
  daftar: Pertemuan[];
  berikutnya: Pertemuan | null;
  hariIni: Pertemuan[];
  /** Jumlah entri yang tanggalnya sudah tiba (= jumlah centang). */
  tercapai: number;
  siap: boolean;
};

export const PERTEMUAN_2_SKS = 14;
export const PERTEMUAN_3_SKS = 21;
/** UTS selalu di minggu ke-8, UAS di minggu ke-16 (dihitung dari tanggal mulai). */
export const MINGGU_UTS = 8;
export const MINGGU_UAS = 16;

export function totalPertemuan(sks: number | null | undefined) {
  return (sks ?? 0) >= 3 ? PERTEMUAN_3_SKS : PERTEMUAN_2_SKS;
}

/**
 * Pola jadwal kampus:
 * - 3 SKS → 21 pertemuan. Pertemuan kelipatan 3 (3, 6, 9, 12, 15, 18, 21) adalah
 *   sesi TAMBAHAN "Mentari (Online)" yang jatuh pada tanggal yang sama dengan
 *   pertemuan sebelumnya (jadinya di minggu itu ada 2 sesi).
 * - 2 SKS → 14 pertemuan. Pertemuan 2 adalah sesi online, menempati slot
 *   mingguan biasa (bukan sesi tambahan).
 * - UTS di minggu 8, UAS di minggu 16 — keduanya jadi baris tersendiri.
 *
 * Semua aturan ini bisa diubah di sini saja.
 */
function sesiTambahan(sks: number, ke: number) {
  return sks >= 3 && ke % 3 === 0;
}

function tipePertemuan(sks: number, ke: number): TipePertemuan {
  if (sesiTambahan(sks, ke)) return "Mentari (Online)";
  return "Tatap Muka";
}

export function bacaTanggalMulai(nilai: string | null | undefined): Date | null {
  if (!nilai) return null;
  const teks = String(nilai).trim();
  const cocok = teks.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!cocok) return null;

  const tanggal = new Date(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3]));
  return Number.isNaN(tanggal.getTime()) ? null : tanggal;
}

function awalHari(tanggal: Date) {
  return new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate());
}

type EntriJadwal = {
  ke: number | null;
  label: string;
  tipe: TipePertemuan;
  minggu: number;
};

/**
 * Susun urutan entri (pertemuan + UTS + UAS) beserta nomor minggunya.
 * Minggu ke-8 sengaja diisi UTS, jadi minggu kuliah melompat dari 7 ke 9.
 */
function susunEntri(sks: number): EntriJadwal[] {
  const jumlah = totalPertemuan(sks);
  const entri: EntriJadwal[] = [];

  let minggu = 0;

  for (let ke = 1; ke <= jumlah; ke++) {
    if (!sesiTambahan(sks, ke)) {
      minggu += 1;
      if (minggu === MINGGU_UTS) minggu += 1;
    }

    entri.push({ ke, label: `Pertemuan ${ke}`, tipe: tipePertemuan(sks, ke), minggu });
  }

  entri.push({ ke: null, label: "UTS", tipe: "UTS", minggu: MINGGU_UTS });
  entri.push({ ke: null, label: "UAS", tipe: "UAS", minggu: MINGGU_UAS });

  return entri.sort((a, b) => a.minggu - b.minggu || (a.ke ?? 0) - (b.ke ?? 0));
}

export function buatJadwalPertemuan(
  mataKuliah: Pick<MataKuliah, "sks" | "tanggal_mulai">,
  sekarang: Date,
): JadwalPertemuan {
  const kosong: JadwalPertemuan = {
    daftar: [],
    berikutnya: null,
    hariIni: [],
    tercapai: 0,
    siap: false,
  };

  const sks = mataKuliah.sks ?? 0;
  const mulai = bacaTanggalMulai(mataKuliah.tanggal_mulai);

  if (sks <= 0 || !mulai) return kosong;

  const hariIni = awalHari(sekarang);
  const daftar: Pertemuan[] = susunEntri(sks).map((entri) => {
    const tanggal = new Date(mulai);
    tanggal.setDate(tanggal.getDate() + (entri.minggu - 1) * 7);

    const selisihHari = Math.round((awalHari(tanggal).getTime() - hariIni.getTime()) / HARI_MS);

    return {
      ...entri,
      tanggal,
      status: selisihHari < 0 ? "selesai" : selisihHari === 0 ? "hari-ini" : "akan-datang",
      tercapai: selisihHari <= 0,
      selisihHari,
      berikutnya: false,
    };
  });

  const berikutnya =
    daftar.find((item) => item.status === "hari-ini") ??
    daftar.find((item) => item.status === "akan-datang") ??
    null;

  if (berikutnya) berikutnya.berikutnya = true;

  return {
    daftar,
    berikutnya,
    hariIni: daftar.filter((item) => item.status === "hari-ini"),
    tercapai: daftar.filter((item) => item.tercapai).length,
    siap: true,
  };
}

/**
 * Label ramah berbasis hari kalender: 0 → "Hari ini", 1 → "Besok", dst.
 * Sengaja per hari (bukan jam) karena jam kuliah belum ada di data.
 */
export function labelMundur(selisihHari: number): string {
  if (selisihHari === 0) return "Hari ini";
  if (selisihHari === 1) return "Besok";
  if (selisihHari > 1) return `${selisihHari} hari lagi`;
  if (selisihHari === -1) return "Kemarin";
  return `${Math.abs(selisihHari)} hari lalu`;
}
