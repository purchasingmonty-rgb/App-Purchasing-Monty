import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, FileType, Printer, type LucideIcon } from "lucide-react";

const DATASETS = [
  "Purchase Order",
  "Supplier",
  "Master Barang",
  "Histori Harga",
  "Laporan Pengeluaran",
];

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Export</h1>
        <p className="text-sm text-ink-muted">
          Pilih data yang ingin diekspor dan format tujuannya
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-2">
          {DATASETS.map((d) => (
            <label
              key={d}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm text-ink hover:bg-bg-subtle"
            >
              <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
              {d}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Format Export</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
          <ExportOption icon={FileSpreadsheet} label="Excel (.xlsx)" />
          <ExportOption icon={FileText} label="PDF" />
          <ExportOption icon={FileType} label="CSV" />
          <ExportOption icon={Printer} label="Print" />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="md">Export Sekarang</Button>
      </div>
    </div>
  );
}

function ExportOption({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-sm font-medium text-ink hover:border-primary hover:bg-primary-soft hover:text-primary">
      <Icon size={20} />
      {label}
    </button>
  );
}
