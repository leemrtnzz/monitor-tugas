import { periksaPin } from "./pin";
import { galatSupabaseServer, memakaiServiceRole, supabaseServer } from "./supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const HEADER_PIN = "x-app-pin";

export function jawab(data: unknown, status = 200) {
  return Response.json({ data }, { status });
}

export function jawabGalat(pesan: string, status = 400, detail?: string) {
  return Response.json({ error: pesan, detail: detail ?? null }, { status });
}

/** Petunjuk tambahan kalau Supabase menolak karena RLS. */
export function pesanSupabase(pesan: string) {
  const bawah = pesan.toLowerCase();
  if (bawah.includes("row-level security") || bawah.includes("permission denied")) {
    return `${pesan} — pakai SUPABASE_SERVICE_ROLE_KEY di .env.local atau tambahkan policy INSERT/UPDATE/DELETE untuk role anon.`;
  }
  if (bawah.includes("foreign key") || bawah.includes("violates foreign key constraint")) {
    return `${pesan} — mata kuliah tersebut masih dipakai oleh data tugas lain.`;
  }
  return pesan;
}

export type Konteks = { klien: SupabaseClient } | { galat: Response };

/**
 * Gerbang setiap operasi API: PIN dari header x-app-pin harus benar, dan
 * klien Supabase server harus siap. Semua endpoint CRUD memakai ini.
 */
export function siapkan(request: Request): Konteks {
  const pin = periksaPin(request.headers.get(HEADER_PIN));

  if (!pin.ok) return { galat: jawabGalat(pin.pesan, pin.status) };
  if (!supabaseServer) return { galat: jawabGalat(galatSupabaseServer ?? "Supabase tidak siap.", 500) };

  return { klien: supabaseServer };
}

export async function bacaJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const isi = await request.json();
    return isi && typeof isi === "object" ? (isi as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export { memakaiServiceRole };
