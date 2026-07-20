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
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import {
  dashboardStats,
  monthlySpend,
  topSuppliers,
  spendByCategory,
  mockPurchaseOrders,
} from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const s = dashboardStats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">
          Ringkasan aktivitas Procurement & Purchasing perusahaan
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Purchase Order" value={String(s.totalPO)} icon={FileText} />
        <StatCard
          label="Total Pengeluaran"
          value={formatCurrency(s.totalSpend)}
          icon={Wallet}
          trend="up"
          trendLabel="12% vs bulan lalu"
        />
        <StatCard label="Outstanding PO" value={String(s.outstandingPO)} icon={Clock} />
        <StatCard
          label="Supplier Aktif"
          value={`${s.activeSuppliers} / ${s.totalSuppliers}`}
          icon={Truck}
        />
        <StatCard label="Jumlah Barang" value={String(s.totalItems)} icon={Package} />
        <StatCard
          label="Pembelian Bulan Ini"
          value={formatCurrency(s.spendThisMonth)}
          icon={TrendingUp}
        />
        <StatCard
          label="Pembelian Tahun Ini"
          value={formatCurrency(s.spendThisYear)}
          icon={TrendingUp}
        />
        <StatCard label="Jumlah Supplier" value={String(s.totalSuppliers)} icon={Truck} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Grafik Pengeluaran Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <MonthlySpendChart data={monthlySpend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pembelian per Kategori</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <CategoryDonutChart data={spendByCategory} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Purchase Order Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
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
                  {mockPurchaseOrders.map((po) => (
                    <tr key={po.id} className="border-t border-border">
                      <td className="py-2.5 font-medium text-ink">{po.po_number}</td>
                      <td className="py-2.5 text-ink-muted">{po.supplier_name}</td>
                      <td className="py-2.5 text-ink-muted">{formatDate(po.po_date)}</td>
                      <td className="figure py-2.5 text-right text-ink">
                        {formatCurrency(po.grand_total)}
                      </td>
                      <td className="py-2.5">
                        <StatusBadge status={po.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Supplier</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <TopSuppliersChart data={topSuppliers} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
