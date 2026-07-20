-- Data contoh (opsional) — jalankan setelah schema.sql untuk mencoba aplikasi
-- dengan data nyata di database sebelum menghubungkan upload PO sungguhan.

insert into suppliers (code, name, address, pic_name, phone, email, payment_term, category, status)
values
  ('SUP-001', 'PT Sumber Makmur Abadi', 'Jl. Industri Raya No. 45, Jakarta Utara', 'Budi Santoso', '081234567890', 'budi@sumbermakmur.co.id', 'Net 30', 'Bahan Baku', 'active'),
  ('SUP-002', 'CV Kertas Jaya', 'Jl. Percetakan No. 12, Bandung', 'Siti Rahma', '081298765432', 'siti@kertasjaya.com', 'Net 14', 'Kemasan', 'active'),
  ('SUP-003', 'PT Teknik Presisi', 'Jl. Rawa Buaya No. 8, Tangerang', 'Andi Wijaya', '081211112222', 'andi@teknikpresisi.co.id', 'Net 45', 'Sparepart', 'active');

insert into items (code, name, category, default_supplier_id, unit, status)
select 'BRG-001', 'Paper Cup 8oz', 'Kemasan', id, 'pack', 'active' from suppliers where code = 'SUP-002';

insert into items (code, name, category, default_supplier_id, unit, status)
select 'BRG-002', 'Tepung Terigu Segitiga Biru', 'Bahan Baku', id, 'sak 25kg', 'active' from suppliers where code = 'SUP-001';

insert into items (code, name, category, default_supplier_id, unit, status)
select 'BRG-003', 'Bearing 6203 ZZ', 'Sparepart', id, 'pcs', 'active' from suppliers where code = 'SUP-003';
