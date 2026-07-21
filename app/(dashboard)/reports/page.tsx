import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Download, Eye } from "lucide-react";

const REPORTS = [
  { title: "Laporan Pembelian Bulanan", desc: "Rekap seluruh PO per bulan berjalan" },
  { title: "Laporan Tahunan", desc: "Total pembelian & tren sepanjang tahun" },
  { title: "Laporan Supplier", desc: "Performa & total transaksi per supplier" },
  { title: "Laporan Barang", desc: "Volume dan nilai pembelian per barang" },
  { title: "Laporan Pengeluaran", desc: "Total pengeluaran berdasarkan periode" },
  { title: "Laporan Outstanding", desc: "PO yang belum selesai / belum dibayar" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Report</h1>
        <p className="text-sm text-ink-muted">
          Untuk saat ini, semua laporan diambil dari data Purchase Order yang sama —
          gunakan filter di menu Purchase Order untuk mempersempit data, lalu export dari sini.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.title} className="flex flex-col p-5">
            <h3 className="font-display text-[15px] font-semibold text-ink">{r.title}</h3>
            <p className="mt-1 flex-1 text-sm text-ink-muted">{r.desc}</p>
            <div className="mt-4 flex gap-2">
              <Link href="/purchase-orders" className="flex-1">
                <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-bg-subtle px-3 py-2 text-xs font-semibold text-ink hover:bg-border">
                  <Eye size={14} /> Lihat Data
                </button>
              </Link>
              <a href="/api/export?format=xlsx" className="flex-1">
                <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
                  <Download size={14} /> Export
                </button>
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
