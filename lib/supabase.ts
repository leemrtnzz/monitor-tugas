import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const alamat = process.env.NEXT_PUBLIC_SUPABASE_URL;
const kunciAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const galatKonfigurasi: string | null =
  !alamat || !kunciAnon
    ? "Kredensial Supabase belum lengkap. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local, lalu restart dev server."
    : null;

/**
 * Klien Supabase sisi-browser (anon key). Aman dipakai di komponen klien
 * selama Row Level Security diatur dengan policy SELECT untuk role anon.
 */
export const supabase: SupabaseClient | null = galatKonfigurasi
  ? null
  : createClient(alamat!, kunciAnon!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "monitor-tugas" } },
    });
