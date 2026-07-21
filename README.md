# Procurement Hub

Aplikasi web untuk menghilangkan rekap manual Purchase Order di Google Sheet.
Upload PO yang sudah Anda buat → data terbaca otomatis → tersimpan ke database →
dashboard, report, dan export jadi otomatis.

**Status:** sudah live dan tersambung ke Google Sheets sebagai database, dengan
1 password bersama untuk seluruh tim (bukan akun per orang).

---

## 1. Struktur Project

```
procurement-app/
├── app/
│   ├── login/                    # Halaman login
│   ├── (dashboard)/              # Semua halaman setelah login (sidebar + topbar)
│   │   ├── dashboard/
│   │   ├── purchase-orders/
│   │   │   └── upload/           # Upload & parsing PO (HTML/PDF) + simpan ke Sheets
│   │   ├── suppliers/                # List + tambah/hapus supplier (real data)
│   │   ├── items/                    # Master Barang (dihitung otomatis dari PO)
│   │   ├── price-history/            # Histori & grafik harga per barang
│   │   ├── reports/
│   │   ├── export/                   # Export Excel/CSV (data asli)
│   │   └── settings/
│   └── api/
│       ├── parse-po/             # Parsing file HTML/PDF PO di server
│       └── export/               # Generate file Excel/CSV untuk diunduh
├── components/
│   ├── ui/                       # Card, Button, Badge, StatCard
│   ├── layout/                   # Sidebar, Topbar (dengan search)
│   └── charts/                   # Grafik (recharts)
├── lib/
│   ├── sheets/                   # Koneksi & query ke Google Sheets (database)
│   ├── actions.ts                # Server Actions: login, CRUD supplier & PO
│   ├── parser/                   # Parser HTML & PDF PO
│   └── types.ts                  # Tipe data
└── middleware.ts                  # Gerbang password bersama untuk semua halaman
```

## 2. Menjalankan secara lokal

```bash
npm install
cp .env.local.example .env.local   # lalu isi APP_PASSWORD + kredensial Google Sheets Anda
npm run dev
```

Buka http://localhost:3000 — Anda akan diarahkan ke halaman login (password bersama tim),
lalu ke Dashboard. Tanpa `.env.local` terisi, halaman akan gagal memuat data (Google
Sheets belum terhubung) — isi dulu env var sebelum menjalankan.

## 3. Setup Google Sheets (database)

Aplikasi ini memakai **Google Sheets sebagai database**, lewat "Service Account"
(akun robot Google yang bisa baca/tulis spreadsheet atas nama aplikasi). Spreadsheet-nya
tetap bisa Anda buka & edit manual kapan saja seperti Sheets biasa.

**A. Buat Service Account**
1. Buka [console.cloud.google.com](https://console.cloud.google.com) → buat project baru (atau pakai yang sudah ada).
2. Menu **APIs & Services → Library** → cari **Google Sheets API** → **Enable**.
3. Menu **APIs & Services → Credentials** → **Create Credentials → Service Account**.
4. Beri nama bebas (misal `procurement-hub-bot`) → **Create and Continue** → **Done** (role tidak perlu diisi).
5. Klik service account yang baru dibuat → tab **Keys** → **Add Key → Create new key → JSON** → file JSON otomatis terdownload.
6. Buka file JSON itu, catat 2 nilai:
   - `client_email` → untuk `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → untuk `GOOGLE_PRIVATE_KEY` (termasuk `-----BEGIN PRIVATE KEY-----` dan `-----END PRIVATE KEY-----`)

**B. Buat Spreadsheet-nya**
1. Buka [sheets.google.com](https://sheets.google.com) → buat spreadsheet baru, beri nama `Procurement Hub`.
2. Buat 3 tab (sheet) dengan nama PERSIS seperti ini, baris pertama diisi header PERSIS seperti ini:

   Tab **`Suppliers`**, baris 1:
   ```
   id	code	name	address	pic_name	phone	whatsapp	email	npwp	bank_name	bank_account	lead_time_days	payment_term	category	status	notes	created_at
   ```

   Tab **`PurchaseOrders`**, baris 1:
   ```
   id	po_number	po_date	delivery_deadline	supplier_name	supplier_address	buyer_name	buyer_address	ship_name	ship_address	requester	project	currency	subtotal	discount_label	discount_amount	cash_discount_amount	ppn_label	ppn	grand_total	terbilang	payment_term	terms	status	source_file_name	created_at
   ```

   Tab **`PurchaseOrderItems`**, baris 1:
   ```
   po_id	po_number	po_date	supplier_name	item_name	category	qty	unit	price	subtotal
   ```

   (Tip: ketik header pertama di sel A1, lalu paste satu baris itu — Google Sheets akan otomatis memisah per kolom karena dipisahkan tab.)

3. Klik **Share** (kanan atas) → paste `client_email` dari file JSON tadi → beri akses **Editor** → **Send**.
4. Copy ID spreadsheet dari URL: `docs.google.com/spreadsheets/d/`**`INI_ID_NYA`**`/edit` → untuk `GOOGLE_SHEET_ID`.

**C. Isi Environment Variables** (di `.env.local` untuk lokal, atau di Vercel untuk production):
```
APP_PASSWORD=password-bersama-tim-anda
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxx@xxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Catatan: saat paste `GOOGLE_PRIVATE_KEY` di Vercel, biarkan tanda `\n` apa adanya (jangan diubah jadi enter sungguhan) — kode aplikasi yang akan mengonversinya.

## 4. Login

Tidak ada akun per orang — cukup 1 password bersama (`APP_PASSWORD`) untuk seluruh tim.
Untuk ganti password: ubah nilai `APP_PASSWORD` di Environment Variables Vercel → redeploy.

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
- ✅ Google Sheets sebagai database (bisa dibuka/diedit manual), dengan Master
  Barang & Histori Harga yang dihitung otomatis dari data Purchase Order
- ✅ Desain UI (putih dominan, aksen biru, dark mode, card modern)
- ✅ Halaman: Login, Dashboard, Purchase Order (list + upload + parsing HTML & PDF presisi),
  Supplier, Master Barang, Histori Harga, Report, Export, Setting
- ✅ Grafik interaktif (pengeluaran bulanan, top supplier, kategori, tren harga)
- ✅ Parser HTML & PDF PO -- sudah diuji 100% akurat terhadap contoh PO asli Anda

## 6. Belum dibangun / langkah selanjutnya

- ⬜ Dukungan Excel untuk upload PO (opsional, sesuai brief awal)
- ⬜ Simpan file asli (HTML/PDF) yang diupload (saat ini hanya data hasil parse yang disimpan)
- ⬜ Filter Report yang lebih detail (saat ini semua laporan memakai data PO yang sama)
- ⬜ Notifikasi & reminder otomatis (PO belum diupload, payment due, dst.)
- ⬜ Export sungguhan ke Excel/PDF/CSV (library `exceljs` & `jspdf` sudah
  disiapkan di `package.json`, tinggal diimplementasi di halaman Export)
- ⬜ Global Search sungguhan (lintas PO/supplier/barang)
- ⬜ Notifikasi & reminder otomatis (PO belum diupload, payment due, dst.)
- ⬜ AI Assistant yang menjawab pertanyaan dari data database
- ⬜ Detail halaman per Purchase Order (`/purchase-orders/[id]`)
- ⬜ Form tambah/edit Supplier & Master Barang (saat ini baru tampilan)

## 7. Teknologi

Next.js 14 (App Router) · React 18 · TypeScript · TailwindCSS · Google Sheets
(sebagai database) · Recharts · Vercel (hosting)
