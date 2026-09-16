import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const alamat = process.env.NEXT_PUBLIC_SUPABASE_URL;
const kunciService = process.env.SUPABASE_SERVICE_ROLE_KEY;
const kunciAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const kunci = kunciService ?? kunciAnon;

/** true kalau server memakai service role (melewati RLS) untuk operasi tulis. */
export const memakaiServiceRole = Boolean(kunciService);

export const galatSupabaseServer: string | null =
  !alamat || !kunci
    ? "Kredensial Supabase untuk server belum lengkap. Isi NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (dan/atau SUPABASE_SERVICE_ROLE_KEY) di .env.local."
    : null;

/**
 * Klien Supabase khusus server (dipakai route handler API + verifikasi PIN).
 * Kalau SUPABASE_SERVICE_ROLE_KEY tidak ada, otomatis jatuh ke anon key —
 * artinya RLS harus mengizinkan insert/update/delete.
 */
export const supabaseServer: SupabaseClient | null = galatSupabaseServer
  ? null
  : createClient(alamat!, kunci!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "monitor-tugas-server" } },
    });
