"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Sumber waktu "sekarang" untuk seluruh aplikasi.
 *
 * Nilai disimpan di luar React dan dibaca lewat useSyncExternalStore supaya:
 * - server + render hidrasi pertama sama-sama membaca snapshot server (0),
 *   jadi tidak ada hydration mismatch walau teks waktunya berubah tiap detik;
 * - semua komponen (monitor tugas, daftar pertemuan) ikut berdetak bareng.
 */
let snapshotDetik = 0;

function perbaruiSnapshot() {
  snapshotDetik = Date.now();
}

function berlanggananDetik(callback: () => void) {
  const perbarui = () => {
    perbaruiSnapshot();
    callback();
  };

  perbarui();
  const timer = window.setInterval(perbarui, 1000);
  return () => window.clearInterval(timer);
}

const ambilSnapshotDetik = () => snapshotDetik;
const ambilSnapshotServer = () => 0;

/** null saat SSR / sebelum hidrasi selesai, Date setelahnya (diperbarui tiap detik). */
export function useJamSekarang(): Date | null {
  const ms = useSyncExternalStore(berlanggananDetik, ambilSnapshotDetik, ambilSnapshotServer);
  return useMemo(() => (ms ? new Date(ms) : null), [ms]);
}

function berlanggananTerpasang() {
  return () => {};
}

const ambilTerpasang = () => true;
const ambilBelumTerpasang = () => false;

/**
 * false saat SSR & render hidrasi pertama, true setelah mount. Dipakai untuk
 * atribut/teks yang bergantung state klien supaya markup server dan klien sama.
 */
export function useSudahTerpasang(): boolean {
  return useSyncExternalStore(berlanggananTerpasang, ambilTerpasang, ambilBelumTerpasang);
}
