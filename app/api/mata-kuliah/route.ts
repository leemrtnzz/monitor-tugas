import { bacaJson, jawab, jawabGalat, pesanSupabase, siapkan } from "@/lib/api-server";
import { buatUlid } from "@/lib/ulid";
import { validasiMataKuliah } from "@/lib/validasi";

/** READ — daftar mata kuliah (butuh PIN karena dipakai panel kelola). */
export async function GET(request: Request) {
  const ctx = siapkan(request);
  if ("galat" in ctx) return ctx.galat;

  const { data, error } = await ctx.klien
    .from("mata_kuliah")
    .select("id,nama,semester,hari")
    .order("nama", { ascending: true });

  if (error) return jawabGalat(pesanSupabase(error.message), 500);
  return jawab(data ?? []);
}

/** CREATE — tambah mata kuliah. */
export async function POST(request: Request) {
  const ctx = siapkan(request);
  if ("galat" in ctx) return ctx.galat;

  const validasi = validasiMataKuliah(await bacaJson(request), { wajib: true });
  if (!validasi.ok) return jawabGalat(validasi.pesan, 422);

  const { data, error } = await ctx.klien
    .from("mata_kuliah")
    .insert({ id: buatUlid(), ...validasi.nilai })
    .select()
    .single();

  if (error) return jawabGalat(pesanSupabase(error.message), 400);
  return jawab(data, 201);
}
