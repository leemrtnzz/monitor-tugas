import { galatKonfigurasi, supabase } from "./supabase";
import type { MataKuliah, Tugas, TugasLengkap } from "./types";

export type HasilMuat = {
  daftar: TugasLengkap[];
  galat: string | null;
};

function pesanGalat(tabel: string, pesan: string) {
  const bawah = pesan.toLowerCase();
  const petunjuk =
    bawah.includes("row-level security") || bawah.includes("permission denied")
      ? " Tabel belum mengizinkan role anon membaca — tambahkan policy SELECT untuk role anon di Supabase."
      : "";
  return `Gagal membaca tabel ${tabel}: ${pesan}.${petunjuk}`;
}

const KOLOM_MK_PERTEMUAN = "id,nama,semester,hari,sks,tanggal_mulai";
const KOLOM_MK_DASAR = "id,nama,semester,hari";

/**
 * Bentuk respons select yang dinetralkan: kolom yang diminta bisa berbeda
 * (dengan atau tanpa sks/tanggal_mulai), jadi tipenya tidak diikat ke satu select.
 */
type HasilSelectMk = { data: unknown; error: { message: string } | null };

export type HasilMataKuliah = {
  daftar: MataKuliah[];
  galat: string | null;
  /** false kalau kolom `sks` / `tanggal_mulai` belum ada di tabel. */
  kolomPertemuanSiap: boolean;
};

/** PostgREST menyebut kolom yang tidak ada dengan pola ini — kalau kena, pakai select dasar. */
function perluFallbackKolom(pesan: string) {
  const bawah = pesan.toLowerCase();
  return (
    bawah.includes("sks") ||
    bawah.includes("tanggal_mulai") ||
    bawah.includes("schema cache") ||
    (bawah.includes("column") && bawah.includes("does not exist"))
  );
}

/**
 * Ambil tabel `mata_kuliah`. Kolom `sks` & `tanggal_mulai` (dipakai halaman
 * Pertemuan) dicoba dulu; kalau belum ada di database, otomatis fallback ke
 * kolom dasar supaya sisa aplikasi tetap jalan.
 */
export async function muatMataKuliah(): Promise<HasilMataKuliah> {
  if (!supabase) {
    return { daftar: [], galat: galatKonfigurasi, kolomPertemuanSiap: false };
  }

  let kolomPertemuanSiap = true;
  let hasil: HasilSelectMk = await supabase
    .from("mata_kuliah")
    .select(KOLOM_MK_PERTEMUAN)
    .order("nama", { ascending: true });

  if (hasil.error && perluFallbackKolom(hasil.error.message)) {
    kolomPertemuanSiap = false;
    hasil = await supabase
      .from("mata_kuliah")
      .select(KOLOM_MK_DASAR)
      .order("nama", { ascending: true });
  }

  if (hasil.error) {
    return {
      daftar: [],
      galat: pesanGalat("mata_kuliah", hasil.error.message),
      kolomPertemuanSiap,
    };
  }

  const daftar = ((hasil.data ?? []) as unknown as Partial<MataKuliah>[]).map((mk) => ({
    id: mk.id ?? "",
    nama: mk.nama ?? "(tanpa nama)",
    semester: mk.semester ?? null,
    hari: mk.hari ?? null,
    sks: mk.sks ?? null,
    tanggal_mulai: mk.tanggal_mulai ?? null,
  }));

  return { daftar, galat: null, kolomPertemuanSiap };
}
export async function muatTugas(): Promise<HasilMuat> {
  if (!supabase) return { daftar: [], galat: galatKonfigurasi };

  const [hasilMk, hasilTugas] = await Promise.all([
    muatMataKuliah(),
    supabase.from("tugas").select("*").order("tanggal_dikumpulkan", { ascending: true }),
  ]);

  if (hasilMk.galat) return { daftar: [], galat: hasilMk.galat };
  if (hasilTugas.error) return { daftar: [], galat: pesanGalat("tugas", hasilTugas.error.message) };

  const daftarTugas = (hasilTugas.data ?? []) as unknown as Tugas[];
  const petaMk = new Map(hasilMk.daftar.map((mk) => [mk.id, mk]));

  return {
    daftar: daftarTugas.map((tugas) => ({
      ...tugas,
      mata_kuliah: petaMk.get(tugas.id_mata_kuliah) ?? null,
    })),
    galat: null,
  };
}
