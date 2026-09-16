"use client";

const KUNCI = "monitor-tugas:pin";

let cache = "";
let sudahDibaca = false;
const pendengar = new Set<() => void>();

function beritahu() {
  pendengar.forEach((callback) => callback());
}

export function berlanggananPin(callback: () => void) {
  pendengar.add(callback);
  return () => {
    pendengar.delete(callback);
  };
}

function bacaSession(): string {
  try {
    return window.sessionStorage.getItem(KUNCI) ?? "";
  } catch {
    return "";
  }
}

/** Snapshot klien: PIN diambil dari sessionStorage sekali, lalu di-cache. */
export function ambilPinSnapshot(): string {
  if (!sudahDibaca && typeof window !== "undefined") {
    cache = bacaSession();
    sudahDibaca = true;
  }
  return cache;
}

/** Snapshot server: selalu terkunci, jadi render awal bebas hydration mismatch. */
export function ambilPinSnapshotServer(): string {
  return "";
}

export function simpanPin(pin: string) {
  cache = pin;
  sudahDibaca = true;
  try {
    window.sessionStorage.setItem(KUNCI, pin);
  } catch {
    /* sessionStorage bisa diblokir; PIN tetap hidup di memori */
  }
  beritahu();
}

export function lupakanPin() {
  cache = "";
  sudahDibaca = true;
  try {
    window.sessionStorage.removeItem(KUNCI);
  } catch {
    /* abaikan */
  }
  beritahu();
}
