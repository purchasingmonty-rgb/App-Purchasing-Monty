import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const REPORTS = [
  { title: "Laporan Pembelian Bulanan", desc: "Rekap seluruh PO per bulan berjalan" },
  { title: "Laporan Tahunan", desc: "Total pembelian & tren sepanjang tahun" },
  { title: "Laporan Supplier", desc: "Performa & total transaksi per supplier" },
  { title: "Laporan Barang", desc: "Volume dan nilai pembelian per barang" },
  { title: "Laporan Pengeluaran", desc: "Total pengeluaran berdasarkan periode" },
  { title: "Laporan Outstanding", desc: "PO yang belum selesai / belum dibayar" },
  { title: "Laporan Berdasarkan Project", desc: "Pengeluaran dikelompokkan per project" },
  { title: "Laporan Berdasarkan Requester", desc: "Pengeluaran dikelompokkan per pemohon" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Report</h1>
        <p className="text-sm text-ink-muted">
          Buat laporan otomatis berdasarkan data Purchase Order
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <select className="h-9 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink">
            <option>Bulan Ini</option>
            <option>Tahun Ini</option>
            <option>Custom Range</option>
          </select>
          <select className="h-9 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink">
            <option>Semua Supplier</option>
          </select>
          <select className="h-9 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink">
            <option>Semua Kategori</option>
          </select>
          <select className="h-9 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink">
            <option>Semua Project</option>
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.title} className="flex flex-col p-5">
            <h3 className="font-display text-[15px] font-semibold text-ink">{r.title}</h3>
            <p className="mt-1 flex-1 text-sm text-ink-muted">{r.desc}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1">
                Lihat
              </Button>
              <Button size="sm" className="flex-1">
                <Download size={14} />
                Export
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
