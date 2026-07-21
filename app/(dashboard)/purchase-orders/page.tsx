import Link from "next/link";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPurchaseOrders } from "@/lib/sheets/repository";
import { PurchaseOrderTable } from "./po-table";

export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const pos = await getPurchaseOrders();
  const sorted = [...pos].sort((a, b) => new Date(b.po_date || 0).getTime() - new Date(a.po_date || 0).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Purchase Order</h1>
          <p className="text-sm text-ink-muted">
            Seluruh Purchase Order yang telah diupload dan tersimpan di Google Sheets
          </p>
        </div>
        <Link href="/purchase-orders/upload">
          <Button><Upload size={16} />Upload PO</Button>
        </Link>
      </div>

      <Card>
        {sorted.length ? (
          <PurchaseOrderTable initialData={sorted} initialQuery={searchParams.q || ""} />
        ) : (
          <div className="p-10 text-center text-sm text-ink-muted">
            Belum ada Purchase Order. Klik &quot;Upload PO&quot; untuk menambahkan yang pertama.
          </div>
        )}
      </Card>
    </div>
  );
}
