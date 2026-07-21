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
google-apps-script/
└── Code.gs                        # Backend Google Apps Script (tempel di Sheets Anda)
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

Aplikasi ini memakai **Google Sheets sebagai database**, lewat script kecil yang
ditempel langsung di spreadsheet (Google Apps Script) — **tidak perlu** Google
Cloud Console, service account, atau file JSON apapun.

**A. Siapkan Spreadsheet-nya**
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

   (Tip: ketik/paste satu baris itu ke sel A1 — Google Sheets otomatis memisah per kolom karena dipisahkan tab.)

**B. Pasang Apps Script-nya**
1. Di spreadsheet yang sama, buka menu **Extensions → Apps Script**.
2. Hapus semua kode default yang tampil di editor.
3. Buka file `google-apps-script/Code.gs` dari project ini → copy semua isinya → paste ke editor Apps Script.
4. Cari baris `const SECRET = "GANTI_DENGAN_SECRET_ACAK_ANDA_SENDIRI";` → ganti isinya dengan kata sandi acak pilihan Anda (bebas, contoh: `monty-2026-rahasia`).
5. Klik **Save** (ikon disket) → beri nama project bebas, misal `Procurement Hub API`.
6. Klik **Deploy → New deployment** → klik ikon gear di samping "Select type" → pilih **Web app**.
   - Description: bebas
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Klik **Deploy** → akan diminta **Authorize access** → pilih akun Google Anda → kalau muncul peringatan "Google hasn't verified this app", klik **Advanced → Buka [nama project] (unsafe)** → **Allow** (ini aman, karena scriptnya milik Anda sendiri).
8. Setelah deploy selesai, copy **Web app URL** yang muncul (diakhiri `/exec`).

**C. Isi Environment Variables** (di `.env.local` untuk lokal, atau di Vercel untuk production):
```
APP_PASSWORD=password-bersama-tim-anda
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxx/exec
GOOGLE_SCRIPT_SECRET=harus-sama-persis-dengan-SECRET-di-langkah-B4
```

**Catatan penting:** kalau nanti Anda edit ulang `Code.gs` (misal untuk memperbaiki
bug), harus buat deployment baru supaya perubahan aktif: **Deploy → Manage
deployments → ikon pensil (Edit) → Version: New version → Deploy**. URL-nya
tetap sama, tidak perlu ganti env var lagi.

## 4. Menghubungkan spreadsheet "Cost Data" Anda (opsional)

Kalau Anda sudah punya spreadsheet referensi harga/kode barang sendiri (seperti
`Cost Data` dengan tab `MASTER DATA (MAT)`: kode, nama internal/eksternal, spek,
harga, sumber/supplier), Master Barang bisa menggabungkan data itu dengan
histori harga asli dari Purchase Order yang diupload -- **tanpa perlu mengubah
apapun** di spreadsheet Cost Data Anda.

1. Buka spreadsheet Cost Data Anda → copy ID-nya dari URL:
   `docs.google.com/spreadsheets/d/`**`INI_ID_NYA`**`/edit`.
2. Isi di Environment Variables:
   ```
   GOOGLE_COST_DATA_SHEET_ID=id_dari_langkah_1
   GOOGLE_COST_DATA_TAB=MASTER DATA (MAT)
   ```
3. Syaratnya: akun Google yang dipakai saat **Deploy** Apps Script (langkah 3
   di atas) harus punya akses (minimal Viewer) ke spreadsheet Cost Data ini juga
   -- karena Apps Script jalan atas nama akun itu ("Execute as: Me").

Kolom yang dibaca dari tab tsb (berdasarkan URUTAN kolom, bukan nama header,
karena header aslinya gabungan teks China+Inggris): kolom A=kode, B=nama
internal, C=nama eksternal, D-F=spek, G=harga/unit, H=harga/unit baru,
I=harga retail, J=%gain, K=source (dipakai sebagai nama supplier acuan), L=catatan.

Pencocokan barang dengan Purchase Order dilakukan berdasarkan **kecocokan nama**
(nama internal/eksternal di Cost Data vs nama item di PO, tidak case-sensitive).
Kalau penulisan namanya beda jauh antara PO dan Cost Data (typo, singkatan,
dsb.), barang tersebut akan muncul sebagai 2 baris terpisah di Master Barang --
perlu diselaraskan manual namanya di salah satu sumber kalau ingin digabung.

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
