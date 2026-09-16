"use client";

import { ambilPinSnapshot } from "./pin-client";

export type HasilApi<T> =
  | { ok: true; data: T }
  | { ok: false; pesan: string; status: number; pinSalah: boolean };

type Opsi = {
  metode?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  pin?: string;
};

/**
 * Semua panggilan CRUD lewat sini: PIN otomatis ikut di header `x-app-pin`
 * (diambil dari sessionStorage kalau tidak dikirim eksplisit).
 */
export async function mintaApi<T>(jalur: string, opsi: Opsi = {}): Promise<HasilApi<T>> {
  const pin = opsi.pin ?? ambilPinSnapshot();

  let respons: Response;
  try {
    respons = await fetch(jalur, {
      method: opsi.metode ?? "GET",
      headers: {
        "content-type": "application/json",
        ...(pin ? { "x-app-pin": pin } : {}),
      },
      body: opsi.body === undefined ? undefined : JSON.stringify(opsi.body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, pesan: "Tidak bisa menghubungi server. Cek koneksimu.", status: 0, pinSalah: false };
  }

  const mentah = await respons.text();
  let isi: { data?: T; error?: string; detail?: string } = {};
  try {
    isi = mentah ? JSON.parse(mentah) : {};
  } catch {
    isi = {};
  }

  if (!respons.ok) {
    return {
      ok: false,
      pesan: isi.error ?? `Permintaan gagal (HTTP ${respons.status}).`,
      status: respons.status,
      pinSalah: respons.status === 401,
    };
  }

  return { ok: true, data: (isi.data ?? null) as T };
}

export const ambilPinAktif = ambilPinSnapshot;
