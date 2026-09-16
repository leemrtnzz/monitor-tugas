/**
 * Generator ikon PWA tanpa dependency tambahan.
 *
 * Jalankan: npm run icons
 * Hasilnya ada di public/icons/:
 *   - icon-192.png, icon-512.png              → ikon biasa (purpose: "any")
 *   - icon-maskable-192.png, -512.png         → ikon maskable (Android adaptive)
 *   - apple-touch-icon.png (180x180)          → ikon iOS
 *
 * Desainnya sederhana: latar gelap + tanda seru oranye-merah (peringatan tenggat).
 * Ganti file-file ini dengan logo kamu sendiri kalau mau, nama filenya jangan diubah.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..");
const FOLDER = join(AKAR, "public", "icons");

const TABEL_CRC = (() => {
  const tabel = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabel[n] = c;
  }
  return tabel;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i++) c = TABEL_CRC[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunkPng(type, data) {
  const panjang = Buffer.alloc(4);
  panjang.writeUInt32BE(data.length, 0);
  const tipe = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tipe, data])), 0);
  return Buffer.concat([panjang, tipe, data, crc]);
}

function encodePng(lebar, tinggi, rgba) {
  const langkah = lebar * 4;
  const mentah = Buffer.alloc((langkah + 1) * tinggi);
  for (let y = 0; y < tinggi; y++) {
    mentah[y * (langkah + 1)] = 0; // filter: none
    rgba.copy(mentah, y * (langkah + 1) + 1, y * langkah, (y + 1) * langkah);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lebar, 0);
  ihdr.writeUInt32BE(tinggi, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolor + alpha
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunkPng("IHDR", ihdr),
    chunkPng("IDAT", deflateSync(mentah, { level: 9 })),
    chunkPng("IEND", Buffer.alloc(0)),
  ]);
}

function dalamRoundedRect(x, y, kiri, atas, lebar, tinggi, radius) {
  if (x < kiri || y < atas || x > kiri + lebar || y > atas + tinggi) return false;
  const rx = Math.min(radius, lebar / 2);
  const ry = Math.min(radius, tinggi / 2);
  const dx = Math.max(kiri + rx - x, 0, x - (kiri + lebar - rx));
  const dy = Math.max(atas + ry - y, 0, y - (atas + tinggi - ry));
  if (dx === 0 || dy === 0) return true;
  return dx * dx + dy * dy <= rx * ry;
}

function campur(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Warna latar: gradasi gelap + sorot biru di kiri atas + aura merah di kanan bawah. */
function warnaLatar(nx, ny) {
  const atas = [15, 23, 42]; // #0f172a
  const bawah = [2, 6, 23]; // #020617
  let warna = campur(atas, bawah, ny);

  const sorot = Math.max(0, 1 - Math.hypot(nx - 0.22, ny - 0.12) * 2.1) ** 2 * 0.34;
  warna = campur(warna, [56, 189, 248], sorot);

  const bahaya = Math.max(0, 1 - Math.hypot(nx - 0.98, ny - 1.06) * 2.3) ** 2 * 0.6;
  return campur(warna, [239, 68, 68], bahaya);
}

function warnatanda(ny) {
  return campur([251, 191, 36], [239, 68, 68], Math.min(Math.max(ny * 1.15, 0), 1));
}

function sampel(x, y, ukuran, maskable, radiusLuar) {
  const nx = x / ukuran;
  const ny = y / ukuran;

  const latarTerlihat = maskable || dalamRoundedRect(x, y, 0, 0, ukuran, ukuran, radiusLuar);
  if (!latarTerlihat) return [0, 0, 0, 0];

  // Konten ditaruh di area tengah (aman untuk ikon maskable Android).
  const skala = maskable ? 0.78 : 1;
  const cx = (x - ukuran / 2) / skala + ukuran / 2;
  const cy = (y - ukuran / 2) / skala + ukuran / 2;

  const lebarBatang = 0.108 * ukuran;
  const batang = dalamRoundedRect(
    cx,
    cy,
    ukuran / 2 - lebarBatang / 2,
    0.26 * ukuran,
    lebarBatang,
    0.34 * ukuran,
    lebarBatang / 2,
  );
  const titik = Math.hypot(cx - ukuran / 2, cy - 0.71 * ukuran) <= 0.072 * ukuran;

  if (batang || titik) {
    const [r, g, b] = warnatanda(cy / ukuran);
    return [r, g, b, 255];
  }

  const [r, g, b] = warnaLatar(nx, ny);
  return [r, g, b, 255];
}

function buatIkon(ukuran, opsi) {
  const SS = 3; // supersampling untuk tepi yang halus
  const radiusLuar = opsi.maskable ? 0 : 0.22 * ukuran;
  const piksel = Buffer.alloc(ukuran * ukuran * 4);

  for (let y = 0; y < ukuran; y++) {
    for (let x = 0; x < ukuran; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sampel(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS, ukuran, opsi.maskable, radiusLuar);
          const alfa = c[3] / 255;
          r += c[0] * alfa;
          g += c[1] * alfa;
          b += c[2] * alfa;
          a += alfa;
        }
      }

      const total = SS * SS;
      const indek = (y * ukuran + x) * 4;
      piksel[indek] = a > 0 ? Math.round(r / a) : 0;
      piksel[indek + 1] = a > 0 ? Math.round(g / a) : 0;
      piksel[indek + 2] = a > 0 ? Math.round(b / a) : 0;
      piksel[indek + 3] = Math.round((a / total) * 255);
    }
  }

  return encodePng(ukuran, ukuran, piksel);
}

const daftar = [
  { nama: "icon-192.png", ukuran: 192, maskable: false },
  { nama: "icon-512.png", ukuran: 512, maskable: false },
  { nama: "icon-maskable-192.png", ukuran: 192, maskable: true },
  { nama: "icon-maskable-512.png", ukuran: 512, maskable: true },
  { nama: "apple-touch-icon.png", ukuran: 180, maskable: true },
];

mkdirSync(FOLDER, { recursive: true });

for (const ikon of daftar) {
  const buffer = buatIkon(ikon.ukuran, { maskable: ikon.maskable });
  writeFileSync(join(FOLDER, ikon.nama), buffer);
  console.log(`✓ public/icons/${ikon.nama} (${ikon.ukuran}×${ikon.ukuran})`);
}

console.log(`\nSelesai. ${daftar.length} ikon dibuat di public/icons/.`);
