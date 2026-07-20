-- ============================================================================
-- PROCUREMENT HUB — Supabase Database Schema
-- ============================================================================
-- Cara pakai:
--   1. Buka Supabase Dashboard > SQL Editor
--   2. Paste seluruh isi file ini, lalu Run
--   3. (Opsional) jalankan supabase/seed.sql untuk data contoh
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------
create type user_role as enum ('admin', 'user');
create type entity_status as enum ('active', 'inactive');
create type po_status as enum ('draft', 'open', 'partial', 'completed', 'cancelled');
create type source_file_type as enum ('html', 'pdf', 'excel', 'manual');

-- ----------------------------------------------------------------------------
-- PROFILES (extends auth.users with role & display info)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role user_role not null default 'user',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ----------------------------------------------------------------------------
-- SUPPLIERS
-- ----------------------------------------------------------------------------
create table suppliers (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  address text,
  pic_name text,
  phone text,
  whatsapp text,
  email text,
  npwp text,
  bank_name text,
  bank_account text,
  lead_time_days integer,
  payment_term text,
  category text,
  status entity_status not null default 'active',
  notes text,
  logo_url text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_suppliers_name on suppliers using gin (to_tsvector('simple', name));
create index idx_suppliers_status on suppliers (status);

-- ----------------------------------------------------------------------------
-- SUPPLIER DOCUMENTS (uploaded files: NPWP, SIUP, contracts, etc.)
-- ----------------------------------------------------------------------------
create table supplier_documents (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references suppliers (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ITEMS (Master Barang)
-- ----------------------------------------------------------------------------
create table items (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  category text,
  default_supplier_id uuid references suppliers (id),
  unit text,
  last_price numeric(14, 2),
  avg_price numeric(14, 2),
  highest_price numeric(14, 2),
  lowest_price numeric(14, 2),
  status entity_status not null default 'active',
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_items_name on items using gin (to_tsvector('simple', name));
create index idx_items_category on items (category);

-- ----------------------------------------------------------------------------
-- PURCHASE ORDERS (header)
-- ----------------------------------------------------------------------------
create table purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  po_number text unique not null,
  po_date date not null,
  supplier_id uuid not null references suppliers (id),
  supplier_address_snapshot text,
  supplier_pic_snapshot text,
  requester text,
  project text,
  subtotal numeric(16, 2) not null default 0,
  ppn numeric(16, 2) not null default 0,
  grand_total numeric(16, 2) not null default 0,
  payment_term text,
  notes text,
  status po_status not null default 'open',
  source_file_name text,
  source_file_type source_file_type,
  source_storage_path text,       -- raw uploaded file kept in Supabase Storage
  raw_parsed_json jsonb,           -- full parser output, for audit / re-parsing
  uploaded_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_po_number on purchase_orders (po_number);
create index idx_po_date on purchase_orders (po_date);
create index idx_po_supplier on purchase_orders (supplier_id);
create index idx_po_status on purchase_orders (status);
create index idx_po_project on purchase_orders (project);
create index idx_po_requester on purchase_orders (requester);

-- ----------------------------------------------------------------------------
-- PURCHASE ORDER ITEMS (line items)
-- ----------------------------------------------------------------------------
create table purchase_order_items (
  id uuid primary key default uuid_generate_v4(),
  po_id uuid not null references purchase_orders (id) on delete cascade,
  item_id uuid references items (id),
  item_name text not null,       -- kept even if item_id is null (unmatched item)
  category text,
  qty numeric(14, 3) not null,
  unit text,
  price numeric(14, 2) not null,
  subtotal numeric(16, 2) not null
);

create index idx_poi_po on purchase_order_items (po_id);
create index idx_poi_item on purchase_order_items (item_id);

-- ----------------------------------------------------------------------------
-- PRICE HISTORY (append-only log, one row per PO line item)
-- ----------------------------------------------------------------------------
create table price_history (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references items (id),
  supplier_id uuid not null references suppliers (id),
  po_id uuid not null references purchase_orders (id),
  po_number text not null,
  price numeric(14, 2) not null,
  qty numeric(14, 3) not null,
  change_pct numeric(6, 2),          -- % change vs previous price for this item
  recorded_at date not null
);

create index idx_price_history_item on price_history (item_id, recorded_at);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
create type notification_type as enum (
  'po_pending', 'supplier_late', 'payment_due', 'po_not_uploaded'
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  type notification_type not null,
  title text not null,
  message text not null,
  related_po_id uuid references purchase_orders (id),
  related_supplier_id uuid references suppliers (id),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AUDIT LOG (who changed what, when)
-- ----------------------------------------------------------------------------
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles (id),
  action text not null,            -- e.g. 'create', 'update', 'delete', 'upload_po'
  entity_table text not null,      -- e.g. 'purchase_orders'
  entity_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Keep updated_at fresh
create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_suppliers_updated_at before update on suppliers
  for each row execute procedure set_updated_at();
create trigger trg_items_updated_at before update on items
  for each row execute procedure set_updated_at();
create trigger trg_po_updated_at before update on purchase_orders
  for each row execute procedure set_updated_at();

-- Whenever a PO line item is inserted:
--   1. write a price_history row (with % change vs the item's last known price)
--   2. refresh the item's last/avg/highest/lowest price rollups
create function record_price_history_and_update_item()
returns trigger as $$
declare
  v_po record;
  v_prev_price numeric(14, 2);
  v_change_pct numeric(6, 2);
begin
  if new.item_id is null then
    return new;
  end if;

  select * into v_po from purchase_orders where id = new.po_id;

  select price into v_prev_price
    from price_history
    where item_id = new.item_id
    order by recorded_at desc, id desc
    limit 1;

  if v_prev_price is not null and v_prev_price > 0 then
    v_change_pct := round(((new.price - v_prev_price) / v_prev_price) * 100, 2);
  else
    v_change_pct := null;
  end if;

  insert into price_history (item_id, supplier_id, po_id, po_number, price, qty, change_pct, recorded_at)
  values (new.item_id, v_po.supplier_id, new.po_id, v_po.po_number, new.price, new.qty, v_change_pct, v_po.po_date);

  update items set
    last_price = new.price,
    avg_price = (select round(avg(price), 2) from price_history where item_id = new.item_id),
    highest_price = (select max(price) from price_history where item_id = new.item_id),
    lowest_price = (select min(price) from price_history where item_id = new.item_id)
  where id = new.item_id;

  return new;
end;
$$ language plpgsql;

create trigger trg_po_items_price_history
  after insert on purchase_order_items
  for each row execute procedure record_price_history_and_update_item();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Semua tabel data memerlukan login (authenticated). Menulis data sensitif
-- (supplier, item, PO) dibatasi untuk role 'admin' dan 'user' yang terautentikasi;
-- sesuaikan lebih lanjut sesuai kebijakan internal perusahaan Anda.

alter table profiles enable row level security;
alter table suppliers enable row level security;
alter table supplier_documents enable row level security;
alter table items enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table price_history enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;

create policy "profiles: read own" on profiles
  for select using (auth.uid() = id);

create policy "authenticated: read all" on suppliers
  for select using (auth.role() = 'authenticated');
create policy "authenticated: write suppliers" on suppliers
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated: update suppliers" on suppliers
  for update using (auth.role() = 'authenticated');

create policy "authenticated: read items" on items
  for select using (auth.role() = 'authenticated');
create policy "authenticated: write items" on items
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated: update items" on items
  for update using (auth.role() = 'authenticated');

create policy "authenticated: read po" on purchase_orders
  for select using (auth.role() = 'authenticated');
create policy "authenticated: write po" on purchase_orders
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated: update po" on purchase_orders
  for update using (auth.role() = 'authenticated');

create policy "authenticated: read po items" on purchase_order_items
  for select using (auth.role() = 'authenticated');
create policy "authenticated: write po items" on purchase_order_items
  for insert with check (auth.role() = 'authenticated');

create policy "authenticated: read price history" on price_history
  for select using (auth.role() = 'authenticated');

create policy "authenticated: read notifications" on notifications
  for select using (auth.role() = 'authenticated');

create policy "authenticated: read supplier docs" on supplier_documents
  for select using (auth.role() = 'authenticated');
create policy "authenticated: write supplier docs" on supplier_documents
  for insert with check (auth.role() = 'authenticated');

-- Audit log: only admins can read
create policy "admin: read audit log" on audit_log
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================================
-- STORAGE BUCKETS (run once)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('po-uploads', 'po-uploads', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('supplier-assets', 'supplier-assets', true)
on conflict (id) do nothing;
