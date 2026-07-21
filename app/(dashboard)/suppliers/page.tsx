import { getSuppliers } from "@/lib/sheets/repository";
import { SuppliersClient } from "./suppliers-client";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Supplier</h1>
        <p className="text-sm text-ink-muted">Data seluruh supplier perusahaan (tersimpan di Google Sheets)</p>
      </div>
      <SuppliersClient initialData={suppliers} />
    </div>
  );
}
