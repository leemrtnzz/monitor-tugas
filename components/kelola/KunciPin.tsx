"use client";

import { useState, type FormEvent } from "react";
import { mintaApi } from "@/lib/api-client";
import { Input, Kolom, Tombol } from "./Ui";

/**
 * Gerbang PIN. PIN diverifikasi di server terhadap env APP_PIN, lalu disimpan
 * di sessionStorage supaya tiap permintaan CRUD otomatis mengirim header `x-app-pin`.
 */
export default function KunciPin({ onSukses }: { onSukses: (pin: string) => void }) {
  const [nilai, setNilai] = useState("");
  const [memeriksa, setMemeriksa] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kirim(event: FormEvent) {
    event.preventDefault();
    const pin = nilai.trim();

    if (!pin) {
      setGalat("PIN tidak boleh kosong.");
      return;
    }

    setMemeriksa(true);
    const hasil = await mintaApi<{ pesan: string }>("/api/pin", {
      metode: "POST",
      body: { pin },
      pin,
    });
    setMemeriksa(false);

    if (!hasil.ok) {
      setGalat(hasil.pesan);
      return;
    }

    setGalat(null);
    onSukses(pin);
  }

  return (
    <form
      onSubmit={kirim}
      className="mx-auto w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur"
    >
      <span aria-hidden className="text-3xl">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 10V8C6 4.69 7 2 12 2C17 2 18 4.69 18 8V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M17 22H7C3 22 2 21 2 17V15C2 11 3 10 7 10H17C21 10 22 11 22 15V17C22 21 21 22 17 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M15.9965 16H16.0054" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M11.9955 16H12.0045" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M7.99451 16H8.00349" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </span>
      <h2 className="mt-3 text-lg font-bold text-slate-50">Masukkan PIN</h2>
      {/* <p className="mt-1 text-xs leading-relaxed text-slate-400">
        Semua operasi CRUD (tambah, ubah, hapus) butuh PIN. PIN disimpan di{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5">APP_PIN</code> pada{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5">.env.local</code> dan hanya diverifikasi
        di server.
      </p> */}

      <div className="mt-4">
        <Kolom label="PIN">
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={nilai}
            onChange={(event) => setNilai(event.target.value)}
            placeholder="••••••"
          />
        </Kolom>
      </div>

      {galat && <p className="mt-3 text-xs font-medium text-red-300">{galat}</p>}

      <Tombol type="submit" disabled={memeriksa} className="mt-4 w-full">
        {memeriksa ? "Memeriksa…" : "Buka panel kelola"}
      </Tombol>
    </form>
  );
}
