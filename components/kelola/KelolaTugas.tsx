"use client";

import { useState, type FormEvent } from "react";
import { mintaApi } from "@/lib/api-client";
import { TEMA, hitungInfo } from "@/lib/deadline";
import { formatDurasi, formatTenggat, keJamInput, keTanggalInput } from "@/lib/format";
import type { MataKuliah, Tugas } from "@/lib/types";
import { Area, Input, Kolom, Pilih, Pesan, Tombol } from "./Ui";

type NilaiForm = {
  id?: string;
  judul: string;
  deskripsi: string;
  id_mata_kuliah: string;
  tanggal_diterbitkan: string;
  tanggal_dikumpulkan: string;
  maksimal_dikumpulkan_jam: string;
};

type Props = {
  tugas: Tugas[];
  mataKuliah: MataKuliah[];
  onBerubah: () => void;
  onPinSalah: () => void;
  bukaMataKuliah: () => void;
};

function hariIni() {
  const sekarang = new Date();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
  const tanggal = String(sekarang.getDate()).padStart(2, "0");
  return `${sekarang.getFullYear()}-${bulan}-${tanggal}`;
}

function formBaru(mataKuliah: MataKuliah[]): NilaiForm {
  return {
    judul: "",
    deskripsi: "",
    id_mata_kuliah: mataKuliah[0]?.id ?? "",
    tanggal_diterbitkan: hariIni(),
    tanggal_dikumpulkan: "",
    maksimal_dikumpulkan_jam: "20:00",
  };
}

function formDari(item: Tugas): NilaiForm {
  return {
    id: item.id,
    judul: item.judul ?? "",
    deskripsi: item.deskripsi ?? "",
    id_mata_kuliah: item.id_mata_kuliah ?? "",
    tanggal_diterbitkan: keTanggalInput(item.tanggal_diterbitkan),
    tanggal_dikumpulkan: keTanggalInput(item.tanggal_dikumpulkan),
    maksimal_dikumpulkan_jam: keJamInput(item.maksimal_dikumpulkan_jam),
  };
}

export default function KelolaTugas({
  tugas,
  mataKuliah,
  onBerubah,
  onPinSalah,
  bukaMataKuliah,
}: Props) {
  const [nilai, setNilai] = useState<NilaiForm | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<string | null>(null);
  const [menghapus, setMenghapus] = useState<string | null>(null);

  const [sekarang] = useState(() => new Date());
  const petaMk = new Map(mataKuliah.map((mk) => [mk.id, mk]));

  function ubah(kunci: keyof NilaiForm, isi: string) {
    setNilai((lama) => (lama ? { ...lama, [kunci]: isi } : lama));
  }

  async function simpan(event: FormEvent) {
    event.preventDefault();
    if (!nilai) return;

    setGalat(null);
    setPesan(null);
    setMenyimpan(true);

    const muatan = {
      judul: nilai.judul,
      deskripsi: nilai.deskripsi,
      id_mata_kuliah: nilai.id_mata_kuliah,
      tanggal_diterbitkan: nilai.tanggal_diterbitkan,
      tanggal_dikumpulkan: nilai.tanggal_dikumpulkan,
      maksimal_dikumpulkan_jam: nilai.maksimal_dikumpulkan_jam,
    };

    const hasil = nilai.id
      ? await mintaApi(`/api/tugas/${nilai.id}`, { metode: "PATCH", body: muatan })
      : await mintaApi("/api/tugas", { metode: "POST", body: muatan });

    setMenyimpan(false);

    if (!hasil.ok) {
      if (hasil.pinSalah) onPinSalah();
      setGalat(hasil.pesan);
      return;
    }

    setNilai(null);
    setPesan(nilai.id ? "Tugas berhasil diperbarui." : "Tugas berhasil ditambahkan.");
    onBerubah();
  }

  async function hapus(id: string) {
    setGalat(null);
    setPesan(null);
    setMenghapus(id);

    const hasil = await mintaApi(`/api/tugas/${id}`, { metode: "DELETE" });

    setMenghapus(null);
    setKonfirmasi(null);

    if (!hasil.ok) {
      if (hasil.pinSalah) onPinSalah();
      setGalat(hasil.pesan);
      return;
    }

    setPesan("Tugas berhasil dihapus.");
    onBerubah();
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          {tugas.length} tugas tersimpan. Setiap perubahan butuh PIN.
        </p>
        <Tombol
          onClick={() => {
            setGalat(null);
            setPesan(null);
            setNilai(formBaru(mataKuliah));
          }}
          disabled={mataKuliah.length === 0}
        >
          + Tambah tugas
        </Tombol>
      </div>

      {mataKuliah.length === 0 && (
        <Pesan
          jenis="info"
          teks="Belum ada mata kuliah. Tambahkan mata kuliah dulu sebelum membuat tugas."
        />
      )}

      {galat && <Pesan jenis="galat" teks={galat} />}
      {pesan && <Pesan jenis="sukses" teks={pesan} />}
      {tugas.length === 0 && <Pesan jenis="info" teks="Belum ada tugas pada tabel tugas." />}

      {nilai && (
        <form
          onSubmit={simpan}
          className="rounded-2xl border border-sky-500/30 bg-slate-900/70 p-5 backdrop-blur"
        >
          <h3 className="text-base font-bold text-slate-50">
            {nilai.id ? "Ubah tugas" : "Tugas baru"}
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Kolom label="Judul">
              <Input
                required
                value={nilai.judul}
                onChange={(event) => ubah("judul", event.target.value)}
                placeholder="Pembuatan Diagram"
              />
            </Kolom>

            <Kolom label="Mata kuliah">
              <Pilih
                required
                value={nilai.id_mata_kuliah}
                onChange={(event) => ubah("id_mata_kuliah", event.target.value)}
              >
                {mataKuliah.map((mk) => (
                  <option key={mk.id} value={mk.id}>
                    {mk.nama}
                    {mk.semester ? ` (semester ${mk.semester})` : ""}
                  </option>
                ))}
              </Pilih>
            </Kolom>

            <div className="sm:col-span-2">
              <Kolom label="Deskripsi">
                <Area
                  value={nilai.deskripsi}
                  onChange={(event) => ubah("deskripsi", event.target.value)}
                  placeholder="Membuat diagram ERD, DFD, dan UML pada aplikasi Gojek"
                />
              </Kolom>
            </div>

            <Kolom label="Tanggal diterbitkan">
              <Input
                type="date"
                value={nilai.tanggal_diterbitkan}
                onChange={(event) => ubah("tanggal_diterbitkan", event.target.value)}
              />
            </Kolom>

            <Kolom label="Tanggal dikumpulkan">
              <Input
                type="date"
                required
                value={nilai.tanggal_dikumpulkan}
                onChange={(event) => ubah("tanggal_dikumpulkan", event.target.value)}
              />
            </Kolom>

            <Kolom label="Maksimal jam pengumpulan" petunjuk="Contoh: 20:00 atau 23:59">
              <Input
                type="time"
                value={nilai.maksimal_dikumpulkan_jam}
                onChange={(event) => ubah("maksimal_dikumpulkan_jam", event.target.value)}
              />
            </Kolom>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Tombol type="submit" disabled={menyimpan}>
              {menyimpan ? "Menyimpan…" : nilai.id ? "Simpan perubahan" : "Simpan tugas"}
            </Tombol>
            <Tombol type="button" variasi="netral" onClick={() => setNilai(null)}>
              Batal
            </Tombol>
          </div>
        </form>
      )}

      {tugas.map((item) => {
        const mk = petaMk.get(item.id_mata_kuliah);
        const info = hitungInfo(item, sekarang);
        const tema = TEMA[info.tingkat];

        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${tema.chip}`}>
                  {tema.ikon} {tema.label}
                </span>
                <span className="text-xs text-slate-400">
                  {mk?.nama ?? "Tanpa mata kuliah"}
                  {mk?.semester ? ` · semester ${mk.semester}` : ""}
                  {mk?.hari ? ` · ${mk.hari}` : ""}
                </span>
              </div>
              <p className="mt-1 truncate font-semibold text-slate-100">{item.judul}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Tenggat {formatTenggat(info.tenggat)} · {formatDurasi(info.msSisa)}{" "}
                {info.lewat ? "terlambat" : "lagi"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {konfirmasi === item.id ? (
                <>
                  <span className="text-xs font-semibold text-red-300">Yakin hapus?</span>
                  <Tombol
                    variasi="bahaya"
                    disabled={menghapus === item.id}
                    onClick={() => void hapus(item.id)}
                  >
                    {menghapus === item.id ? "Menghapus…" : "Ya, hapus"}
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
                      setNilai(formDari(item));
                    }}
                  >
                    Ubah
                  </Tombol>
                  <Tombol variasi="bahaya" onClick={() => setKonfirmasi(item.id)}>
                    Hapus
                  </Tombol>
                </>
              )}
            </div>
          </div>
        );
      })}

      {mataKuliah.length === 0 && (
        <div>
          <Tombol variasi="netral" onClick={bukaMataKuliah}>
            Buka tab Mata Kuliah
          </Tombol>
        </div>
      )}
    </section>
  );
}
