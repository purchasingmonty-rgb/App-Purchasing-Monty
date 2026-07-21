import { getMasterBarang } from "@/lib/sheets/repository";
import { ItemsClient } from "./items-client";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await getMasterBarang();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Master Barang</h1>
        <p className="text-sm text-ink-muted">
          Kode, nama, spek & kategori dari Cost Data — harga otomatis diperbarui dari Purchase Order yang tersimpan
        </p>
      </div>
      <ItemsClient items={items} />
    </div>
  );
}
