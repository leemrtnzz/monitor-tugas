import { bacaJson, jawab, jawabGalat, pesanSupabase, siapkan } from "@/lib/api-server";
import { buatUlid } from "@/lib/ulid";
import { validasiTugas } from "@/lib/validasi";

/** READ — daftar tugas (butuh PIN karena dipakai panel kelola). */
export async function GET(request: Request) {
  const ctx = siapkan(request);
  if ("galat" in ctx) return ctx.galat;

  const { data, error } = await ctx.klien
    .from("tugas")
    .select("*")
    .order("tanggal_dikumpulkan", { ascending: true });

  if (error) return jawabGalat(pesanSupabase(error.message), 500);
  return jawab(data ?? []);
}

/** CREATE — tambah tugas. */
export async function POST(request: Request) {
  const ctx = siapkan(request);
  if ("galat" in ctx) return ctx.galat;

  const validasi = validasiTugas(await bacaJson(request), { wajib: true });
  if (!validasi.ok) return jawabGalat(validasi.pesan, 422);

  const { data, error } = await ctx.klien
    .from("tugas")
    .insert({ id: buatUlid(), ...validasi.nilai })
    .select()
    .single();

  if (error) return jawabGalat(pesanSupabase(error.message), 400);
  return jawab(data, 201);
}
