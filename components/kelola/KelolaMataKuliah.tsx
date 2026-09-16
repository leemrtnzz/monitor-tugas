"use client";

import { useState, type FormEvent } from "react";
import { mintaApi } from "@/lib/api-client";
import { DAFTAR_HARI } from "@/lib/deadline";
import type { MataKuliah, Tugas } from "@/lib/types";
import { Input, Kolom, Pilih, Pesan, Tombol } from "./Ui";

type NilaiForm = {
  id?: string;
  nama: string;
  semester: string;
  hari: string;
};

type Props = {
  mataKuliah: MataKuliah[];
  tugas: Tugas[];
  onBerubah: () => void;
  onPinSalah: () => void;
};

const FORM_KOSONG: NilaiForm = { nama: "", semester: "", hari: "Rabu" };

export default function KelolaMataKuliah({ mataKuliah, tugas, onBerubah, onPinSalah }: Props) {
  const [nilai, setNilai] = useState<NilaiForm | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<string | null>(null);
  const [menghapus, setMenghapus] = useState<string | null>(null);

  const jumlahTugas = new Map<string, number>();
  for (const item of tugas) {
    jumlahTugas.set(item.id_mata_kuliah, (jumlahTugas.get(item.id_mata_kuliah) ?? 0) + 1);
  }

  async function simpan(event: FormEvent) {
    event.preventDefault();
    if (!nilai) return;

    setGalat(null);
    setPesan(null);
    setMenyimpan(true);

    const muatan = { nama: nilai.nama, semester: nilai.semester, hari: nilai.hari };

    const hasil = nilai.id
      ? await mintaApi(`/api/mata-kuliah/${nilai.id}`, { metode: "PATCH", body: muatan })
      : await mintaApi("/api/mata-kuliah", { metode: "POST", body: muatan });

    setMenyimpan(false);

    if (!hasil.ok) {
      if (hasil.pinSalah) onPinSalah();
      setGalat(hasil.pesan);
      return;
    }

    const baru = !nilai.id;
    setNilai(null);
    setPesan(baru ? "Mata kuliah berhasil ditambahkan." : "Mata kuliah berhasil diperbarui.");
    onBerubah();
  }

  async function hapus(id: string) {
    setGalat(null);
    setPesan(null);
    setMenghapus(id);

    const hasil = await mintaApi(`/api/mata-kuliah/${id}`, { metode: "DELETE" });

    setMenghapus(null);
    setKonfirmasi(null);

    if (!hasil.ok) {
      if (hasil.pinSalah) onPinSalah();
      setGalat(hasil.pesan);
      return;
    }

    setPesan("Mata kuliah berhasil dihapus.");
    onBerubah();
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          {mataKuliah.length} mata kuliah tersimpan. Setiap perubahan butuh PIN.
        </p>
        <Tombol
          onClick={() => {
            setGalat(null);
            setPesan(null);
            setNilai({ ...FORM_KOSONG });
          }}
        >
          + Tambah mata kuliah
        </Tombol>
      </div>

      {galat && <Pesan jenis="galat" teks={galat} />}
      {pesan && <Pesan jenis="sukses" teks={pesan} />}
      {mataKuliah.length === 0 && (
        <Pesan jenis="info" teks="Belum ada mata kuliah pada tabel mata_kuliah." />
      )}

      {nilai && (
        <form
          onSubmit={simpan}
          className="rounded-2xl border border-sky-500/30 bg-slate-900/70 p-5 backdrop-blur"
        >
          <h3 className="text-base font-bold text-slate-50">
            {nilai.id ? "Ubah mata kuliah" : "Mata kuliah baru"}
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Kolom label="Nama mata kuliah">
                <Input
                  required
                  value={nilai.nama}
                  onChange={(event) => setNilai({ ...nilai, nama: event.target.value })}
                  placeholder="Pemrograman Web 2"
                />
              </Kolom>
            </div>

            <Kolom label="Semester" petunjuk="1 – 20">
              <Input
                type="number"
                min={1}
                max={20}
                value={nilai.semester}
                onChange={(event) => setNilai({ ...nilai, semester: event.target.value })}
                placeholder="6"
              />
            </Kolom>

            <Kolom label="Hari">
              <Pilih
                value={nilai.hari}
                onChange={(event) => setNilai({ ...nilai, hari: event.target.value })}
              >
                {DAFTAR_HARI.map((hari) => (
                  <option key={hari} value={hari}>
                    {hari}
                  </option>
                ))}
              </Pilih>
            </Kolom>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Tombol type="submit" disabled={menyimpan}>
              {menyimpan ? "Menyimpan…" : nilai.id ? "Simpan perubahan" : "Simpan mata kuliah"}
            </Tombol>
            <Tombol type="button" variasi="netral" onClick={() => setNilai(null)}>
              Batal
            </Tombol>
          </div>
        </form>
      )}

      {mataKuliah.map((mk) => (
        <div
          key={mk.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-100">{mk.nama}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {mk.semester ? `Semester ${mk.semester}` : "Semester belum diisi"}
              {mk.hari ? ` · ${mk.hari}` : ""} · {jumlahTugas.get(mk.id) ?? 0} tugas ·{" "}
              <span className="font-mono text-[10px]">{mk.id}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {konfirmasi === mk.id ? (
              <>
                <span className="text-xs font-semibold text-red-300">Yakin hapus?</span>
                <Tombol
                  variasi="bahaya"
                  disabled={menghapus === mk.id}
                  onClick={() => void hapus(mk.id)}
                >
                  {menghapus === mk.id ? "Menghapus…" : "Ya, hapus"}
                </Tombol>
                <Tombol variasi="netral" onClick={() => setKonfirmasi(null)}>
                  Batal
                </Tombol>
              </>
            ) : (
              <>
                <Tombol
                  variasi="netral"
                  onClick={() => {
                    setGalat(null);
                    setPesan(null);
                    setNilai({
                      id: mk.id,
                      nama: mk.nama ?? "",
                      semester: mk.semester ? String(mk.semester) : "",
                      hari: mk.hari ?? "Rabu",
                    });
                  }}
                >
                  Ubah
                </Tombol>
                <Tombol variasi="bahaya" onClick={() => setKonfirmasi(mk.id)}>
                  Hapus
                </Tombol>
              </>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
