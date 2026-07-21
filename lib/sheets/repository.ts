import { getRows, getRawRows, appendRow, appendRows, overwriteRows } from "./client";
import type { Supplier, PurchaseOrder, PurchaseOrderItem } from "@/lib/types";

const TAB_SUPPLIERS = "Suppliers";
const TAB_PO = "PurchaseOrders";
const TAB_PO_ITEMS = "PurchaseOrderItems";

// "Cost Data" adalah spreadsheet TERPISAH milik Anda (bukan Procurement Hub),
// dipakai sebagai referensi kode/nama/spek/harga acuan barang. Bisa lebih dari
// satu tab (dipisah koma di env var), misal Small EQ / Big EQ / MAT sekaligus.
// Lihat README bagian "Menghubungkan Cost Data (opsional)".
const COST_DATA_SHEET_ID = process.env.GOOGLE_COST_DATA_SHEET_ID || "";
const COST_DATA_TABS = (process.env.GOOGLE_COST_DATA_TABS || process.env.GOOGLE_COST_DATA_TAB || "MASTER DATA (MAT)")
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);

/** Ambil nama kategori singkat dari nama tab, misal "MASTER DATA (Small EQ)" -> "Small EQ". */
function categoryFromTabName(tab: string): string {
  const match = tab.match(/\(([^)]+)\)/);
  return match ? match[1] : tab;
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
function num(v: any): number {
  const n = parseFloat(String(v ?? "").replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

// =============================================================================
// SUPPLIERS
// =============================================================================
export async function getSuppliers(): Promise<Supplier[]> {
  const rows = await getRows<Record<string, string>>(TAB_SUPPLIERS);
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    address: r.address || null,
    pic_name: r.pic_name || null,
    phone: r.phone || null,
    whatsapp: r.whatsapp || null,
    email: r.email || null,
    npwp: r.npwp || null,
    bank_name: r.bank_name || null,
    bank_account: r.bank_account || null,
    lead_time_days: r.lead_time_days ? num(r.lead_time_days) : null,
    payment_term: r.payment_term || null,
    category: r.category || null,
    status: (r.status as "active" | "inactive") || "active",
    notes: r.notes || null,
    logo_url: null,
    created_at: r.created_at || new Date().toISOString(),
  }));
}

export async function addSupplier(input: {
  name: string;
  code?: string;
  address?: string;
  pic_name?: string;
  phone?: string;
  email?: string;
  category?: string;
  payment_term?: string;
  lead_time_days?: string;
}): Promise<void> {
  const existing = await getSuppliers();
  const code = input.code?.trim() || `SUP-${String(existing.length + 1).padStart(3, "0")}`;
  await appendRow(TAB_SUPPLIERS, {
    id: uid("sup"),
    code,
    name: input.name.trim(),
    address: input.address?.trim() || "",
    pic_name: input.pic_name?.trim() || "",
    phone: input.phone?.trim() || "",
    whatsapp: "",
    email: input.email?.trim() || "",
    npwp: "",
    bank_name: "",
    bank_account: "",
    lead_time_days: input.lead_time_days || "",
    payment_term: input.payment_term?.trim() || "",
    category: input.category?.trim() || "",
    status: "active",
    notes: "",
    created_at: new Date().toISOString(),
  });
}

export async function deleteSupplier(id: string): Promise<void> {
  const rows = await getRows<Record<string, string>>(TAB_SUPPLIERS);
  await overwriteRows(TAB_SUPPLIERS, rows.filter((r) => r.id !== id));
}

export interface DerivedSupplierInfo {
  name: string;
  address: string | null;
  lastPoDate: string | null;
  lastPoNumber: string | null;
}

/**
 * Supplier yang "terlihat" lewat Master Barang & riwayat Purchase Order --
 * dipakai untuk menampilkan + PRA-ISI identitas supplier di menu Supplier
 * (nama & alamat), meski belum pernah ditambahkan manual. Alamat diambil
 * dari PO PALING BARU yang memakai supplier tsb.
 */
export async function getDerivedSupplierInfo(): Promise<DerivedSupplierInfo[]> {
  const [costData, poRows] = await Promise.all([
    getCostDataItems(),
    getRows<Record<string, string>>(TAB_PO),
  ]);

  const byName = new Map<string, DerivedSupplierInfo>();

  // Urutkan PO dari yang paling lama ke paling baru, supaya entri terakhir
  // yang ditulis ke map adalah data supplier paling mutakhir.
  const sortedPoRows = [...poRows].sort(
    (a, b) => new Date(a.po_date || 0).getTime() - new Date(b.po_date || 0).getTime()
  );
  for (const r of sortedPoRows) {
    const name = (r.supplier_name || "").trim();
    if (!name) continue;
    byName.set(name.toLowerCase(), {
      name,
      address: r.supplier_address || null,
      lastPoDate: r.po_date || null,
      lastPoNumber: r.po_number || null,
    });
  }

  // Supplier yang cuma muncul di Cost Data (kolom Source), belum pernah ada POnya.
  for (const c of costData) {
    const name = (c.source || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!byName.has(key)) {
      byName.set(key, { name, address: null, lastPoDate: null, lastPoNumber: null });
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// =============================================================================
// PURCHASE ORDERS (+ line items)
// =============================================================================
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const rows = await getRows<Record<string, string>>(TAB_PO);
  return rows.map((r) => ({
    id: r.id,
    po_number: r.po_number,
    po_date: r.po_date,
    supplier_id: r.id,
    supplier_name: r.supplier_name,
    requester: r.requester || null,
    project: r.project || null,
    subtotal: num(r.subtotal),
    ppn: num(r.ppn),
    grand_total: num(r.grand_total),
    payment_term: r.payment_term || null,
    notes: r.notes || null,
    status: (r.status as PurchaseOrder["status"]) || "open",
    source_file_name: r.source_file_name || null,
    source_file_type: (r.source_file_type as any) || null,
    created_at: r.created_at || new Date().toISOString(),
    updated_at: r.created_at || new Date().toISOString(),
  }));
}

export interface NewPurchaseOrderInput {
  poNumber: string | null;
  poDate: string | null;
  deliveryDeadline?: string | null;
  supplierName: string | null;
  supplierAddress?: string | null;
  buyerName?: string | null;
  buyerAddress?: string | null;
  shipName?: string | null;
  shipAddress?: string | null;
  requester?: string | null;
  project?: string | null;
  currency?: string | null;
  subtotal?: number | null;
  discountLabel?: string | null;
  discountAmount?: number | null;
  cashDiscountAmount?: number | null;
  ppnLabel?: string | null;
  ppn?: number | null;
  grandTotal?: number | null;
  terbilang?: string | null;
  paymentTerm?: string | null;
  terms?: string[];
  sourceFileName?: string | null;
  items: { itemName: string; category?: string | null; qty: number; unit?: string | null; price: number; subtotal: number }[];
}

export async function savePurchaseOrder(input: NewPurchaseOrderInput): Promise<void> {
  const id = uid("po");
  const poNumber = input.poNumber || `PO-${Date.now()}`;
  const createdAt = new Date().toISOString();

  await appendRow(TAB_PO, {
    id,
    po_number: poNumber,
    po_date: input.poDate || createdAt,
    delivery_deadline: input.deliveryDeadline || "",
    supplier_name: input.supplierName || "Supplier Tidak Diketahui",
    supplier_address: input.supplierAddress || "",
    buyer_name: input.buyerName || "",
    buyer_address: input.buyerAddress || "",
    ship_name: input.shipName || "",
    ship_address: input.shipAddress || "",
    requester: input.requester || "",
    project: input.project || "",
    currency: input.currency || "IDR",
    subtotal: input.subtotal ?? 0,
    discount_label: input.discountLabel || "",
    discount_amount: input.discountAmount ?? "",
    cash_discount_amount: input.cashDiscountAmount ?? "",
    ppn_label: input.ppnLabel || "",
    ppn: input.ppn ?? 0,
    grand_total: input.grandTotal ?? 0,
    terbilang: input.terbilang || "",
    payment_term: input.paymentTerm || "",
    terms: input.terms || [],
    status: "open",
    source_file_name: input.sourceFileName || "",
    created_at: createdAt,
  });

  if (input.items.length) {
    await appendRows(
      TAB_PO_ITEMS,
      input.items.map((item) => ({
        po_id: id,
        po_number: poNumber,
        po_date: input.poDate || createdAt,
        supplier_name: input.supplierName || "Supplier Tidak Diketahui",
        item_name: item.itemName,
        category: item.category || "",
        qty: item.qty,
        unit: item.unit || "",
        price: item.price,
        subtotal: item.subtotal,
      }))
    );
  }
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  const [poRows, itemRows] = await Promise.all([
    getRows<Record<string, string>>(TAB_PO),
    getRows<Record<string, string>>(TAB_PO_ITEMS),
  ]);
  const target = poRows.find((r) => r.id === id);
  await overwriteRows(TAB_PO, poRows.filter((r) => r.id !== id));
  if (target) {
    await overwriteRows(TAB_PO_ITEMS, itemRows.filter((r) => r.po_id !== id));
  }
}

// =============================================================================
// LINE ITEMS (raw, used for Master Barang & Histori Harga derivation)
// =============================================================================
export interface FlatLineItem {
  po_id: string;
  po_number: string;
  po_date: string;
  supplier_name: string;
  item_name: string;
  category: string | null;
  qty: number;
  unit: string | null;
  price: number;
  subtotal: number;
}

export async function getAllLineItems(): Promise<FlatLineItem[]> {
  const rows = await getRows<Record<string, string>>(TAB_PO_ITEMS);
  return rows.map((r) => ({
    po_id: r.po_id,
    po_number: r.po_number,
    po_date: r.po_date,
    supplier_name: r.supplier_name,
    item_name: r.item_name,
    category: r.category || null,
    qty: num(r.qty),
    unit: r.unit || null,
    price: num(r.price),
    subtotal: num(r.subtotal),
  }));
}

export interface CostDataItem {
  code: string;
  internalName: string;
  externalName: string;
  spec1: string;
  spec2: string;
  spec3: string;
  priceUnit: number;
  priceUnitNew: number;
  retailPrice: number;
  pctGain: string;
  source: string; // = nama supplier, sesuai konfirmasi Anda
  note: string;
  category: string; // diambil dari nama tab, misal "Small EQ" / "Big EQ" / "MAT"
}

export async function getCostDataItems(): Promise<CostDataItem[]> {
  if (!COST_DATA_SHEET_ID || !COST_DATA_TABS.length) return [];

  const perTab = await Promise.all(
    COST_DATA_TABS.map(async (tab) => {
      const rows = await getRawRows(tab, {
        spreadsheetId: COST_DATA_SHEET_ID,
        startRow: 2,
      });
      const category = categoryFromTabName(tab);
      return rows
        .filter((r) => r[1] || r[2]) // internal atau external name harus ada
        .map(
          (r): CostDataItem => ({
            code: String(r[0] ?? ""),
            internalName: String(r[1] ?? ""),
            externalName: String(r[2] ?? ""),
            spec1: String(r[3] ?? ""),
            spec2: String(r[4] ?? ""),
            spec3: String(r[5] ?? ""),
            priceUnit: num(r[6]),
            priceUnitNew: num(r[7]),
            retailPrice: num(r[8]),
            pctGain: String(r[9] ?? ""),
            source: String(r[10] ?? ""),
            note: String(r[11] ?? ""),
            category,
          })
        );
    })
  );

  return perTab.flat();
}

export interface MasterBarangEntry {
  name: string;
  code: string | null;
  category: string | null;
  spec: string | null;
  unit: string | null;
  totalQty: number;
  lastPrice: number;
  avgPrice: number;
  highestPrice: number;
  lowestPrice: number;
  purchaseCount: number;
  lastSupplier: string;
  referenceSupplier: string | null; // dari kolom "Source" di Cost Data
}

export async function getMasterBarang(): Promise<MasterBarangEntry[]> {
  const [flat, costData] = await Promise.all([getAllLineItems(), getCostDataItems()]);
  flat.sort((a, b) => new Date(a.po_date || 0).getTime() - new Date(b.po_date || 0).getTime());

  const byName = new Map<string, { name: string; unit: string | null; prices: number[]; totalQty: number; lastSupplier: string }>();
  for (const item of flat) {
    const key = item.item_name.trim().toLowerCase();
    if (!byName.has(key)) {
      byName.set(key, { name: item.item_name, unit: item.unit, prices: [], totalQty: 0, lastSupplier: item.supplier_name });
    }
    const rec = byName.get(key)!;
    rec.prices.push(item.price);
    rec.totalQty += item.qty;
    rec.unit = item.unit || rec.unit;
    rec.lastSupplier = item.supplier_name;
  }

  // Index Cost Data by both internal & external name (lowercased) so we can
  // match against whatever name shows up on the actual PO (varies per vendor).
  const costByName = new Map<string, CostDataItem>();
  for (const c of costData) {
    if (c.externalName) costByName.set(c.externalName.trim().toLowerCase(), c);
    if (c.internalName) costByName.set(c.internalName.trim().toLowerCase(), c);
  }

  const result: MasterBarangEntry[] = [];
  const consumedCostKeys = new Set<string>();

  // 1) Barang yang sudah pernah dibeli (ada di riwayat PO)
  for (const [key, r] of byName.entries()) {
    const cost = costByName.get(key);
    if (cost) {
      consumedCostKeys.add((cost.externalName || "").trim().toLowerCase());
      consumedCostKeys.add((cost.internalName || "").trim().toLowerCase());
    }
    result.push({
      name: cost ? cost.externalName || cost.internalName : r.name,
      code: cost?.code || null,
      category: cost?.category || null,
      spec: cost ? [cost.spec1, cost.spec2, cost.spec3].filter(Boolean).join(" / ") || null : null,
      unit: r.unit,
      totalQty: r.totalQty,
      lastPrice: r.prices[r.prices.length - 1],
      avgPrice: r.prices.reduce((a, b) => a + b, 0) / r.prices.length,
      highestPrice: Math.max(...r.prices),
      lowestPrice: Math.min(...r.prices),
      purchaseCount: r.prices.length,
      lastSupplier: r.lastSupplier,
      referenceSupplier: cost?.source || null,
    });
  }

  // 2) Barang yang ada di Cost Data tapi BELUM PERNAH dibeli lewat PO --
  //    tetap ditampilkan (pakai harga acuan dari Cost Data), supaya
  //    Master Barang mencerminkan seluruh katalog, bukan cuma yang sudah dibeli.
  for (const c of costData) {
    const key1 = (c.externalName || "").trim().toLowerCase();
    const key2 = (c.internalName || "").trim().toLowerCase();
    if (consumedCostKeys.has(key1) || consumedCostKeys.has(key2)) continue;
    if (!key1 && !key2) continue;
    consumedCostKeys.add(key1);
    consumedCostKeys.add(key2);
    const referencePrice = c.priceUnitNew || c.priceUnit;
    result.push({
      name: c.externalName || c.internalName,
      code: c.code || null,
      category: c.category || null,
      spec: [c.spec1, c.spec2, c.spec3].filter(Boolean).join(" / ") || null,
      unit: c.spec2 || null,
      totalQty: 0,
      lastPrice: referencePrice,
      avgPrice: referencePrice,
      highestPrice: referencePrice,
      lowestPrice: referencePrice,
      purchaseCount: 0,
      lastSupplier: "-",
      referenceSupplier: c.source || null,
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export interface PriceHistoryPoint extends FlatLineItem {
  changePct: number | null;
}

export async function getPriceHistoryForItem(itemName: string): Promise<PriceHistoryPoint[]> {
  const flat = (await getAllLineItems()).filter(
    (i) => i.item_name.trim().toLowerCase() === itemName.trim().toLowerCase()
  );
  flat.sort((a, b) => new Date(a.po_date || 0).getTime() - new Date(b.po_date || 0).getTime());
  let prev: number | null = null;
  return flat.map((i) => {
    const changePct = prev ? Math.round(((i.price - prev) / prev) * 10000) / 100 : null;
    prev = i.price;
    return { ...i, changePct };
  });
}
