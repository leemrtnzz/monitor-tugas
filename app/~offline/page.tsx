import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sedang offline",
};

export default function HalamanOffline() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <span aria-hidden className="text-5xl">
        📡
      </span>
      <h1 className="text-2xl font-bold text-slate-50">Kamu sedang offline</h1>
      <p className="text-sm leading-relaxed text-slate-400">
        Koneksi internet tidak terdeteksi. Halaman ini diambil dari cache service worker — buka lagi
        setelah jaringanmu kembali supaya data tenggat tugas terbaru bisa dimuat.
      </p>
      <p className="text-xs text-slate-600">
        Tips: sambungkan ulang internet lalu tarik ke bawah untuk menyegarkan.
      </p>
    </main>
  );
}
