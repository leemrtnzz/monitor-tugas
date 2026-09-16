import { bacaJson, jawab, jawabGalat, pesanSupabase, siapkan } from "@/lib/api-server";
import { validasiMataKuliah } from "@/lib/validasi";

type Konteks = { params: Promise<{ id: string }> };

/** UPDATE — ubah mata kuliah. */
export async function PATCH(request: Request, konteks: Konteks) {
  const ctx = siapkan(request);
  if ("galat" in ctx) return ctx.galat;

  const { id } = await konteks.params;
  const validasi = validasiMataKuliah(await bacaJson(request), { wajib: false });
  if (!validasi.ok) return jawabGalat(validasi.pesan, 422);

  const { data, error } = await ctx.klien
    .from("mata_kuliah")
    .update(validasi.nilai)
    .eq("id", id)
    .select();

  if (error) return jawabGalat(pesanSupabase(error.message), 400);
  if (!data || data.length === 0) return jawabGalat("Mata kuliah tidak ditemukan.", 404);
  return jawab(data[0]);
}

/** DELETE — hapus mata kuliah. */
export async function DELETE(request: Request, konteks: Konteks) {
  const ctx = siapkan(request);
  if ("galat" in ctx) return ctx.galat;

  const { id } = await konteks.params;
  const { data, error } = await ctx.klien.from("mata_kuliah").delete().eq("id", id).select();

  if (error) return jawabGalat(pesanSupabase(error.message), 400);
  if (!data || data.length === 0) return jawabGalat("Mata kuliah tidak ditemukan.", 404);
  return jawab(data[0]);
}
