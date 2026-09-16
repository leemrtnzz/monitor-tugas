import { HARI_MS, MENIT_MS } from "./deadline";

const tanggalPanjang = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const tanggalSingkat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

const tanggalJam = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "Rabu, 23 September 2026" */
export const formatTanggal = (tanggal: Date) => tanggalPanjang.format(tanggal);

/** "23 Sep" */
export const formatTanggalSingkat = (tanggal: Date) => tanggalSingkat.format(tanggal);

/** "20.00" (gaya Indonesia) */
export const formatJam = (tanggal: Date) => tanggalJam.format(tanggal).replace(":", ".");

/** "Rabu, 23 September 2026 · 20.00" */
export const formatTenggat = (tanggal: Date) => `${formatTanggal(tanggal)} · ${formatJam(tanggal)}`;

/** Selisih hari kalender (bukan 24 jam) antara dua tanggal. */
export function selisihHari(a: Date, b: Date) {
  const hariA = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const hariB = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((hariB - hariA) / HARI_MS);
}

/** Ubah durasi jadi teks ringkas: "5 hari 3 jam", "42 menit", "kurang dari 1 menit". */
export function formatDurasi(ms: number): string {
  const totalMenit = Math.floor(Math.abs(ms) / MENIT_MS);
  const hari = Math.floor(totalMenit / 1440);
  const jam = Math.floor((totalMenit % 1440) / 60);
  const menit = totalMenit % 60;

  const bagian: string[] = [];
  if (hari > 0) bagian.push(`${hari} hari`);
  if (jam > 0) bagian.push(`${jam} jam`);
  if (hari === 0 && menit > 0) bagian.push(`${menit} menit`);
  if (bagian.length === 0) return "kurang dari 1 menit";
  return bagian.slice(0, 2).join(" ");
}

/** Nilai untuk <input type="date">: "2026-09-23" atau "" */
export function keTanggalInput(nilai?: string | null): string {
  if (!nilai) return "";
  const cocok = String(nilai).match(/^(\d{4}-\d{2}-\d{2})/);
  return cocok ? cocok[1] : "";
}

/** Nilai untuk <input type="time">: "20:00" (dari "20:00:00" / "20.00") atau "" */
export function keJamInput(nilai?: string | null): string {
  if (!nilai) return "";
  const cocok = String(nilai).match(/^(\d{1,2})[.:](\d{2})/);
  if (!cocok) return "";
  return `${cocok[1].padStart(2, "0")}:${cocok[2]}`;
}

/** "Rabu, 16 Sep" — dipakai di label timeline. */
export const formatHariSingkat = (tanggal: Date) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "short" }).format(tanggal);

/**
 * Sama seperti formatHariSingkat, tapi menambahkan tahun kalau berbeda dengan
 * tahun acuan (mis. tenggat 14 Sep 2027 bukan 2026).
 */
export function formatTanggalCerdas(tanggal: Date, acuan: Date) {
  const dasar = formatHariSingkat(tanggal);
  return tanggal.getFullYear() === acuan.getFullYear()
    ? dasar
    : `${dasar} ${tanggal.getFullYear()}`;
}
