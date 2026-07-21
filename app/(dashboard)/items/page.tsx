import { getMasterBarang } from "@/lib/sheets/repository";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await getMasterBarang();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Master Barang</h1>
        <p className="text-sm text-ink-muted">
          Kode, nama & spek dari Cost Data — harga otomatis diperbarui dari Purchase Order yang tersimpan
        </p>
      </div>

      <Card>
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-ink-muted">
                  <th className="px-5 py-3 font-medium">Kode</th>
                  <th className="px-5 py-3 font-medium">Nama Barang</th>
                  <th className="px-5 py-3 font-medium">Spek</th>
                  <th className="px-5 py-3 font-medium text-right">Total Qty Dibeli</th>
                  <th className="px-5 py-3 font-medium text-right">Harga Terakhir</th>
                  <th className="px-5 py-3 font-medium text-right">Rata-rata</th>
                  <th className="px-5 py-3 font-medium text-right">Tertinggi</th>
                  <th className="px-5 py-3 font-medium text-right">Terendah</th>
                  <th className="px-5 py-3 font-medium">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-bg-subtle">
                    <td className="px-5 py-3 text-ink-muted">{item.code || "-"}</td>
                    <td className="px-5 py-3 font-medium text-ink">
                      {item.name}
                      {item.purchaseCount === 0 && (
                        <Badge tone="neutral" className="ml-2">Belum pernah dibeli</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{item.spec || item.unit || "-"}</td>
                    <td className="figure px-5 py-3 text-right">{formatNumber(item.totalQty)}</td>
                    <td className="figure px-5 py-3 text-right text-ink">{formatCurrency(item.lastPrice)}</td>
                    <td className="figure px-5 py-3 text-right text-ink-muted">{formatCurrency(item.avgPrice)}</td>
                    <td className="figure px-5 py-3 text-right text-ink-muted">{formatCurrency(item.highestPrice)}</td>
                    <td className="figure px-5 py-3 text-right text-ink-muted">{formatCurrency(item.lowestPrice)}</td>
                    <td className="px-5 py-3 text-ink-muted">{item.lastSupplier !== "-" ? item.lastSupplier : (item.referenceSupplier || "-")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-ink-muted">
            Belum ada data barang. Upload Purchase Order, atau hubungkan Cost Data di Environment Variables (lihat README).
          </div>
        )}
      </Card>
    </div>
  );
}
