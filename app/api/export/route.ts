import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getPurchaseOrders } from "@/lib/sheets/repository";
import { formatDate } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") || "csv";
  const pos = await getPurchaseOrders();

  const rows = pos.map((po) => ({
    "No. PO": po.po_number,
    Tanggal: formatDate(po.po_date),
    Supplier: po.supplier_name,
    Requester: po.requester || "",
    Project: po.project || "",
    Subtotal: po.subtotal,
    PPN: po.ppn,
    "Grand Total": po.grand_total,
    Status: po.status,
  }));

  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Order");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="purchase-orders.xlsx"',
      },
    });
  }

  const headers = rows.length ? Object.keys(rows[0]) : ["No. PO", "Tanggal", "Supplier", "Requester", "Project", "Subtotal", "PPN", "Grand Total", "Status"];
  const csv = [headers.join(",")]
    .concat(rows.map((r) => headers.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(",")))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="purchase-orders.csv"',
    },
  });
}
