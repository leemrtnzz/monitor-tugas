import { DAFTAR_HARI, normalisasiJam } from "./deadline";
import type { MataKuliah, Tugas } from "./types";

export type HasilValidasi<T> = { ok: true; nilai: T } | { ok: false; pesan: string };

/** Muatan tulis: semua kolom selain id. */
export type MuatanTugas = Partial<Omit<Tugas, "id">>;
export type MuatanMataKuliah = Partial<Omit<MataKuliah, "id">>;

function teks(nilai: unknown): string | null {
  if (typeof nilai === "number") return String(nilai);
  if (typeof nilai !== "string") return null;
  const bersih = nilai.trim();
  return bersih === "" ? null : bersih;
}

/** Terima "2026-09-23" atau ISO lengkap → "2026-09-23" (kolom bertipe date). */
function tanggal(nilai: unknown): string | null {
  const bersih = teks(nilai);
  if (!bersih) return null;
  const cocok = bersih.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return cocok ? `${cocok[1]}-${cocok[2]}-${cocok[3]}` : null;
}

function jam(nilai: unknown): string | null {
  return normalisasiJam(teks(nilai));
}

/** Kosong → null (supaya kolom teks opsional bisa dikosongkan lewat form). */
export function isiTeks(masukan: Record<string, unknown>, kunci: string) {
  return kunci in masukan ? teks(masukan[kunci]) : undefined;
}

export function validasiTugas(
  masukan: Record<string, unknown>,
  opsi: { wajib: boolean },
): HasilValidasi<MuatanTugas> {
  const isi: MuatanTugas = {};

  const judul = teks(masukan.judul);
  if (judul) isi.judul = judul;
  else if (opsi.wajib) return { ok: false, pesan: "Judul tugas wajib diisi." };

  const idMataKuliah = teks(masukan.id_mata_kuliah);
  if (idMataKuliah) isi.id_mata_kuliah = idMataKuliah;
  else if (opsi.wajib) return { ok: false, pesan: "Mata kuliah wajib dipilih." };

  const dikumpulkan = tanggal(masukan.tanggal_dikumpulkan);
  if (dikumpulkan) isi.tanggal_dikumpulkan = dikumpulkan;
  else if (opsi.wajib) return { ok: false, pesan: "Tanggal dikumpulkan wajib diisi." };
  else if ("tanggal_dikumpulkan" in masukan) {
    return { ok: false, pesan: "Tanggal dikumpulkan tidak boleh kosong." };
  }

  const diterbitkan = tanggal(masukan.tanggal_diterbitkan);
  if ("tanggal_diterbitkan" in masukan) isi.tanggal_diterbitkan = diterbitkan;

  if ("deskripsi" in masukan) isi.deskripsi = teks(masukan.deskripsi);

  if ("maksimal_dikumpulkan_jam" in masukan) {
    const nilaiJam = jam(masukan.maksimal_dikumpulkan_jam);
    if (nilaiJam) isi.maksimal_dikumpulkan_jam = nilaiJam;
    else if (teks(masukan.maksimal_dikumpulkan_jam)) {
      return { ok: false, pesan: "Jam pengumpulan tidak valid. Contoh yang benar: 20.00 atau 20:00." };
    } else {
      isi.maksimal_dikumpulkan_jam = null;
    }
  }

  const terbit = isi.tanggal_diterbitkan;
  const kumpul = isi.tanggal_dikumpulkan;
  if (terbit && kumpul && kumpul < terbit) {
    return { ok: false, pesan: "Tanggal dikumpulkan tidak boleh lebih awal dari tanggal diterbitkan." };
  }

  if (Object.keys(isi).length === 0) {
    return { ok: false, pesan: "Tidak ada perubahan yang dikirim." };
  }

  return { ok: true, nilai: isi };
}

export function validasiMataKuliah(
  masukan: Record<string, unknown>,
  opsi: { wajib: boolean },
): HasilValidasi<MuatanMataKuliah> {
  const isi: MuatanMataKuliah = {};

  const nama = teks(masukan.nama);
  if (nama) isi.nama = nama;
  else if (opsi.wajib) return { ok: false, pesan: "Nama mata kuliah wajib diisi." };

  if ("semester" in masukan) {
    const bersih = teks(masukan.semester);
    if (bersih === null) {
      isi.semester = null;
    } else {
      const angka = Number(bersih);
      if (!Number.isInteger(angka) || angka < 1 || angka > 20) {
        return { ok: false, pesan: "Semester harus berupa angka antara 1 sampai 20." };
      }
      isi.semester = angka;
    }
  }

  if ("hari" in masukan) {
    const hari = teks(masukan.hari);
    if (hari && !(DAFTAR_HARI as readonly string[]).includes(hari)) {
      return { ok: false, pesan: `Hari harus salah satu dari: ${DAFTAR_HARI.join(", ")}.` };
    }
    isi.hari = hari;
  }

  if ("sks" in masukan) {
    const bersih = teks(masukan.sks);
    if (bersih === null) {
      isi.sks = null;
    } else {
      const angka = Number(bersih);
      if (!Number.isInteger(angka) || angka < 1 || angka > 8) {
        return { ok: false, pesan: "SKS harus berupa angka antara 1 sampai 8." };
      }
      isi.sks = angka;
    }
  }

  if ("tanggal_mulai" in masukan) {
    const bersih = teks(masukan.tanggal_mulai);
    const nilaiTanggal = tanggal(masukan.tanggal_mulai);
    if (bersih && !nilaiTanggal) {
      return { ok: false, pesan: "Tanggal mulai pertemuan tidak valid. Gunakan format YYYY-MM-DD." };
    }
    isi.tanggal_mulai = nilaiTanggal;
  }

  if (Object.keys(isi).length === 0) {
    return { ok: false, pesan: "Tidak ada perubahan yang dikirim." };
  }

  return { ok: true, nilai: isi };
}
