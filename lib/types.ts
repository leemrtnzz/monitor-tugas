export type MataKuliah = {
  id: string;
  nama: string;
  semester: number | null;
  hari: string | null;
  /** Jumlah SKS — dipakai untuk menghitung jumlah pertemuan (14 atau 21). */
  sks: number | null;
  /** Tanggal pertemuan pertama (YYYY-MM-DD) — pertemuan berikutnya tiap 7 hari. */
  tanggal_mulai: string | null;
};

export type Tugas = {
  id: string;
  id_mata_kuliah: string;
  judul: string;
  deskripsi: string | null;
  tanggal_diterbitkan: string | null;
  tanggal_dikumpulkan: string | null;
  maksimal_dikumpulkan_jam: string | null;
};

export type TugasLengkap = Tugas & {
  mata_kuliah: MataKuliah | null;
};

export type TugasTerhitung = TugasLengkap & {
  info: import("./deadline").InfoTenggat;
};
