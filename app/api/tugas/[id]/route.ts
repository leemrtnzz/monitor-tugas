import { bacaJson, jawab, jawabGalat, pesanSupabase, siapkan } from "@/lib/api-server";
import { validasiTugas } from "@/lib/validasi";

type Konteks = { params: Promise<{ id: string }> };

/** UPDATE — ubah tugas. */
export async function PATCH(request: Request, konteks: Konteks) {
  const ctx = siapkan(request);
  if ("galat" in ctx) return ctx.galat;

  const { id } = await konteks.params;
  const validasi = validasiTugas(await bacaJson(request), { wajib: false });
  if (!validasi.ok) return jawabGalat(validasi.pesan, 422);

  const { data, error } = await ctx.klien.from("tugas").update(validasi.nilai).eq("id", id).select();

  if (error) return jawabGalat(pesanSupabase(error.message), 400);
  if (!data || data.length === 0) return jawabGalat("Tugas tidak ditemukan.", 404);
  return jawab(data[0]);
}

/** DELETE — hapus tugas. */
export async function DELETE(request: Request, konteks: Konteks) {
  const ctx = siapkan(request);
  if ("galat" in ctx) return ctx.galat;

  const { id } = await konteks.params;
  const { data, error } = await ctx.klien.from("tugas").delete().eq("id", id).select();

  if (error) return jawabGalat(pesanSupabase(error.message), 400);
  if (!data || data.length === 0) return jawabGalat("Tugas tidak ditemukan.", 404);
  return jawab(data[0]);
}
