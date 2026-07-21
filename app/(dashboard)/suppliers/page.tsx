import { getSuppliers, getDerivedSupplierInfo } from "@/lib/sheets/repository";
import { SuppliersClient } from "./suppliers-client";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const [suppliers, derivedInfo] = await Promise.all([getSuppliers(), getDerivedSupplierInfo()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Supplier</h1>
        <p className="text-sm text-ink-muted">
          Data supplier lengkap, ditambah supplier yang terdeteksi otomatis dari Purchase Order & Master Barang
        </p>
      </div>
      <SuppliersClient initialData={suppliers} derivedInfo={derivedInfo} />
    </div>
  );
}
