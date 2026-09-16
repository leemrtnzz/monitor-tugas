"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { mintaApi } from "@/lib/api-client";
import {
  ambilPinSnapshot,
  ambilPinSnapshotServer,
  berlanggananPin,
  lupakanPin,
  simpanPin,
} from "@/lib/pin-client";
import type { MataKuliah, Tugas } from "@/lib/types";
import KunciPin from "./KunciPin";
import KelolaMataKuliah from "./KelolaMataKuliah";
import KelolaTugas from "./KelolaTugas";
import { Pesan, Tombol } from "./Ui";

type Tab = "tugas" | "mata-kuliah";

export default function Kelola() {
  const pin = useSyncExternalStore(berlanggananPin, ambilPinSnapshot, ambilPinSnapshotServer);

  const [tab, setTab] = useState<Tab>("tugas");
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [mataKuliah, setMataKuliah] = useState<MataKuliah[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [versi, setVersi] = useState(0);

  useEffect(() => {
    if (!pin) return;
    let aktif = true;

    void (async () => {
      const [hasilTugas, hasilMk] = await Promise.all([
        mintaApi<Tugas[]>("/api/tugas"),
        mintaApi<MataKuliah[]>("/api/mata-kuliah"),
      ]);

      if (!aktif) return;

      if (!hasilTugas.ok) {
        setMemuat(false);
        setGalat(hasilTugas.pesan);
        if (hasilTugas.pinSalah) lupakanPin();
        return;
      }

      if (!hasilMk.ok) {
        setMemuat(false);
        setGalat(hasilMk.pesan);
        if (hasilMk.pinSalah) lupakanPin();
        return;
      }

      setTugas(hasilTugas.data);
      setMataKuliah(hasilMk.data);
      setGalat(null);
      setMemuat(false);
    })();

    return () => {
      aktif = false;
    };
  }, [pin, versi]);

  function segarkan() {
    setMemuat(true);
    setVersi((lama) => lama + 1);
  }

  function kunci() {
    lupakanPin();
    setTugas([]);
    setMataKuliah([]);
    setGalat(null);
  }

  // PostgREST tidak mengembalikan kolom yang belum ada, jadi kita deteksi dari baris pertama.
  const kolomPertemuanSiap =
    mataKuliah.length === 0 || ("sks" in mataKuliah[0] && "tanggal_mulai" in mataKuliah[0]);

  if (!pin) {
    return <KunciPin onSukses={simpanPin} />;
  }

  const TAB: { id: Tab; label: string; jumlah: number }[] = [
    { id: "tugas", label: "Tugas", jumlah: tugas.length },
    { id: "mata-kuliah", label: "Mata kuliah", jumlah: mataKuliah.length },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {TAB.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                tab === item.id
                  ? "bg-slate-100 text-slate-900"
                  : "bg-slate-800/70 text-slate-300 ring-1 ring-white/10 hover:bg-slate-700/70"
              }`}
            >
              {item.label}
              <span className="ml-1.5 text-slate-500">{item.jumlah}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Tombol variasi="netral" onClick={segarkan} disabled={memuat}>
            ⟳ {memuat ? "Memuat…" : "Muat ulang"}
          </Tombol>
          <button 
  onClick={kunci}
  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 bg-slate-800 text-slate-200 ring-1 ring-white/10 hover:bg-slate-700"
>
  <svg 
    className="h-4 w-4 shrink-0" 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none"
  >
    <path 
      d="M6 10V8C6 4.69 7 2 12 2C17 2 18 4.69 18 8V10" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 18.5C13.3807 18.5 14.5 17.3807 14.5 16C14.5 14.6193 13.3807 13.5 12 13.5C10.6193 13.5 9.5 14.6193 9.5 16C9.5 17.3807 10.6193 18.5 12 18.5Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M17 22H7C3 22 2 21 2 17V15C2 11 3 10 7 10H17C21 10 22 11 22 15V17C22 21 21 22 17 22Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
  <span>Kunci</span>
</button>
        </div>
      </div>

      {galat && <Pesan jenis="galat" teks={galat} />}
      {memuat && tugas.length === 0 && mataKuliah.length === 0 && (
        <div className="h-24 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50" />
      )}

      {tab === "tugas" ? (
        <KelolaTugas
          tugas={tugas}
          mataKuliah={mataKuliah}
          onBerubah={segarkan}
          onPinSalah={kunci}
          bukaMataKuliah={() => setTab("mata-kuliah")}
        />
      ) : (
        <KelolaMataKuliah
          mataKuliah={mataKuliah}
          tugas={tugas}
          onBerubah={segarkan}
          onPinSalah={kunci}
          kolomPertemuanSiap={kolomPertemuanSiap}
        />
      )}
    </div>
  );
}
