import { randomBytes } from "node:crypto";

const ALFABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32 (ULID)
const PANJANG_WAKTU = 10;
const PANJANG_ACAK = 16;

/**
 * Buat ULID (26 karakter, urut berdasarkan waktu) untuk kolom `id` bertipe text.
 * Hanya dipakai di server, jadi aman memakai node:crypto.
 */
export function buatUlid(waktu: number = Date.now()): string {
  let depan = "";
  let sisa = waktu;

  for (let i = 0; i < PANJANG_WAKTU; i++) {
    depan = ALFABET[sisa % 32] + depan;
    sisa = Math.floor(sisa / 32);
  }

  const acak = randomBytes(PANJANG_ACAK);
  let belakang = "";
  for (let i = 0; i < PANJANG_ACAK; i++) {
    belakang += ALFABET[acak[i] % 32];
  }

  return depan + belakang;
}

export function terlihatSepertiUlid(nilai: string) {
  return /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(nilai);
}
