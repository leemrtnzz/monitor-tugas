import type { Tingkat } from "./deadline";

export type Pesan = {
  seruan: string;
  saran: string;
};

/**
 * Pengingat "seram" berjenjang. Semakin dekat tenggat, semakin menakutkan —
 * tujuannya supaya kamu buru-buru mengerjakan, bukan sekadar membaca.
 */
export const PESAN: Record<Tingkat, Pesan[]> = {
  terlewat: [
    {
      seruan: "TENGGAT SUDAH LEWAT. Ini bukan mimpi buruk — ini nilaimu yang menguap.",
      saran: "Kirim apa pun yang sudah ada sekarang juga dan minta dispensasi. Diam terlalu lama lebih berbahaya daripada tugas yang belum sempurna.",
    },
    {
      seruan: "WAKTU HABIS. Tidak ada tombol undo untuk tenggat yang sudah lewat.",
      saran: "Kabari dosen hari ini, siapkan alasan yang jujur, dan kejar pengumpulan susulan.",
    },
    {
      seruan: "Kamu kalah lomba lari melawan kalender. Tenggat ini sudah menutup pintunya.",
      saran: "Jangan menyerah di sini — urus sekarang sebelum nilainya dikunci.",
    },
  ],
  kritis: [
    {
      seruan: "KURANG DARI 24 JAM. Kalau kamu masih rebahan, tugas ini bakal jadi mayat di daftar nilai.",
      saran: "Tutup semua tab, matikan notifikasi, kerjakan sekarang. Tidak ada waktu lain selain sekarang.",
    },
    {
      seruan: "Ini hitungan JAM, bukan hitungan hari. Alarm terakhir sudah berbunyi keras.",
      saran: "Kerjakan versi paling sederhana dulu supaya bisa dikumpulkan, baru dipercantik kalau masih sempat.",
    },
    {
      seruan: "Tenggat ini sudah berdiri tepat di belakangmu dan siap menerkam.",
      saran: "Satu jam fokus sekarang jauh lebih murah daripada lima jam penyesalan besok.",
    },
  ],
  mendesak: [
    {
      seruan: "Tiga hari terasa lama, tapi penundaan sudah mulai menagih harga.",
      saran: "Pecah jadi tiga bagian kecil dan selesaikan bagian pertama malam ini.",
    },
    {
      seruan: "Bahaya. Waktu pengerjaan cuma tersisa potongan kecil dan kamu masih di titik yang sama.",
      saran: "Blokir 90 menit di kalendermu hari ini untuk tugas ini. Bukan besok.",
    },
  ],
  waspada: [
    {
      seruan: "Waktu terus berjalan tanpa minta izin, dan separuh masanya sudah kamu lewati.",
      saran: "Sisihkan satu jam hari ini, atau minggu depan rasa panikmu akan dua kali lebih berat.",
    },
    {
      seruan: "Belum gawat, tapi juga belum aman. Jangan tunggu sampai jadi gawat.",
      saran: "Mulai dari bagian yang paling tidak kamu sukai — biasanya itu yang paling cepat menyusut.",
    },
  ],
  aman: [
    {
      seruan: "Masih longgar, tapi jangan terlena oleh rasa longgar ini.",
      saran: "Mulai sedikit sekarang; besok kamu akan berterima kasih pada dirimu sendiri.",
    },
    {
      seruan: "Waktu masih berpihak padamu. Manfaatkan sebelum arahnya berbalik.",
      saran: "Buat kerangka atau outline hari ini supaya sisanya cuma tinggal mengisi.",
    },
  ],
};

function seedAngka(teks: string) {
  let nilai = 0;
  for (let i = 0; i < teks.length; i++) {
    nilai = (nilai * 31 + teks.charCodeAt(i)) % 100000;
  }
  return nilai;
}

/** Pilih pesan secara stabil (tidak berubah-ubah saat re-render) berdasarkan id tugas. */
export function pesanSeram(tingkat: Tingkat, seed: string): Pesan {
  const daftar = PESAN[tingkat];
  return daftar[seedAngka(seed) % daftar.length];
}
