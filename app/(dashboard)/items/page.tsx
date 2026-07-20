import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { mockItems } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function ItemsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Master Barang</h1>
          <p className="text-sm text-ink-muted">
            Harga otomatis diperbarui setiap ada Purchase Order baru
          </p>
        </div>
        <Button>
          <Plus size={16} />
          Tambah Barang
        </Button>
      </div>

      <Card className="p-4">
        <input
          placeholder="Cari kode atau nama barang..."
          className="h-9 w-full max-w-sm rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-ink-muted">
                <th className="px-5 py-3 font-medium">Kode</th>
                <th className="px-5 py-3 font-medium">Nama Barang</th>
                <th className="px-5 py-3 font-medium">Kategori</th>
                <th className="px-5 py-3 font-medium">Satuan</th>
                <th className="px-5 py-3 font-medium text-right">Harga Terakhir</th>
                <th className="px-5 py-3 font-medium text-right">Rata-rata</th>
                <th className="px-5 py-3 font-medium text-right">Tertinggi</th>
                <th className="px-5 py-3 font-medium text-right">Terendah</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockItems.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-bg-subtle">
                  <td className="px-5 py-3 font-medium text-ink">{item.code}</td>
                  <td className="px-5 py-3 text-ink">{item.name}</td>
                  <td className="px-5 py-3 text-ink-muted">{item.category}</td>
                  <td className="px-5 py-3 text-ink-muted">{item.unit}</td>
                  <td className="figure px-5 py-3 text-right text-ink">
                    {formatCurrency(item.last_price ?? 0)}
                  </td>
                  <td className="figure px-5 py-3 text-right text-ink-muted">
                    {formatCurrency(item.avg_price ?? 0)}
                  </td>
                  <td className="figure px-5 py-3 text-right text-ink-muted">
                    {formatCurrency(item.highest_price ?? 0)}
                  </td>
                  <td className="figure px-5 py-3 text-right text-ink-muted">
                    {formatCurrency(item.lowest_price ?? 0)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
