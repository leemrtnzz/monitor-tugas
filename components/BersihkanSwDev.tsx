"use client";

import { useEffect } from "react";

const KUNCI_RELOAD = "monitor-tugas:sw-dibersihkan";

/**
 * Khusus development: buang service worker + cache yang tertinggal dari uji
 * produksi (`npm run build && npm start` di port yang sama).
 *
 * Tanpa ini, SW lama menyajikan HTML hasil build ke `next dev`, sehingga React
 * melaporkan "tree hydrated but some attributes ... didn't match". Di produksi
 * komponen ini tidak melakukan apa pun.
 */
export default function BersihkanSwDev() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    void (async () => {
      const registrasi = await navigator.serviceWorker.getRegistrations();
      const kunciCache = await caches.keys();

      if (registrasi.length === 0 && kunciCache.length === 0) return;

      await Promise.all(registrasi.map((item) => item.unregister()));
      await Promise.all(kunciCache.map((item) => caches.delete(item)));

      console.info(
        `[dev] Service worker sisa uji produksi dibersihkan (${registrasi.length} registrasi, ${kunciCache.length} cache).`,
      );

      // Muat ulang sekali saja supaya HTML yang dikontrol SW lama tidak dipakai.
      if (navigator.serviceWorker.controller && !sessionStorage.getItem(KUNCI_RELOAD)) {
        sessionStorage.setItem(KUNCI_RELOAD, "1");
        window.location.reload();
      }
    })();
  }, []);

  return null;
}
