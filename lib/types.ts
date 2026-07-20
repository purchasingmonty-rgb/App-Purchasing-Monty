export type POStatus = "draft" | "open" | "partial" | "completed" | "cancelled";

export interface Supplier {
  id: string;
  code: string;
  name: string;
  address: string | null;
  pic_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  npwp: string | null;
  bank_name: string | null;
  bank_account: string | null;
  lead_time_days: number | null;
  payment_term: string | null;
  category: string | null;
  status: "active" | "inactive";
  notes: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  category: string | null;
  default_supplier_id: string | null;
  unit: string | null;
  last_price: number | null;
  avg_price: number | null;
  highest_price: number | null;
  lowest_price: number | null;
  status: "active" | "inactive";
  photo_url: string | null;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  po_date: string;
  supplier_id: string;
  supplier_name: string;
  requester: string | null;
  project: string | null;
  subtotal: number;
  ppn: number;
  grand_total: number;
  payment_term: string | null;
  notes: string | null;
  status: POStatus;
  source_file_name: string | null;
  source_file_type: "html" | "pdf" | "excel" | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  item_id: string | null;
  item_name: string;
  category: string | null;
  qty: number;
  unit: string | null;
  price: number;
  subtotal: number;
}

export interface PriceHistoryEntry {
  id: string;
  item_id: string;
  item_name: string;
  supplier_name: string;
  po_number: string;
  date: string;
  price: number;
  qty: number;
  change_pct: number | null;
}

export interface DashboardStats {
  totalPO: number;
  totalSpend: number;
  outstandingPO: number;
  activeSuppliers: number;
  totalSuppliers: number;
  totalItems: number;
  spendThisMonth: number;
  spendThisYear: number;
}
