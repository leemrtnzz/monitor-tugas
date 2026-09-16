# Monitor Tugas Kuliah (PWA)

PWA untuk memantau tenggat tugas kuliah. Setiap tugas menampilkan:

- durasi dari `tanggal_diterbitkan` sampai `tanggal_dikumpulkan` (berapa hari),
- sisa waktu hidup (berdetak tiap detik) dan sisa hari kalender,
- **timeline** dari terbit → tenggat yang warnanya makin **merah** saat tenggat makin dekat,
- **pengingat teks seram** berjenjang: aman → waspada → mendesak → kritis (≤ 24 jam) → terlewat.

Ada juga panel **CRUD** di `/kelola` untuk menambah/mengubah/menghapus mata kuliah dan tugas —
setiap operasi wajib memasukkan PIN dari env `APP_PIN` (tanpa auth, lihat bagian CRUD + PIN).

Halaman **`/pertemuan`** menampilkan jadwal pertemuan tiap mata kuliah secara **realtime**:
status (sudah lewat / hari ini / akan datang), progres perkuliahan, dan hitungan mundurnya
mengikuti waktu sekarang. Navigasi utama ada di bar atas (Monitor · Pertemuan · Kelola).

Dibangun dengan Next.js 16 (App Router) + Tailwind CSS v4 + Supabase, dan bisa dipasang
sebagai aplikasi (installable PWA) memakai `@ducanh2912/next-pwa`.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000 (Turbopack)
npm run build    # next build --webpack → sekaligus membuat public/sw.js + workbox-*.js
npm start        # menjalankan hasil build (PWA aktif di sini)
```

> Service worker hanya dibuat saat **build produksi** (`NODE_ENV=production`). Untuk menguji
> fitur installable/offline: `npm run build && npm start`, lalu buka `http://localhost:3000`.

## Konfigurasi Supabase

Isi `.env.local` (sudah ada, jangan di-commit):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# PIN untuk semua operasi CRUD (tanpa prefix NEXT_PUBLIC_ agar tidak terkirim ke browser)
APP_PIN=123456

# Opsional tapi disarankan: dipakai server untuk CRUD sehingga tidak terganjal RLS
SUPABASE_SERVICE_ROLE_KEY=
```

Tabel yang dipakai (nama kolom harus persis seperti ini):

| tabel         | kolom                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `mata_kuliah` | `id`, `nama`, `semester`, `hari`                                                                                |
| `tugas`       | `id`, `id_mata_kuliah`, `judul`, `deskripsi`, `tanggal_diterbitkan`, `tanggal_dikumpulkan`, `maksimal_dikumpulkan_jam` |

Kolom `sks` dan `tanggal_mulai` dipakai halaman **Pertemuan**. Kalau belum ada, tambahkan
(aman dijalankan berulang):

```sql
alter table mata_kuliah
  add column if not exists sks smallint,
  add column if not exists tanggal_mulai date;
```

Selama kolomnya belum ada, aplikasi tetap jalan: halaman Pertemuan menampilkan banner berisi SQL
ini, dan form di `/kelola` menyembunyikan kolom tersebut.

`tanggal_*` dibaca sebagai `date` (`2026-09-23`), dan `maksimal_dikumpulkan_jam` menerima
`20.00`, `20:00`, atau `20:00:00`. Kalau jam kosong, tenggat dianggap pukul 23.59.

Klien monitor memakai **anon key**, jadi Row Level Security wajib mengizinkan pembacaan:

```sql
alter table mata_kuliah enable row level security;
alter table tugas enable row level security;

create policy "baca mata_kuliah" on mata_kuliah for select using (true);
create policy "baca tugas" on tugas for select using (true);
```

Kalau `SUPABASE_SERVICE_ROLE_KEY` **tidak** diisi, semua operasi CRUD juga lewat anon key,
sehingga butuh policy tulis:

```sql
create policy "tulis mata_kuliah" on mata_kuliah for all using (true) with check (true);
create policy "tulis tugas" on tugas for all using (true) with check (true);
```

Contoh isi data:

```sql
insert into mata_kuliah (id, nama, semester, hari)
values ('01J0000000000000000000001', 'Pemrograman Web 2', 6, 'Rabu');

insert into tugas (id, id_mata_kuliah, judul, deskripsi, tanggal_diterbitkan, tanggal_dikumpulkan, maksimal_dikumpulkan_jam)
values (
  '01J0000000000000000000002',
  '01J0000000000000000000001',
  'Pembuatan Diagram',
  'Membuat diagram ERD, DFD, dan UML pada aplikasi Gojek',
  '2026-09-16',
  '2026-09-23',
  '20.00'
);
```

## CRUD + PIN (tanpa auth)

Buka `/kelola` (atau tombol **⚙ Kelola** di halaman monitor). Semua operasi CRUD wajib
memasukkan PIN:

1. PIN diketik di panel 🔒 lalu **diverifikasi di server** (`POST /api/pin`) terhadap env `APP_PIN`.
2. Setelah benar, PIN disimpan di `sessionStorage` dan dikirim sebagai header `x-app-pin` pada
   **setiap** permintaan CRUD. Tombol **🔒 Kunci** menghapusnya.
3. PIN tidak pernah dibundel ke klien (tanpa prefix `NEXT_PUBLIC_`), dan perbandingannya memakai
   `timingSafeEqual`.

Endpoint (semuanya butuh header `x-app-pin`):

| metode   | endpoint               | fungsi                              |
| -------- | ---------------------- | ----------------------------------- |
| `POST`   | `/api/pin`             | verifikasi PIN tanpa mengubah data  |
| `GET`    | `/api/tugas`           | daftar tugas                        |
| `POST`   | `/api/tugas`           | tambah tugas (id ULID dibuat server)|
| `PATCH`  | `/api/tugas/[id]`      | ubah tugas                          |
| `DELETE` | `/api/tugas/[id]`      | hapus tugas                         |
| `GET`    | `/api/mata-kuliah`     | daftar mata kuliah                  |
| `POST`   | `/api/mata-kuliah`     | tambah mata kuliah                  |
| `PATCH`  | `/api/mata-kuliah/[id]`| ubah mata kuliah                    |
| `DELETE` | `/api/mata-kuliah/[id]`| hapus mata kuliah                   |

Validasi dilakukan di server (`lib/validasi.ts`): judul/mata kuliah/tanggal dikumpulkan wajib,
tanggal dikumpulkan tidak boleh sebelum tanggal diterbitkan, jam menerima `20.00` / `20:00`
dan disimpan sebagai `20:00:00`, semester harus 1–20, hari harus Senin–Minggu.

> Butuh ganti PIN? Ubah `APP_PIN` di `.env.local` lalu restart server. Halaman monitor (`/`)
tetap bisa dibaca tanpa PIN; hanya CRUD yang diproteksi.

**Catatan keamanan:** PIN menjaga panel `/kelola` dan endpoint `/api/*`, tetapi kalau policy RLS
`insert/update/delete` dibuka untuk role `anon`, siapa pun yang tahu anon key masih bisa menulis
langsung ke Supabase (melewati PIN). Untuk proteksi penuh: jangan buka policy tulis untuk `anon`,
biarkan hanya `select`, lalu isi `SUPABASE_SERVICE_ROLE_KEY` supaya CRUD di server berjalan
melewati RLS.

## Halaman Pertemuan (realtime)

`/pertemuan` menampilkan jadwal tiap mata kuliah dari dua data: `sks` + `tanggal_mulai`.

- Satu slot **7 hari** sejak tanggal mulai; minggu ke-8 = **UTS**, minggu ke-16 = **UAS**.
- Jumlah pertemuan: **2 SKS → 14**, **3 SKS → 21** (aturannya bisa diubah di `lib/pertemuan.ts`).
- **3 SKS**: pertemuan kelipatan 3 (3, 6, 9, 12, 15, 18, 21) adalah sesi **tambahan**
  "Mentari (Online)" yang jatuh pada **tanggal yang sama** dengan pertemuan sebelumnya.
- **2 SKS**: pertemuan 2 adalah sesi "Mentari (Online)" yang menempati slot mingguan biasa.
- **Centang otomatis, tanpa input manual**: tanda ✅ muncul sendiri begitu tanggal pertemuan
  tiba/lewat (kuning berdenyut untuk yang berlangsung **hari ini**).
- Status dihitung ulang **setiap detik**: `Terlaksana` · `Hari ini` (disorot merah) · `Akan datang`.
- Tiap kartu menampilkan jam realtime, progres (mis. `✅ 4/23 terlaksana`), dan "Berikutnya"
  beserta label hari (Hari ini / Besok / n hari lagi).
- Kartu diurutkan otomatis: kelas yang pertemuannya paling dekat naik ke atas.
- Panel **Kelas hari ini** di bagian atas mendaftar **semua** mata kuliah yang punya pertemuan
  hari ini (nomor pertemuan, minggu ke-n, tipe, SKS) dan tiap barisnya bisa diklik untuk melompat
  ke kartu mata kuliah tersebut.

Contoh hasil (sudah diuji langsung terhadap pola kampus):

| 3 SKS — mulai 31 Agu                                | 2 SKS — mulai 1 Sep                          |
| --------------------------------------------------- | -------------------------------------------- |
| p1 31 Agu · p2 7 Sep · p3 7 Sep ← Mentari tambahan  | p1 1 Sep · p2 8 Sep ← Mentari (online)       |
| p4 14 Sep · p5 21 Sep · p6 21 Sep ← Mentari         | p3 15 Sep · p4 22 Sep · … · p7 13 Okt        |
| p10 12 Okt · **UTS 19 Okt** · p11 26 Okt · … · p20 7 Des | **UTS 20 Okt** · p8 27 Okt · … · p14 8 Des |
| p21 7 Des ← Mentari tambahan · **UAS 14 Des**       | **UAS 15 Des**                               |

> Label hitungan mundur sengaja per **hari kalender**, bukan per jam, karena data saat ini
> belum menyimpan jam kuliah. Kalau nanti ditambah kolom `jam_mulai` / `jam_selesai`, hitungannya
> bisa ditingkatkan jadi "sedang berlangsung" dengan progres per menit.

## Ikon PWA

Ikon sudah dibuat otomatis (boleh diganti dengan logo sendiri, nama file jangan diubah):

```
public/icons/icon-192.png              purpose: any
public/icons/icon-512.png              purpose: any
public/icons/icon-maskable-192.png     purpose: maskable (Android adaptive)
public/icons/icon-maskable-512.png     purpose: maskable
public/icons/apple-touch-icon.png      180x180 untuk iOS
app/icon.svg                           favicon tab browser
```

Buat ulang ikon bawaan: `npm run icons`. Ukuran minimal agar bisa di-install Chrome:
192x192 dan 512x512 (sudah tersedia).

## Struktur

```
app/layout.tsx            metadata PWA (manifest, appleWebApp, viewport, ikon)
app/manifest.ts           manifest /manifest.webmanifest
app/page.tsx              beranda → components/Dashboard
app/kelola/page.tsx       panel CRUD → components/kelola/Kelola
app/pertemuan/page.tsx    jadwal pertemuan realtime → components/DaftarPertemuan
app/~offline/page.tsx     halaman fallback saat offline
app/api/pin/route.ts      verifikasi PIN
app/api/tugas/route.ts    GET + POST tugas
app/api/tugas/[id]/       PATCH + DELETE tugas
app/api/mata-kuliah/      GET + POST mata kuliah, PATCH + DELETE per id
components/Dashboard.tsx  daftar tugas, filter, statistik, pencarian, jam hidup
components/KartuTugas.tsx kartu tugas + timeline + pengingat seruan
components/PasangPwa.tsx  tombol "Pasang aplikasi" (beforeinstallprompt)
components/kelola/        panel CRUD (KunciPin, KelolaTugas, KelolaMataKuliah, Ui)
lib/deadline.ts           hitung sisa hari, progress timeline, tingkat bahaya, tema warna
lib/pesan.ts              kumpulan teks pengingat berjenjang
lib/format.ts             format tanggal/jam/durasi bahasa Indonesia
lib/validasi.ts           validasi input CRUD
lib/api-server.ts         gerbang PIN + helper respons API
lib/api-client.ts         fetch CRUD (PIN otomatis di header)
lib/pin.ts, pin-client.ts verifikasi PIN di server & penyimpanan PIN di sesi browser
lib/supabase.ts           klien Supabase anon (baca di browser)
lib/supabase-server.ts    klien Supabase server (service role kalau ada)
lib/ulid.ts               generator ULID untuk kolom id
next.config.ts            withPWA (aktif saat build produksi)
scripts/generate-icons.mjs generator ikon PNG tanpa dependency
```

## Troubleshooting

**“A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.”**

Ini muncul kalau service worker hasil build produksi masih terdaftar di origin yang sama,
lalu kamu pindah ke `npm run dev`. SW itu menyajikan HTML hasil build (basi) ke dev server,
jadi React membandingkan HTML lama dengan bundle dev yang baru.

- Di mode dev, komponen `components/BersihkanSwDev.tsx` otomatis membuang SW + cache sisa uji
  produksi lalu memuat ulang sekali, jadi kasus ini sembuh sendiri.
- Kalau masih muncul: DevTools → **Application** → **Service Workers** → *Unregister*, lalu
  **Storage** → *Clear site data*.
- Tips: uji hasil build di port terpisah supaya tidak bertabrakan dengan dev server, mis.
  `npm start -- -p 3100`.

## Catatan teknis

- `next.config.ts` membungkus konfigurasi PWA hanya pada fase **production build**, supaya
  `next dev` tetap memakai Turbopack tanpa konfigurasi webpack.
- Karena itu build produksi memakai `next build --webpack` (`@ducanh2912/next-pwa` masih
  bergantung pada `workbox-webpack-plugin`).
- Waktu "sekarang" dibaca lewat `useSyncExternalStore` (snapshot server = 0), sehingga tidak
  ada hydration mismatch walau teks sisa waktu berubah tiap detik.

