<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


saya mau cepat membuat pwa:
- table mata_kuliah (id, nama, semester, hari)[ulid, pemograman web 2, 6, Rabu]
- table tugas (id, id_mata_kuliah judul, deskripsi, tanggal_diterbitkan, tanggal_dikumpulkan, maksimal_dikumpulkan_jam)[ulid, ulid_mk Pembuatan Diagram, "membuat diagram erd, dfd, uml pada aplikasi gojek", rabu,16-09-2026, rabu,23-09-2026, 20.00]
saya ingin menggunakan nextjs dan supabase danberikan detail seperti dari tanggal terbit ke tanggal_dikumpulkan berapa hari, semaki mendekat warna timline menjadi merah danger berikan pengingat teks seram agar cepat dikumpulkan

supabase sudah ada di .env.local
table di supabase sudah di buatkan juga

silahkan kamu kombinasikan dengan ini https://ducanh-next-pwa.vercel.app/docs/next-pwa/getting-started npm i @ducanh2912/next-pwa && npm i -D webpack

kasih tahu saya jika saya harus mengisi iconnya kalau memang diperlukan

tambahan:
untuk setiap crud perlu memasukan pin, pinnya simpen di env, karena tidak ada auth disini