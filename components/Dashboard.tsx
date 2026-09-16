"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import KartuTugas from "@/components/KartuTugas";
import PasangPwa from "@/components/PasangPwa";
import { muatTugas } from "@/lib/data";
import { TEMA, hitungInfo, type Tingkat } from "@/lib/deadline";
import { formatJamLengkap, formatTanggal } from "@/lib/format";
import { useJamSekarang, useSudahTerpasang } from "@/lib/jam";
import type { TugasLengkap, TugasTerhitung } from "@/lib/types";

type Saringan = "semua" | "sehari" | "tiga-hari" | "minggu" | "terlewat";

const FILTER: { id: Saringan; label: string; cocok: (tingkat: Tingkat) => boolean }[] = [
  { id: "semua", label: "Semua", cocok: () => true },
  { id: "sehari", label: "≤ 24 jam", cocok: (t) => t === "kritis" },
  { id: "tiga-hari", label: "≤ 3 hari", cocok: (t) => t === "kritis" || t === "mendesak" },
  { id: "minggu", label: "≤ 7 hari", cocok: (t) => t !== "aman" && t !== "terlewat" },
  { id: "terlewat", label: "Terlewat", cocok: (t) => t === "terlewat" },
];

export default function Dashboard() {
  const [daftar, setDaftar] = useState<TugasLengkap[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [saringan, setSaringan] = useState<Saringan>("semua");
  const [cari, setCari] = useState("");

  const sekarang = useJamSekarang();
  const sudahTerpasang = useSudahTerpasang();

  const tarikData = useCallback(async () => {
    const hasil = await muatTugas();
    setDaftar(hasil.daftar);
    setGalat(hasil.galat);
    setMemuat(false);
  }, []);

  // Muat pertama kali. setState hanya dipanggil setelah await, bukan di badan effect.
  useEffect(() => {
    let aktif = true;

    void (async () => {
      const hasil = await muatTugas();
      if (!aktif) return;
      setDaftar(hasil.daftar);
      setGalat(hasil.galat);
      setMemuat(false);
    })();

    return () => {
      aktif = false;
    };
  }, []);

  // Sinkron ulang tiap 5 menit + saat tab kembali aktif.
  useEffect(() => {
    const timer = window.setInterval(() => void tarikData(), 300_000);
    const saatFokus = () => void tarikData();
    window.addEventListener("focus", saatFokus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", saatFokus);
    };
  }, [tarikData]);

  const muatUlang = useCallback(() => {
    setMemuat(true);
    void tarikData();
  }, [tarikData]);

  const terhitung: TugasTerhitung[] = useMemo(() => {
    if (!sekarang) return [];
    return daftar
      .map((tugas) => ({ ...tugas, info: hitungInfo(tugas, sekarang) }))
      .sort((a, b) => a.info.tenggat.getTime() - b.info.tenggat.getTime());
  }, [daftar, sekarang]);

  const jumlah = useMemo(() => {
    const hitung = (uji: (tingkat: Tingkat) => boolean) =>
      terhitung.filter((item) => uji(item.info.tingkat)).length;
    return {
      total: terhitung.length,
      kritis: hitung((t) => t === "kritis"),
      tigaHari: hitung((t) => t === "kritis" || t === "mendesak"),
      terlewat: hitung((t) => t === "terlewat"),
    };
  }, [terhitung]);

  const tersaring = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    const filterAktif = FILTER.find((f) => f.id === saringan) ?? FILTER[0];

    return terhitung.filter((item) => {
      if (!filterAktif.cocok(item.info.tingkat)) return false;
      if (!kata) return true;
      const bahan = [item.judul, item.deskripsi ?? "", item.mata_kuliah?.nama ?? ""]
        .join(" ")
        .toLowerCase();
      return bahan.includes(kata);
    });
  }, [terhitung, saringan, cari]);

  const sedangMemuat = memuat || !sekarang;
  // Hanya boleh berbeda setelah hidrasi selesai.
  const sedangMuatTombol = sudahTerpasang && memuat;
  const palingBahaya = useMemo(() => tersaring[0] ?? null, [tersaring]);
  const temaBahaya =
    palingBahaya && palingBahaya.info.tingkat !== "aman"
      ? TEMA[palingBahaya.info.tingkat]
      : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-24 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
            Monitor Tugas Kuliah
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {sekarang ? (
              <>
                {formatTanggal(sekarang)} · pukul{" "}
                <span className="font-semibold text-slate-200">{formatJamLengkap(sekarang)}</span>
              </>
            ) : (
              "Menyiapkan jam…"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">

          <PasangPwa />
          <button
            type="button"
            onClick={muatUlang}
            disabled={sedangMuatTombol}
            className="rounded-xl bg-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700 disabled:opacity-50"
          >
            ⟳ {sedangMuatTombol ? "Memuat…" : "Muat ulang"}
          </button>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Statistik label="Total tugas" nilai={jumlah.total} warna="text-slate-100" />
        <Statistik
          label="Kritis ≤ 24 jam"
          nilai={jumlah.kritis}
          warna="text-red-300"
          ikon={TEMA.kritis.ikon}
        />
        <Statistik
          label="Mendesak ≤ 3 hari"
          nilai={jumlah.tigaHari}
          warna="text-orange-300"
          ikon={TEMA.mendesak.ikon}
        />
        <Statistik
          label="Terlewat"
          nilai={jumlah.terlewat}
          warna="text-rose-300"
          ikon={TEMA.terlewat.ikon}
        />
      </section>

      {galat && (
        <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-950/40 p-4">
          <p className="text-sm font-semibold text-red-200">Ada masalah saat mengambil data</p>
          <p className="mt-1 text-xs leading-relaxed text-red-300/80">{galat}</p>
        </div>
      )}

      {palingBahaya && temaBahaya && (
        <div
          className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${temaBahaya.kotak}`}
        >
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Paling mendesak sekarang
            </p>
            <p className={`mt-1 text-base font-bold ${temaBahaya.teks}`}>{palingBahaya.judul}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${temaBahaya.chip}`}>
            {temaBahaya.label}
          </span>
        </div>
      )}

      <section className="mt-6 flex flex-wrap items-center gap-2">
        {FILTER.map((filter) => {
          const aktif = filter.id === saringan;
          const total = terhitung.filter((item) => filter.cocok(item.info.tingkat)).length;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setSaringan(filter.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                aktif
                  ? "bg-slate-100 text-slate-900"
                  : "bg-slate-800/70 text-slate-300 ring-1 ring-white/10 hover:bg-slate-700/70"
              }`}
            >
              {filter.label}
              <span className="ml-1.5 text-slate-500">{total}</span>
            </button>
          );
        })}

        <input
          value={cari}
          onChange={(event) => setCari(event.target.value)}
          placeholder="Cari tugas atau mata kuliah…"
          className="ml-auto w-full rounded-full bg-slate-900/70 px-4 py-2 text-sm text-slate-200 ring-1 ring-white/10 outline-none placeholder:text-slate-500 focus:ring-sky-400/40 sm:w-64"
        />
      </section>

      <section className="mt-4 flex flex-col gap-4">
        {sedangMemuat &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50"
            />
          ))}

        {!sedangMemuat && tersaring.map((item) => (
          <KartuTugas
            key={item.id}
            tugas={item}
            info={item.info}
            sekarang={sekarang as Date}
          />
        ))}

        {!sedangMemuat && tersaring.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-200">
              {terhitung.length === 0
                ? "Belum ada tugas yang bisa ditampilkan"
                : "Tidak ada tugas pada filter ini"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-400">
              {terhitung.length === 0
                ? "Pastikan tabel mata_kuliah dan tugas sudah berisi data, dan Row Level Security mengizinkan role anon membaca (policy SELECT) untuk kedua tabel."
                : "Coba pilih filter “Semua” atau ubah kata pencarian."}
            </p>
          </div>
        )}
      </section>

      <footer className="mt-10 text-center text-[11px] text-slate-600">
        Made with <span className="text-red-500">❤</span> Sistem Informasi
      </footer>
    </div>
  );
}

function Statistik({
  label,
  nilai,
  warna,
  ikon,
}: {
  label: string;
  nilai: number;
  warna: string;
  ikon?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
        {ikon ? `${ikon} ` : ""}
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-bold ${warna}`}>{nilai}</p>
    </div>
  );
}
