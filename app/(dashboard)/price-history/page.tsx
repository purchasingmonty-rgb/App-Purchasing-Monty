"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { mockPriceHistory } from "@/lib/mock-data";
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

export default function PriceHistoryPage() {
  const chartData = mockPriceHistory.map((p) => ({
    date: formatDate(p.date),
    price: p.price,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Histori Harga</h1>
        <p className="text-sm text-ink-muted">
          Pantau kenaikan atau penurunan harga barang dari waktu ke waktu
        </p>
      </div>

      <Card className="p-4">
        <select className="h-9 rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink">
          <option>Paper Cup 8oz</option>
          <option>Tepung Terigu Segitiga Biru</option>
          <option>Bearing 6203 ZZ</option>
        </select>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grafik Harga — Paper Cup 8oz</CardTitle>
        </CardHeader>
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
              {mockPriceHistory.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg-subtle">
                  <td className="px-5 py-3 text-ink-muted">{formatDate(p.date)}</td>
                  <td className="px-5 py-3 text-ink">{p.supplier_name}</td>
                  <td className="px-5 py-3 text-primary">{p.po_number}</td>
                  <td className="figure px-5 py-3 text-right">{p.qty}</td>
                  <td className="figure px-5 py-3 text-right text-ink">{formatCurrency(p.price)}</td>
                  <td
                    className={`figure px-5 py-3 text-right font-medium ${
                      p.change_pct == null
                        ? "text-ink-muted"
                        : p.change_pct > 0
                        ? "text-danger"
                        : "text-success"
                    }`}
                  >
                    {p.change_pct == null ? "-" : `${p.change_pct > 0 ? "+" : ""}${p.change_pct}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
