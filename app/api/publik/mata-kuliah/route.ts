import { jawab, jawabGalat } from "@/lib/api-server";
import { bacaMataKuliah } from "@/lib/data-server";

/**
 * PROXY READ PUBLIK (tanpa PIN) untuk halaman Pertemuan.
 *
 * Browser tidak lagi memanggil Supabase langsung — kredensialnya tetap di server.
 */
export async function GET() {
  const hasil = await bacaMataKuliah();

  if (hasil.galat) return jawabGalat(hasil.galat, 500);
  return jawab({ daftar: hasil.daftar, kolomPertemuanSiap: hasil.kolomPertemuanSiap });
}
