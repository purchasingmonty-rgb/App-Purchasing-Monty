import { getMasterBarang, getAllLineItems } from "@/lib/sheets/repository";
import { PriceHistoryClient } from "./price-history-client";

export const dynamic = "force-dynamic";

export default async function PriceHistoryPage() {
  const [items, flat] = await Promise.all([getMasterBarang(), getAllLineItems()]);

  // Group all line items by item name (case-insensitive) with % change pre-computed,
  // so the client component can switch items instantly without extra requests.
  const byItem: Record<string, typeof flat> = {};
  const sorted = [...flat].sort((a, b) => new Date(a.po_date || 0).getTime() - new Date(b.po_date || 0).getTime());
  const lastPrice: Record<string, number> = {};
  const history: Record<string, (typeof flat[number] & { changePct: number | null })[]> = {};

  for (const item of sorted) {
    const key = item.item_name.trim().toLowerCase();
    const prev = lastPrice[key];
    const changePct = prev ? Math.round(((item.price - prev) / prev) * 10000) / 100 : null;
    lastPrice[key] = item.price;
    if (!history[key]) history[key] = [];
    history[key].push({ ...item, changePct });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Histori Harga</h1>
        <p className="text-sm text-ink-muted">Pantau kenaikan atau penurunan harga barang dari waktu ke waktu</p>
      </div>
      <PriceHistoryClient items={items.map((i) => i.name)} history={history} />
    </div>
  );
}
