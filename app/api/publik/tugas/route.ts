import { jawab, jawabGalat } from "@/lib/api-server";
import { bacaTugas } from "@/lib/data-server";

/**
 * PROXY READ PUBLIK (tanpa PIN) untuk halaman Monitor Tugas.
 * Mengembalikan tugas beserta data mata kuliahnya (sudah digabung di server).
 */
export async function GET() {
  const hasil = await bacaTugas();

  if (hasil.galat) return jawabGalat(hasil.galat, 500);
  return jawab({ daftar: hasil.daftar, kolomPertemuanSiap: hasil.kolomPertemuanSiap });
}
