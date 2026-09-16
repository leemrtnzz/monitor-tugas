import type { Metadata } from "next";
import DaftarPertemuan from "@/components/DaftarPertemuan";

export const metadata: Metadata = {
  title: "Jadwal Pertemuan",
  description:
    "Daftar pertemuan tiap mata kuliah (2 SKS = 14, 3 SKS = 21) dengan status realtime terhadap waktu sekarang.",
};

export default function HalamanPertemuan() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-24 sm:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-slate-500 uppercase">
          Realtime
        </p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
          Jadwal Pertemuan
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Satu pertemuan tiap 7 hari dari tanggal mulai. Status, progres, dan hitungan mundurnya
          mengikuti waktu sekarang — diperbarui tiap detik.
        </p>
      </header>

      <DaftarPertemuan />
    </main>
  );
}
