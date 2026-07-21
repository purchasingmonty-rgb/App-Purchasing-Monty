"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface HistoryPoint {
  po_number: string;
  po_date: string;
  supplier_name: string;
  qty: number;
  price: number;
  changePct: number | null;
}

export function PriceHistoryClient({
  items,
  history,
}: {
  items: string[];
  history: Record<string, HistoryPoint[]>;
}) {
  const [selected, setSelected] = useState(items[0] || "");
  if (!items.length) {
    return (
      <Card className="p-10 text-center text-sm text-ink-muted">
        Belum ada data barang. Upload Purchase Order untuk mengisi Histori Harga.
      </Card>
    );
  }

  const hist = history[selected.trim().toLowerCase()] || [];
  const chartData = hist.map((h) => ({ date: formatDate(h.po_date), price: h.price }));

  return (
    <>
      <Card className="p-4">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-9 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink"
        >
          {items.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </Card>

      <Card>
        <CardHeader><CardTitle>Grafik Harga — {selected}</CardTitle></CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(230,233,240)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "rgb(91,100,114)" }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "rgb(91,100,114)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`}
                width={44}
              />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="price" stroke="rgb(37,87,214)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-ink-muted">
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Supplier</th>
                <th className="px-5 py-3 font-medium">No. PO</th>
                <th className="px-5 py-3 font-medium text-right">Qty</th>
                <th className="px-5 py-3 font-medium text-right">Harga</th>
                <th className="px-5 py-3 font-medium text-right">Perubahan</th>
              </tr>
            </thead>
            <tbody>
              {hist.map((h, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-ink-muted">{formatDate(h.po_date)}</td>
                  <td className="px-5 py-3">{h.supplier_name}</td>
                  <td className="px-5 py-3 text-primary">{h.po_number}</td>
                  <td className="figure px-5 py-3 text-right">{h.qty}</td>
                  <td className="figure px-5 py-3 text-right">{formatCurrency(h.price)}</td>
                  <td
                    className="figure px-5 py-3 text-right font-semibold"
                    style={{ color: h.changePct == null ? "var(--ink-muted)" : h.changePct > 0 ? "var(--danger)" : "var(--success)" }}
                  >
                    {h.changePct == null ? "-" : `${h.changePct > 0 ? "+" : ""}${h.changePct}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
