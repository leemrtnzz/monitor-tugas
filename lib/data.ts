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

/**
 * Ambil tabel `mata_kuliah` dan `tugas` lalu gabungkan di sisi klien.
 * Digabung manual (bukan embedded select) supaya tetap jalan apa pun nama foreign key-nya.
 */
export async function muatTugas(): Promise<HasilMuat> {
  if (!supabase) return { daftar: [], galat: galatKonfigurasi };

  const [hasilMk, hasilTugas] = await Promise.all([
    supabase.from("mata_kuliah").select("id,nama,semester,hari"),
    supabase.from("tugas").select("*"),
  ]);

  if (hasilMk.error) return { daftar: [], galat: pesanGalat("mata_kuliah", hasilMk.error.message) };
  if (hasilTugas.error) return { daftar: [], galat: pesanGalat("tugas", hasilTugas.error.message) };

  const daftarMk = (hasilMk.data ?? []) as unknown as MataKuliah[];
  const daftarTugas = (hasilTugas.data ?? []) as unknown as Tugas[];

  const petaMk = new Map(daftarMk.map((mk) => [mk.id, mk]));

  return {
    daftar: daftarTugas.map((tugas) => ({
      ...tugas,
      mata_kuliah: petaMk.get(tugas.id_mata_kuliah) ?? null,
    })),
    galat: null,
  };
}
