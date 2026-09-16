import { TEMA, type InfoTenggat } from "@/lib/deadline";
import {
  formatDurasi,
  formatJam,
  formatTanggalCerdas,
  formatTenggat,
  selisihHari,
} from "@/lib/format";
import { pesanSeram } from "@/lib/pesan";
import type { TugasLengkap } from "@/lib/types";

type Props = {
  tugas: TugasLengkap;
  info: InfoTenggat;
  sekarang: Date;
};

export default function KartuTugas({ tugas, info, sekarang }: Props) {
  const tema = TEMA[info.tingkat];
  const pesan = pesanSeram(info.tingkat, tugas.id);
  const mk = tugas.mata_kuliah;
  const bahaya = info.tingkat === "kritis" || info.tingkat === "terlewat";
  const hariKalender = selisihHari(sekarang, info.tenggat);

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-slate-900/60 p-5 shadow-lg backdrop-blur transition ${tema.kartu} ${
        bahaya ? "shadow-red-950/50" : "shadow-black/30"
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1.5 ${tema.aksen} ${tema.denyut ? "animate-pulse" : ""}`}
      />

      <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
              {mk?.nama ?? "Tanpa mata kuliah"}
            </span>
            {mk?.semester != null && (
              <span className="text-xs text-slate-400">Semester {mk.semester}</span>
            )}
            {mk?.hari && <span className="text-xs text-slate-500">• Jadwal {mk.hari}</span>}
          </div>
          <h3 className="mt-2 text-lg leading-snug font-semibold text-slate-50">{tugas.judul}</h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={`rounded-full flex items-center justify-center py-1 text-xs font-bold tracking-wide uppercase ${tema.chip}`}>
            {tema.ikon} {tema.label}
          </span>
          <span className="text-xs font-medium text-slate-400" title={formatTenggat(info.tenggat)}>
            {info.lewat ? `Terlambat ${formatDurasi(info.msSisa)}` : `Sisa ${formatDurasi(info.msSisa)}`}
          </span>
        </div>
      </div>

      {tugas.deskripsi && (
        <p className="mt-3 pl-2 text-sm leading-relaxed whitespace-pre-line text-slate-300">
          {tugas.deskripsi}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-2.5 pl-2 sm:grid-cols-4">
        <Info label="Diterbitkan" nilai={formatTanggalCerdas(info.terbit, sekarang)} />
        <Info
          label="Tenggat"
          nilai={`${formatTanggalCerdas(info.tenggat, sekarang)} · ${formatJam(info.tenggat)}`}
        />
        <Info label="Masa pengerjaan" nilai={`${info.totalHari} hari`} />
        <Info
          label={info.lewat ? "Terlambat" : "Sisa waktu"}
          nilai={formatDurasi(info.msSisa)}
          bahaya={info.lewat}
        />
      </dl>

      <div className="mt-5 pl-2">
        <div className="flex items-center justify-between text-[11px] font-medium tracking-wider text-slate-500 uppercase">
          <span>Terbit {formatTanggalCerdas(info.terbit, sekarang)}</span>
          <span className="text-slate-400">{info.totalHari} hari masa pengerjaan</span>
          <span>Tenggat {formatTanggalCerdas(info.tenggat, sekarang)}</span>
        </div>

        <div className="relative mt-2 h-3.5">
  
  {/* Wrapper untuk Background dan Progress Bar (overflow-hidden ada di sini) */}
  <div className="absolute inset-0 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/5 ring-inset">
    
    {/* Progress Fill */}
    <div
      className={`h-full rounded-full transition-[width] duration-700 ease-out ${tema.bilah}`}
      style={{ width: `${Math.max(info.persen, 3)}%` }}
    />
    
    {/* Garis Pemisah */}
    <div aria-hidden className="pointer-events-none absolute inset-0 flex justify-between">
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className="h-full w-px bg-slate-950/40" />
      ))}
    </div>
    
  </div>

  {/* Handle / Bulatan (Berada di luar overflow-hidden, ditambah z-10) */}
  <span
    aria-hidden
    className={`absolute z-10 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-slate-950 bg-slate-100 shadow ${
      tema.denyut ? "animate-pulse" : ""
    }`}
    style={{ left: `clamp(0px, calc(${info.persen}% - 10px), calc(100% - 20px))` }}
  />
  
</div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-400">{info.persen}% waktu terpakai</span>
          <span className={`font-semibold ${tema.teks}`}>
            {hariKalender >= 0
              ? `${hariKalender} hari kalender lagi`
              : `lewat ${Math.abs(hariKalender)} hari kalender`}
          </span>
        </div>
      </div>

      <div className={`mt-4 ml-2 flex items-start gap-3 rounded-xl border p-3.5 ${tema.kotak}`}>
        <span aria-hidden className="text-lg leading-none">
          {tema.ikon}
        </span>
        <div>
          <p className={`text-sm font-semibold ${tema.teks}`}>{pesan.seruan}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{pesan.saran}</p>
        </div>
      </div>
    </article>
  );
}

function Info({ label, nilai, bahaya = false }: { label: string; nilai: string; bahaya?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-950/60 p-2.5 ring-1 ring-white/5">
      <dt className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">{label}</dt>
      <dd className={`mt-0.5 text-sm font-medium ${bahaya ? "text-red-300" : "text-slate-200"}`}>
        {nilai}
      </dd>
    </div>
  );
}
