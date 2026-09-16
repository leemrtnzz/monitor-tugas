"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ListPertemuan from "@/components/ListPertemuan";
import { muatMataKuliah } from "@/lib/data";
import { formatJamLengkap, formatTanggal, formatTanggalCerdas } from "@/lib/format";
import { useJamSekarang, useSudahTerpasang } from "@/lib/jam";
import { buatJadwalPertemuan, labelMundur } from "@/lib/pertemuan";
import type { MataKuliah } from "@/lib/types";

const SQL_MIGRASI = `alter table mata_kuliah
  add column if not exists sks smallint,
  add column if not exists tanggal_mulai date;`;

export default function DaftarPertemuan() {
  const [daftar, setDaftar] = useState<MataKuliah[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [kolomSiap, setKolomSiap] = useState(true);
  const [memuat, setMemuat] = useState(true);
  const [versi, setVersi] = useState(0);

  // Jam realtime: berdetak tiap detik, jadi semua hitungan mundur ikut hidup.
  const sekarang = useJamSekarang();
  const sudahTerpasang = useSudahTerpasang();

  useEffect(() => {
    let aktif = true;

    void (async () => {
      const hasil = await muatMataKuliah();
      if (!aktif) return;
      setDaftar(hasil.daftar);
      setGalat(hasil.galat);
      setKolomSiap(hasil.kolomPertemuanSiap);
      setMemuat(false);
    })();

    return () => {
      aktif = false;
    };
  }, [versi]);

  const ringkasan = useMemo(() => {
    if (!sekarang) return null;

    const detail = daftar.map((mk) => ({ mk, jadwal: buatJadwalPertemuan(mk, sekarang) }));

    const hariIni = detail.flatMap((item) =>
      item.jadwal.daftar
        .filter((pertemuan) => pertemuan.status === "hari-ini")
        .map((pertemuan) => ({ mk: item.mk, pertemuan })),
    );

    const berikutnya =
      detail
        .flatMap((item) =>
          item.jadwal.berikutnya ? [{ mk: item.mk, pertemuan: item.jadwal.berikutnya }] : [],
        )
        .sort((a, b) => a.pertemuan.selisihHari - b.pertemuan.selisihHari)[0] ?? null;

    return {
      siap: detail.filter((item) => item.jadwal.siap).length,
      hariIni,
      berikutnya,
    };
  }, [daftar, sekarang]);

  const urut = useMemo(() => {
    if (!sekarang) return daftar;

    const bobot = (mk: MataKuliah) => {
      const jadwal = buatJadwalPertemuan(mk, sekarang);
      if (!jadwal.siap) return Number.MAX_SAFE_INTEGER;
      return jadwal.berikutnya?.selisihHari ?? 0;
    };

    return [...daftar].sort((a, b) => bobot(a) - bobot(b));
  }, [daftar, sekarang]);

  const sedangMemuat = memuat || !sekarang;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          {sekarang ? (
            <>
              {formatTanggal(sekarang)} · pukul{" "}
              <span className="font-semibold text-slate-100">{formatJamLengkap(sekarang)}</span>{" "}
              <span className="text-slate-500">(realtime)</span>
            </>
          ) : (
            "Menyiapkan jam…"
          )}
        </p>

        <button
          type="button"
          onClick={() => {
            setMemuat(true);
            setVersi((lama) => lama + 1);
          }}
          disabled={sudahTerpasang && memuat}
          className="rounded-xl bg-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700 disabled:opacity-50"
        >
          ⟳ {sudahTerpasang && memuat ? "Memuat…" : "Muat ulang"}
        </button>
      </div>

      {!kolomSiap && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-amber-200">
            Kolom <code>sks</code> dan <code>tanggal_mulai</code> belum ada di tabel{" "}
            <code>mata_kuliah</code>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-300/80">
            Jadwal pertemuan butuh dua kolom itu. Jalankan SQL berikut di Supabase → SQL Editor:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950/70 p-3 text-[11px] leading-relaxed text-slate-300 ring-1 ring-white/10">
            {SQL_MIGRASI}
          </pre>
          <p className="mt-2 text-xs text-amber-300/80">
            Setelah itu isi SKS &amp; tanggal mulai tiap mata kuliah lewat{" "}
            <Link href="/kelola" className="font-semibold underline">
              halaman Kelola → tab Mata kuliah
            </Link>
            .
          </p>
        </div>
      )}

      {galat && (
        <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-4">
          <p className="text-sm font-semibold text-red-200">Ada masalah saat mengambil data</p>
          <p className="mt-1 text-xs leading-relaxed text-red-300/80">{galat}</p>
        </div>
      )}

      {!sedangMemuat && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Statistik
            label="Mata kuliah"
            nilai={`${ringkasan?.siap ?? 0}/${daftar.length}`}
            keterangan=""
            warna="text-slate-100"
          />
          <Statistik
            label="Pertemuan hari ini"
            nilai={String(ringkasan?.hariIni.length ?? 0)}
            keterangan={
              ringkasan && ringkasan.hariIni.length > 0
                ? ringkasan.hariIni.map((item) => item.mk.nama).join(", ")
                : "tidak ada kelas hari ini"
            }
            warna={ringkasan && ringkasan.hariIni.length > 0 ? "text-red-300" : "text-slate-100"}
            penuh
          />
          <Statistik
            label="Pertemuan terdekat"
            nilai={ringkasan?.berikutnya ? labelMundur(ringkasan.berikutnya.pertemuan.selisihHari) : "—"}
            keterangan={
              ringkasan?.berikutnya
                ? `${ringkasan.berikutnya.mk.nama} · ${ringkasan.berikutnya.pertemuan.label} (${formatTanggalCerdas(
                    ringkasan.berikutnya.pertemuan.tanggal,
                    sekarang as Date,
                  )})`
                : "belum ada jadwal"
            }
            warna="text-sky-300"
          />
        </section>
      )}

      {!sedangMemuat && (
        <section
          className={`rounded-2xl border p-4 ${
            (ringkasan?.hariIni.length ?? 0) > 0
              ? "border-red-500/40 bg-red-950/20"
              : "border-slate-800 bg-slate-900/50"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-100">
              Kelas hari ini{sekarang ? ` — ${formatTanggal(sekarang)}` : ""}
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                (ringkasan?.hariIni.length ?? 0) > 0
                  ? "bg-red-500/20 text-red-200 ring-1 ring-red-400/40"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {(ringkasan?.hariIni.length ?? 0) > 0
                ? `${ringkasan?.hariIni.length} pertemuan`
                : "Tidak ada kelas"}
            </span>
          </div>

          <ul className="mt-3 flex flex-col gap-2">
            {(ringkasan?.hariIni ?? []).map(({ mk, pertemuan }) => (
              <li key={`${mk.id}-${pertemuan.label}`}>
                <a
                  href={`#mk-${mk.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 transition hover:border-red-400/40 hover:bg-slate-950/70"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-6 w-6 shrink-0 animate-pulse items-center justify-center rounded-md border-2 border-amber-400 bg-amber-400"
                    >
                      <svg
                        className="h-4 w-4 text-slate-950"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-100">
                        {mk.nama}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {pertemuan.label}
                        {pertemuan.tipe === "Mentari (Online)" ? " · Mentari (Online)" : ""} ·
                        minggu ke-{pertemuan.minggu}
                        {mk.hari ? ` · jadwal ${mk.hari}` : ""}
                      </span>
                    </span>
                  </span>

                  <span className="flex items-center gap-2">
                    {mk.sks ? (
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                        {mk.sks} SKS
                      </span>
                    ) : null}
                    <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-[11px] font-bold tracking-wide text-red-200 uppercase ring-1 ring-red-400/40">
                      Hari ini
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {(ringkasan?.hariIni.length ?? 0) === 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Tidak ada pertemuan yang jatuh hari ini. Jadwal tiap mata kuliah tetap bisa dilihat di
              daftar bawah.
            </p>
          )}
        </section>
      )}

      {sedangMemuat &&
        Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50"
          />
        ))}

      {!sedangMemuat &&
        urut.map((mk) => (
          <ListPertemuan key={mk.id} mataKuliah={mk} sekarang={sekarang as Date} />
        ))}

      {!sedangMemuat && daftar.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-200">Belum ada mata kuliah</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-400">
            Tambahkan mata kuliah beserta SKS dan tanggal mulai pertemuan pertama di{" "}
            <Link href="/kelola" className="font-semibold text-sky-300 underline">
              halaman Kelola
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}

function Statistik({
  label,
  nilai,
  keterangan,
  warna,
  penuh = false,
}: {
  label: string;
  nilai: string;
  keterangan: string;
  warna: string;
  /** true = keterangan tidak dipotong 2 baris. */
  penuh?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${warna}`}>{nilai}</p>
      <p
        className={`mt-1 text-[11px] leading-relaxed text-slate-500 ${penuh ? "" : "line-clamp-2"}`}
      >
        {keterangan}
      </p>
    </div>
  );
}
