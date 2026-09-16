import { galatSupabaseServer, supabaseServer } from "./supabase-server";
import type { MataKuliah, Tugas, TugasLengkap } from "./types";

const KOLOM_MK_PERTEMUAN = "id,nama,semester,hari,sks,tanggal_mulai";
const KOLOM_MK_DASAR = "id,nama,semester,hari";

export type HasilMataKuliahServer = {
  daftar: MataKuliah[];
  galat: string | null;
  /** false kalau kolom `sks` / `tanggal_mulai` belum ada di tabel. */
  kolomPertemuanSiap: boolean;
};

export type HasilTugasServer = {
  daftar: TugasLengkap[];
  galat: string | null;
  kolomPertemuanSiap: boolean;
};

/**
 * Bentuk respons select yang dinetralkan: kolom yang diminta bisa berbeda
 * (dengan atau tanpa sks/tanggal_mulai), jadi tipenya tidak diikat ke satu select.
 */
type HasilSelectMk = { data: unknown; error: { message: string } | null };

function pesanGalat(tabel: string, pesan: string) {
  const bawah = pesan.toLowerCase();
  const petunjuk =
    bawah.includes("row-level security") || bawah.includes("permission denied")
      ? " Tabel belum mengizinkan pembacaan — pakai SUPABASE_SERVICE_ROLE_KEY atau tambahkan policy SELECT."
      : "";
  return `Gagal membaca tabel ${tabel}: ${pesan}.${petunjuk}`;
}

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
 * Ambil tabel `mata_kuliah` (khusus server). Kolom `sks` & `tanggal_mulai`
 * dicoba dulu; kalau belum ada di database, otomatis fallback ke kolom dasar.
 */
export async function bacaMataKuliah(): Promise<HasilMataKuliahServer> {
  if (!supabaseServer) {
    return { daftar: [], galat: galatSupabaseServer, kolomPertemuanSiap: false };
  }

  let kolomPertemuanSiap = true;
  let hasil: HasilSelectMk = await supabaseServer
    .from("mata_kuliah")
    .select(KOLOM_MK_PERTEMUAN)
    .order("nama", { ascending: true });

  if (hasil.error && perluFallbackKolom(hasil.error.message)) {
    kolomPertemuanSiap = false;
    hasil = await supabaseServer
      .from("mata_kuliah")
      .select(KOLOM_MK_DASAR)
      .order("nama", { ascending: true });
  }

  if (hasil.error) {
    return { daftar: [], galat: pesanGalat("mata_kuliah", hasil.error.message), kolomPertemuanSiap };
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

/**
 * Ambil `tugas` + `mata_kuliah` lalu gabungkan di server (khusus server).
 * Digabung manual (bukan embedded select) supaya tetap jalan apa pun nama
 * foreign key-nya.
 */
export async function bacaTugas(): Promise<HasilTugasServer> {
  if (!supabaseServer) {
    return { daftar: [], galat: galatSupabaseServer, kolomPertemuanSiap: false };
  }

  const [hasilMk, hasilTugas] = await Promise.all([
    bacaMataKuliah(),
    supabaseServer.from("tugas").select("*").order("tanggal_dikumpulkan", { ascending: true }),
  ]);

  if (hasilMk.galat) {
    return { daftar: [], galat: hasilMk.galat, kolomPertemuanSiap: hasilMk.kolomPertemuanSiap };
  }
  if (hasilTugas.error) {
    return {
      daftar: [],
      galat: pesanGalat("tugas", hasilTugas.error.message),
      kolomPertemuanSiap: hasilMk.kolomPertemuanSiap,
    };
  }

  const daftarTugas = (hasilTugas.data ?? []) as unknown as Tugas[];
  const petaMk = new Map(hasilMk.daftar.map((mk) => [mk.id, mk]));

  return {
    daftar: daftarTugas.map((tugas) => ({
      ...tugas,
      mata_kuliah: petaMk.get(tugas.id_mata_kuliah) ?? null,
    })),
    galat: null,
    kolomPertemuanSiap: hasilMk.kolomPertemuanSiap,
  };
}
