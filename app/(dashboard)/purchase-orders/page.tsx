import Link from "next/link";
import { Upload, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { mockPurchaseOrders } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PurchaseOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            Purchase Order
          </h1>
          <p className="text-sm text-ink-muted">
            Seluruh Purchase Order yang telah diupload dan tersimpan
          </p>
        </div>
        <Link href="/purchase-orders/upload">
          <Button>
            <Upload size={16} />
            Upload PO
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            placeholder="Cari No. PO, supplier, project..."
            className="h-9 min-w-[220px] flex-1 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
          <select className="h-9 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink">
            <option>Semua Status</option>
            <option>Draft</option>
            <option>Berjalan</option>
            <option>Sebagian</option>
            <option>Selesai</option>
            <option>Dibatalkan</option>
          </select>
          <select className="h-9 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink">
            <option>Semua Supplier</option>
          </select>
          <Button variant="secondary" size="sm">
            <Filter size={14} />
            Filter lanjutan
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-ink-muted">
                <th className="px-5 py-3 font-medium">No. PO</th>
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Supplier</th>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Requester</th>
                <th className="px-5 py-3 font-medium text-right">Grand Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockPurchaseOrders.map((po) => (
                <tr
                  key={po.id}
                  className="border-b border-border last:border-0 hover:bg-bg-subtle"
                >
                  <td className="px-5 py-3 font-medium text-primary">
                    <Link href={`/purchase-orders/${po.id}`}>{po.po_number}</Link>
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{formatDate(po.po_date)}</td>
                  <td className="px-5 py-3 text-ink">{po.supplier_name}</td>
                  <td className="px-5 py-3 text-ink-muted">{po.project ?? "-"}</td>
                  <td className="px-5 py-3 text-ink-muted">{po.requester ?? "-"}</td>
                  <td className="figure px-5 py-3 text-right text-ink">
                    {formatCurrency(po.grand_total)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={po.status} />
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
