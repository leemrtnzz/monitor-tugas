export type MataKuliah = {
  id: string;
  nama: string;
  semester: number | null;
  hari: string | null;
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
