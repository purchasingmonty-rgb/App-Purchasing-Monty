import {
  FileText,
  Wallet,
  Clock,
  Truck,
  Package,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { MonthlySpendChart } from "@/components/charts/monthly-spend-chart";
import { TopSuppliersChart } from "@/components/charts/top-suppliers-chart";
import { getPurchaseOrders, getSuppliers, getMasterBarang } from "@/lib/sheets/repository";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function monthKey(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const [pos, suppliers, items] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getMasterBarang(),
  ]);

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let totalSpend = 0, spendThisMonth = 0, spendThisYear = 0, outstanding = 0;
  for (const po of pos) {
    totalSpend += po.grand_total || 0;
    if (monthKey(po.po_date) === thisMonthKey) spendThisMonth += po.grand_total || 0;
    if (po.po_date && new Date(po.po_date).getFullYear() === now.getFullYear()) spendThisYear += po.grand_total || 0;
    if (po.status !== "completed" && po.status !== "cancelled") outstanding += 1;
  }
  const activeSuppliers = new Set(pos.map((p) => p.supplier_name)).size;

  const monthlyMap = new Map<string, number>();
  for (const po of pos) {
    const mk = monthKey(po.po_date);
    if (!mk) continue;
    monthlyMap.set(mk, (monthlyMap.get(mk) || 0) + (po.grand_total || 0));
  }
  const monthlySpend = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, total]) => ({ month, total }));

  const supplierTotals = new Map<string, number>();
  for (const po of pos) {
    supplierTotals.set(po.supplier_name, (supplierTotals.get(po.supplier_name) || 0) + (po.grand_total || 0));
  }
  const topSuppliers = Array.from(supplierTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({ name, total }));

  const recent = [...pos]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">
          Ringkasan aktivitas Procurement & Purchasing perusahaan
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Purchase Order" value={String(pos.length)} icon={FileText} />
        <StatCard label="Total Pengeluaran" value={formatCurrency(totalSpend)} icon={Wallet} />
        <StatCard label="Outstanding PO" value={String(outstanding)} icon={Clock} />
        <StatCard label="Supplier Aktif" value={`${activeSuppliers} / ${suppliers.length}`} icon={Truck} />
        <StatCard label="Jumlah Barang" value={String(items.length)} icon={Package} />
        <StatCard label="Pembelian Bulan Ini" value={formatCurrency(spendThisMonth)} icon={TrendingUp} />
        <StatCard label="Pembelian Tahun Ini" value={formatCurrency(spendThisYear)} icon={TrendingUp} />
        <StatCard label="Jumlah Supplier" value={String(suppliers.length)} icon={Truck} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Grafik Pengeluaran Bulanan</CardTitle></CardHeader>
          <CardContent className="pt-2">
            {monthlySpend.length ? <MonthlySpendChart data={monthlySpend} /> : <p className="text-sm text-ink-muted py-10 text-center">Belum ada data. Upload Purchase Order untuk mengisi grafik ini.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Supplier</CardTitle></CardHeader>
          <CardContent className="pt-2">
            {topSuppliers.length ? <TopSuppliersChart data={topSuppliers} /> : <p className="text-sm text-ink-muted py-10 text-center">Belum ada data.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Purchase Order Terbaru</CardTitle></CardHeader>
        <CardContent className="pt-2">
          {recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-muted">
                    <th className="pb-2 font-medium">No. PO</th>
                    <th className="pb-2 font-medium">Supplier</th>
                    <th className="pb-2 font-medium">Tanggal</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((po) => (
                    <tr key={po.id} className="border-t border-border">
                      <td className="py-2.5 font-medium text-ink">{po.po_number}</td>
                      <td className="py-2.5 text-ink-muted">{po.supplier_name}</td>
                      <td className="py-2.5 text-ink-muted">{formatDate(po.po_date)}</td>
                      <td className="figure py-2.5 text-right text-ink">{formatCurrency(po.grand_total)}</td>
                      <td className="py-2.5"><StatusBadge status={po.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-ink-muted py-10 text-center">
              Belum ada Purchase Order. Upload PO pertama Anda di menu &quot;Purchase Order&quot;.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
