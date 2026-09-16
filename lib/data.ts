import type { MataKuliah, TugasLengkap } from "./types";

export type HasilMuat = {
  daftar: TugasLengkap[];
  galat: string | null;
};

export type HasilMataKuliah = {
  daftar: MataKuliah[];
  galat: string | null;
  /** false kalau kolom `sks` / `tanggal_mulai` belum ada di tabel mata_kuliah. */
  kolomPertemuanSiap: boolean;
};

type Amplop<T> = { data?: T | null; error?: string | null };

/**
 * Semua pembacaan data lewat PROXY API milik aplikasi ini
 * (`/api/publik/...`), bukan langsung ke Supabase dari browser:
 * kredensial Supabase tetap di server dan browser tidak perlu tahu apa pun
 * soal RLS/CORS.
 */
async function ambilDariProxy<T>(jalur: string): Promise<{ data: T | null; galat: string | null }> {
  try {
    const respons = await fetch(jalur, { cache: "no-store" });
    const isi = (await respons.json().catch(() => null)) as Amplop<T> | null;

    if (!respons.ok) {
      return {
        data: null,
        galat: isi?.error ?? `Gagal memuat data dari server (HTTP ${respons.status}).`,
      };
    }

    return { data: isi?.data ?? null, galat: null };
  } catch {
    return { data: null, galat: "Tidak bisa menghubungi server. Cek koneksimu." };
  }
}

/** Daftar mata kuliah (dipakai halaman Pertemuan). */
export async function muatMataKuliah(): Promise<HasilMataKuliah> {
  const hasil = await ambilDariProxy<{ daftar: MataKuliah[]; kolomPertemuanSiap: boolean }>(
    "/api/publik/mata-kuliah",
  );

  if (hasil.galat || !hasil.data) {
    return { daftar: [], galat: hasil.galat ?? "Data mata kuliah kosong.", kolomPertemuanSiap: true };
  }

  return {
    daftar: hasil.data.daftar ?? [],
    galat: null,
    kolomPertemuanSiap: hasil.data.kolomPertemuanSiap ?? true,
  };
}

/** Daftar tugas + mata kuliahnya (dipakai halaman Monitor Tugas). */
export async function muatTugas(): Promise<HasilMuat> {
  const hasil = await ambilDariProxy<{ daftar: TugasLengkap[] }>("/api/publik/tugas");

  if (hasil.galat || !hasil.data) {
    return { daftar: [], galat: hasil.galat ?? "Data tugas kosong." };
  }

  return { daftar: hasil.data.daftar ?? [], galat: null };
}
