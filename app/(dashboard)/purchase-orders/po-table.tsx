"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deletePurchaseOrderAction } from "@/lib/actions";
import type { PurchaseOrder } from "@/lib/types";

export function PurchaseOrderTable({
  initialData,
  initialQuery = "",
}: {
  initialData: PurchaseOrder[];
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const [status, setStatus] = useState("all");
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = initialData.filter((po) => {
    const matchQ =
      !q ||
      [po.po_number, po.supplier_name, po.project, po.requester].some((v) =>
        (v || "").toLowerCase().includes(q.toLowerCase())
      );
    const matchStatus = status === "all" || po.status === status;
    return matchQ && matchStatus;
  });

  function handleDelete(id: string) {
    if (!confirm("Hapus Purchase Order ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deletePurchaseOrderAction(id);
      setDeletingId(null);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari No. PO, supplier, project, requester..."
          className="h-9 min-w-[240px] flex-1 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink"
        >
          <option value="all">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="open">Berjalan</option>
          <option value="partial">Sebagian</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

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
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((po) => (
              <tr key={po.id} className="border-b border-border last:border-0 hover:bg-bg-subtle">
                <td className="px-5 py-3 font-medium text-primary">{po.po_number}</td>
                <td className="px-5 py-3 text-ink-muted">{formatDate(po.po_date)}</td>
                <td className="px-5 py-3 text-ink">{po.supplier_name}</td>
                <td className="px-5 py-3 text-ink-muted">{po.project ?? "-"}</td>
                <td className="px-5 py-3 text-ink-muted">{po.requester ?? "-"}</td>
                <td className="figure px-5 py-3 text-right text-ink">{formatCurrency(po.grand_total)}</td>
                <td className="px-5 py-3"><StatusBadge status={po.status} /></td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleDelete(po.id)}
                    disabled={pending && deletingId === po.id}
                    className="text-xs font-medium text-danger hover:underline disabled:opacity-50"
                  >
                    {pending && deletingId === po.id ? "Menghapus..." : "Hapus"}
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-ink-muted">
                  Tidak ada Purchase Order yang cocok dengan pencarian/filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
