import type { Metadata } from "next";
import Link from "next/link";
import Kelola from "@/components/kelola/Kelola";

export const metadata: Metadata = {
  title: "Kelola data",
  description: "Panel CRUD mata kuliah dan tugas (butuh PIN dari env APP_PIN).",
};

export default function HalamanKelola() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-24 sm:px-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.25em] text-slate-500 uppercase">
            Panel CRUD
          </p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-50">
            Kelola Mata Kuliah &amp; Tugas
          </h1>
        </div>

        <Link
          href="/"
          className="rounded-xl bg-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700"
        >
          ← Monitor tugas
        </Link>
      </header>

      <Kelola />
    </main>
  );
}
