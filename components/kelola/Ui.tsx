"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const DASAR =
  "w-full rounded-xl bg-slate-950/70 px-3 py-2 text-sm text-slate-100 ring-1 ring-white/10 outline-none transition placeholder:text-slate-500 focus:ring-sky-400/50";

export function Kolom({
  label,
  petunjuk,
  children,
}: {
  label: string;
  petunjuk?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        {label}
      </span>
      {children}
      {petunjuk && <span className="text-[11px] text-slate-500">{petunjuk}</span>}
    </label>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${DASAR} ${className}`} />;
}

export function Area({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${DASAR} min-h-24 ${className}`} />;
}

export function Pilih({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${DASAR} ${className}`} />;
}

const VARIASI = {
  utama: "bg-sky-500/90 text-slate-950 hover:bg-sky-400",
  netral: "bg-slate-800 text-slate-200 ring-1 ring-white/10 hover:bg-slate-700",
  bahaya: "bg-red-600/90 text-white hover:bg-red-500",
} as const;

export function Tombol({
  variasi = "utama",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variasi?: keyof typeof VARIASI }) {
  return (
    <button
      {...props}
      className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50 ${VARIASI[variasi]} ${className}`}
    />
  );
}

export function Pesan({
  jenis,
  teks,
}: {
  jenis: "galat" | "sukses" | "info";
  teks: string;
}) {
  const gaya = {
    galat: "border-red-500/40 bg-red-950/40 text-red-200",
    sukses: "border-emerald-500/40 bg-emerald-950/30 text-emerald-200",
    info: "border-sky-500/30 bg-sky-950/30 text-sky-200",
  }[jenis];

  return <div className={`rounded-xl border p-3 text-xs leading-relaxed ${gaya}`}>{teks}</div>;
}
