import { timingSafeEqual } from "node:crypto";

export type HasilPin = { ok: true } | { ok: false; status: number; pesan: string };

export const PESAN_PIN_KOSONG_ENV =
  "APP_PIN belum diisi di .env.local. Tambahkan (misal APP_PIN=123456) lalu restart server supaya CRUD bisa dipakai.";

/**
 * Verifikasi PIN tanpa auth. PIN dibaca dari env server (APP_PIN), jadi tidak
 * pernah ikut terkirim ke browser. Perbandingan memakai timingSafeEqual.
 */
export function periksaPin(pin: string | null | undefined): HasilPin {
  const target = process.env.APP_PIN;

  if (!target) {
    return { ok: false, status: 500, pesan: PESAN_PIN_KOSONG_ENV };
  }

  const dikirim = (pin ?? "").trim();

  if (!dikirim) {
    return { ok: false, status: 401, pesan: "PIN wajib diisi untuk setiap operasi CRUD." };
  }

  const a = Buffer.from(dikirim, "utf8");
  const b = Buffer.from(target, "utf8");

  if (a.length !== b.length) {
    return { ok: false, status: 401, pesan: "PIN salah." };
  }

  return timingSafeEqual(a, b)
    ? { ok: true }
    : { ok: false, status: 401, pesan: "PIN salah." };
}
