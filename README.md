# Procurement Hub

Aplikasi web untuk menghilangkan rekap manual Purchase Order di Google Sheet.
Upload PO yang sudah Anda buat → data terbaca otomatis → tersimpan ke database →
dashboard, report, dan export jadi otomatis.

**Status:** fondasi awal (struktur project, schema database, UI dasar dengan data
contoh). Belum terhubung ke Supabase sungguhan — lihat "Setup Supabase" di bawah.

---

## 1. Struktur Project

```
procurement-app/
├── app/
│   ├── login/                    # Halaman login
│   ├── (dashboard)/              # Semua halaman setelah login (sidebar + topbar)
│   │   ├── dashboard/
│   │   ├── purchase-orders/
│   │   │   └── upload/           # Upload & parsing PO
│   │   ├── suppliers/
│   │   ├── items/                # Master Barang
│   │   ├── price-history/
│   │   ├── reports/
│   │   ├── export/
│   │   └── settings/
│   └── api/parse-po/             # API route: parsing file HTML PO di server
├── components/
│   ├── ui/                       # Card, Button, Badge, StatCard
│   ├── layout/                   # Sidebar, Topbar
│   └── charts/                   # Grafik (recharts)
├── lib/
│   ├── supabase/                 # Client & server Supabase instance
│   ├── parser/po-html-parser.ts  # Parser HTML PO (lihat catatan di bawah)
│   ├── mock-data.ts              # Data contoh (dipakai sebelum Supabase aktif)
│   └── types.ts                  # Tipe data yang mencerminkan schema database
└── supabase/
    ├── schema.sql                # Seluruh struktur database + RLS + trigger
    └── seed.sql                  # Data contoh opsional
```

## 2. Menjalankan secara lokal

```bash
npm install
cp .env.local.example .env.local   # lalu isi dengan kredensial Supabase Anda
npm run dev
```

Buka http://localhost:3000 — tanpa mengisi `.env.local`, seluruh halaman tetap
bisa dibuka dan dijelajahi karena UI memakai `lib/mock-data.ts`. Login hanya akan
berfungsi sungguhan setelah Supabase terhubung.

## 3. Setup Supabase (database sungguhan)

1. Buat project baru di https://supabase.com
2. Buka **SQL Editor** → paste seluruh isi `supabase/schema.sql` → **Run**
   - Ini membuat semua tabel (suppliers, items, purchase_orders,
     purchase_order_items, price_history, notifications, audit_log, profiles),
     trigger otomatis (update harga barang & histori harga setiap ada PO baru),
     serta Row Level Security.
3. (Opsional) jalankan `supabase/seed.sql` untuk mengisi beberapa data contoh
4. Buka **Project Settings → API**, salin:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (jaga kerahasiaannya)
5. Buat user pertama di **Authentication → Users → Add user** untuk bisa login
6. Deploy ke Vercel, tambahkan ketiga env var yang sama di **Project Settings → Environment Variables**

## 4. Tentang Parser PO (HTML & PDF)

Berdasarkan contoh HTML generator dan **PDF PO asli** (`MC-PO-CRK_VII_26-0006`)
yang Anda kirim, parser sudah disesuaikan **presisi** ke struktur PO Generator
Anda -- sudah diuji dan 100% akurat terhadap contoh tersebut:

- `lib/parser/po-html-parser.ts` -- membaca struktur `#po-preview` (hasil
  render JS: `.pv-header`, `.pv-infobox`, `.pv-cols` VENDOR/SHIP TO,
  `.pv-item-table`, `.pv-summary`, dst). **Catatan:** file HTML yang diupload
  harus hasil "Save As Complete Webpage" SETELAH form diisi & preview
  tampil -- generator kosong tidak punya `#po-preview`.
- `lib/parser/po-pdf-parser.ts` -- membaca PDF hasil tombol "Download PDF
  (Print)" langsung dari posisi teks asli (pakai `pdfjs-dist`, murni JS,
  jalan di Vercel tanpa perlu binary `poppler-utils`). Ini kemungkinan besar
  format yang paling sering Anda upload sehari-hari.

Field yang berhasil dibaca dari kedua format: No. PO, Tanggal PO, Delivery
Deadline, Payment Terms, Buyer (nama & alamat), Supplier (nama & alamat),
Ship To (nama & alamat), daftar item (deskripsi, qty, satuan, harga, total),
mata uang, Subtotal, Diskon, Diskon Cash, PPN, Grand Total, Terbilang, dan
Syarat & Ketentuan.

**PENTING -- field yang TIDAK ada di template PO ini:** Requester, Project,
dan Kategori barang. Sesuai konfirmasi Anda, ketiga field ini **diisi manual
setelah data tersimpan** (field-nya tetap ada di database & UI untuk
kebutuhan filter/report).

Jika suatu saat template PO Anda berubah strukturnya, kedua file parser ini
perlu disesuaikan ulang -- kirim contoh baru dan saya akan update selector-nya.

## 5. Yang sudah dibangun (fondasi)

- ✅ Struktur project Next.js + TypeScript + Tailwind
- ✅ Schema database lengkap (Supabase/PostgreSQL) dengan relasi, trigger
  histori harga otomatis, dan Row Level Security
- ✅ Desain UI (putih dominan, aksen biru, dark mode, card modern)
- ✅ Halaman: Login, Dashboard, Purchase Order (list + upload + parsing HTML & PDF presisi),
  Supplier, Master Barang, Histori Harga, Report, Export, Setting
- ✅ Grafik interaktif (pengeluaran bulanan, top supplier, kategori, tren harga)
- ✅ Parser HTML & PDF PO -- sudah diuji 100% akurat terhadap contoh PO asli Anda

## 6. Belum dibangun / langkah selanjutnya

- ⬜ Sambungkan setiap halaman ke Supabase sungguhan (saat ini masih pakai
  `lib/mock-data.ts`) — ganti dengan query di `lib/supabase/queries.ts` (belum dibuat)
- ⬜ Simpan hasil parsing ke database + file mentah (HTML/PDF) ke Supabase Storage
- ⬜ Dukungan Excel (opsional, sesuai brief awal)
- ⬜ Export sungguhan ke Excel/PDF/CSV (library `exceljs` & `jspdf` sudah
  disiapkan di `package.json`, tinggal diimplementasi di halaman Export)
- ⬜ Global Search sungguhan (lintas PO/supplier/barang)
- ⬜ Notifikasi & reminder otomatis (PO belum diupload, payment due, dst.)
- ⬜ AI Assistant yang menjawab pertanyaan dari data database
- ⬜ Detail halaman per Purchase Order (`/purchase-orders/[id]`)
- ⬜ Form tambah/edit Supplier & Master Barang (saat ini baru tampilan)

## 7. Teknologi

Next.js 14 (App Router) · React 18 · TypeScript · TailwindCSS · Supabase
(PostgreSQL, Auth, Storage) · Recharts · Vercel (hosting)
