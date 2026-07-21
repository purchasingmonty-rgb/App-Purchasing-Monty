import { FileSpreadsheet, FileType } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getPurchaseOrders } from "@/lib/sheets/repository";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const pos = await getPurchaseOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Export</h1>
        <p className="text-sm text-ink-muted">
          Ekspor seluruh data Purchase Order ({pos.length} data) ke Excel atau CSV
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Purchase Order</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
          <a
            href="/api/export?format=xlsx"
            className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-sm font-medium text-ink hover:border-primary hover:bg-primary-soft hover:text-primary"
          >
            <FileSpreadsheet size={20} />
            Excel (.xlsx)
          </a>
          <a
            href="/api/export?format=csv"
            className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-sm font-medium text-ink hover:border-primary hover:bg-primary-soft hover:text-primary"
          >
            <FileType size={20} />
            CSV
          </a>
          <PrintButton />
        </CardContent>
      </Card>

      <p className="text-xs text-ink-muted">
        Anda juga bisa membuka & mengedit seluruh data ini langsung di Google Sheets kapan saja.
      </p>
    </div>
  );
}
