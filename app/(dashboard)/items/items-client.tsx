"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { MasterBarangEntry } from "@/lib/sheets/repository";

export function ItemsClient({ items }: { items: MasterBarangEntry[] }) {
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[],
    [items]
  );

  const filtered = items.filter((i) => {
    const matchCategory = category === "all" || i.category === category;
    const matchQ = !q || [i.internalName, i.externalName, i.name, i.code, i.lastSupplier, i.referenceSupplier].some((v) => (v || "").toLowerCase().includes(q.toLowerCase()));
    return matchCategory && matchQ;
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari kode, nama, atau supplier..."
          className="h-9 min-w-[240px] flex-1 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      <Card>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-ink-muted">
                  <th className="px-5 py-3 font-medium">Kode</th>
                  <th className="px-5 py-3 font-medium">Nama Internal</th>
                  <th className="px-5 py-3 font-medium">Nama Eksternal</th>
                  <th className="px-5 py-3 font-medium">Kategori</th>
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
                {filtered.map((item, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-bg-subtle">
                    <td className="px-5 py-3 text-ink-muted">{item.code || "-"}</td>
                    <td className="px-5 py-3 font-medium text-ink">
                      {item.internalName || item.name}
                      {item.purchaseCount === 0 && (
                        <Badge tone="neutral" className="ml-2">Belum pernah dibeli</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {item.externalName || "-"}
                    </td>
                    <td className="px-5 py-3">
                      {item.category ? <Badge tone="primary">{item.category}</Badge> : <span className="text-ink-muted">-</span>}
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
            Belum ada data barang yang cocok. Upload Purchase Order, atau hubungkan Cost Data di Environment Variables (lihat README).
          </div>
        )}
      </Card>
    </>
  );
}
