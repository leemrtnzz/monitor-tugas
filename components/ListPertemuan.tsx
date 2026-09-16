"use client";

import { useMemo } from "react";
import { formatTanggalCerdas, formatJamLengkap } from "@/lib/format";
import { buatJadwalPertemuan, labelMundur } from "@/lib/pertemuan";
import type { MataKuliah } from "@/lib/types";

type Props = {
  mataKuliah: MataKuliah;
  /** Waktu sekarang dari lib/jam (berdetak tiap detik). */
  sekarang: Date;
};

const GAYA_STATUS = {
  selesai: { baris: "border-slate-800 bg-slate-900/40", chip: "bg-slate-800 text-slate-400" },
  "hari-ini": {
    baris: "border-red-500/50 bg-red-950/25 shadow-lg shadow-red-950/40",
    chip: "bg-red-500/20 text-red-200 ring-1 ring-red-400/40",
  },
  "akan-datang": {
    baris: "border-slate-800 bg-slate-900/60",
    chip: "bg-slate-800 text-slate-300 ring-1 ring-white/10",
  },
} as const;

export default function ListPertemuan({ mataKuliah, sekarang }: Props) {
  const jadwal = useMemo(() => buatJadwalPertemuan(mataKuliah, sekarang), [mataKuliah, sekarang]);

  if (!jadwal.siap) {
    return (
      <article
        id={`mk-${mataKuliah.id}`}
        className="scroll-mt-24 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5"
      >
        <h3 className="text-base font-bold text-slate-100">{mataKuliah.nama}</h3>
        <p className="mt-1 text-xs leading-relaxed text-amber-200">
          SKS dan tanggal mulai pertemuan belum diisi, jadi jadwalnya belum bisa dihitung. Lengkapi
          di halaman <span className="font-semibold">Kelola → tab Mata kuliah</span>.
        </p>
      </article>
    );
  }

  const total = jadwal.daftar.length;
  const persen = Math.round((jadwal.tercapai / total) * 100);
  const jumlahMentari = jadwal.daftar.filter((item) => item.tipe === "Mentari (Online)").length;

  return (
    <article
      id={`mk-${mataKuliah.id}`}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50"
    >
      <header className="border-b border-slate-800 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-50">{mataKuliah.nama}</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {mataKuliah.sks} SKS · {jadwal.daftar.filter((item) => item.ke !== null).length}{" "}
              pertemuan + UTS + UAS ·{" "}
              {mataKuliah.hari ? `jadwal ${mataKuliah.hari}` : "hari belum diisi"} · mulai{" "}
              {formatTanggalCerdas(jadwal.daftar[0].tanggal, sekarang)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 ring-1 ring-white/10">
              {jadwal.tercapai}/{total} terlaksana
            </span>
            {jumlahMentari > 0 && (
              <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-200 ring-1 ring-sky-400/30">
                {jumlahMentari} online
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            <span>Progres perkuliahan (centang otomatis dari tanggal)</span>
            <span>{persen}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-linear-to-r from-sky-500 to-emerald-400 transition-[width] duration-700"
              style={{ width: `${Math.max(persen, 2)}%` }}
            />
          </div>
        </div>

        {jadwal.berikutnya && (
          <div
            className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 ${
              jadwal.berikutnya.status === "hari-ini"
                ? "border-red-500/40 bg-red-950/30"
                : "border-sky-500/30 bg-sky-500/5"
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Berikutnya
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-100">
                {jadwal.berikutnya.label}
                {jadwal.berikutnya.tipe === "Mentari (Online)" ? " · Mentari (Online)" : ""} ·{" "}
                {formatTanggalCerdas(jadwal.berikutnya.tanggal, sekarang)}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                jadwal.berikutnya.status === "hari-ini"
                  ? "animate-pulse bg-red-500/20 text-red-200 ring-1 ring-red-400/40"
                  : "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30"
              }`}
            >
              {jadwal.berikutnya.status === "hari-ini"
                ? "HARI INI!"
                : labelMundur(jadwal.berikutnya.selisihHari)}
            </span>
          </div>
        )}

        <p className="mt-2 text-[11px] text-slate-500">
          Jam sekarang {formatJamLengkap(sekarang)} — centang &amp; hitungan diperbarui otomatis tiap
          detik.
        </p>
      </header>

      <div className="flex flex-col gap-2.5 p-4">
        {jadwal.daftar.map((item) => {
          const gaya = GAYA_STATUS[item.status];
          const ujian = item.tipe === "UTS" || item.tipe === "UAS";

          return (
            <div
              key={`${item.tipe}-${item.ke ?? item.label}`}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition ${gaya.baris} ${
                item.status === "selesai" ? "opacity-75" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                {/* Centang otomatis: tanggalnya sudah tiba atau lewat */}
                <span
                  aria-label={item.tercapai ? "Sudah terlaksana" : "Belum terlaksana"}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                    item.tercapai
                      ? item.status === "hari-ini"
                        ? "animate-pulse border-amber-400 bg-amber-400"
                        : "border-emerald-500 bg-emerald-500"
                      : "border-slate-600"
                  }`}
                >
                  {item.tercapai && (
                    <svg
                      className="h-4 w-4 text-slate-950"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>

                <span
                  className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-bold ${
                    ujian
                      ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40"
                      : item.berikutnya
                        ? "bg-slate-100 text-slate-900"
                        : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {item.ke ?? item.tipe}
                </span>

                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-100">
                    {item.label}
                    {item.tipe === "Mentari (Online)" && (
                      <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-sky-200 uppercase">
                        Mentari online
                      </span>
                    )}
                    {item.berikutnya && (
                      <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-sky-200 uppercase">
                        Berikutnya
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatTanggalCerdas(item.tanggal, sekarang)} · Minggu ke-{item.minggu}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${gaya.chip}`}
                >
                  {item.status === "hari-ini"
                    ? "Hari ini"
                    : item.status === "selesai"
                      ? "Terlaksana"
                      : "Akan datang"}
                </span>

                <span className="w-28 text-right text-xs font-medium text-slate-400">
                  {item.status === "hari-ini" ? "Saatnya sekarang" : labelMundur(item.selisihHari)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
