"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TAUTAN = [
  { href: "/", label: "Monitor Tugas", pendek: "Monitor", ikon: "" },
  { href: "/pertemuan", label: "Jadwal Pertemuan", pendek: "Pertemuan", ikon: "" },
  { href: "/kelola", label: "Kelola Data", pendek: "Kelola", ikon: "" },
] as const;

/** Navigasi utama aplikasi (menempel di atas, aktif mengikuti halaman). */
export default function NavUtama() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-1.5 px-4 py-2.5 sm:px-6">
        <span className="mr-auto hidden text-sm font-bold tracking-tight text-slate-300 sm:block">
          Sistem Monitor Tugas
        </span>

        {TAUTAN.map((tautan) => {
          const aktif = pathname === tautan.href;

          return (
            <Link
              key={tautan.href}
              href={tautan.href}
              title={tautan.label}
              aria-current={aktif ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                aktif
                  ? "bg-slate-100 text-slate-900"
                  : "bg-slate-800/70 text-slate-300 ring-1 ring-white/10 hover:bg-slate-700/70"
              }`}
            >
              <span aria-hidden>{tautan.ikon}</span>{" "}
              <span className="hidden sm:inline">{tautan.label}</span>
              <span className="sm:hidden">{tautan.pendek}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
