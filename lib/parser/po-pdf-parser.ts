import type { ParsedPO, ParsedPOLineItem } from "./po-html-parser";

/**
 * Parser PDF untuk PO -- dibangun dari analisis PDF asli
 * ("PT_KARA_-_MC-PO-CRK_VII_26-0006.pdf"), hasil export "Download PDF
 * (Print)" dari PO Generator Anda.
 *
 * Berbeda dari `pdftotext`, kita memakai `pdfjs-dist` langsung (murni JS,
 * tanpa proses eksternal) supaya jalan di Vercel/serverless yang tidak
 * punya binary `poppler-utils`. Setiap item teks dari pdfjs sudah berupa
 * satu potongan string utuh (label, nilai, atau satu baris alamat) lengkap
 * dengan posisi x/y -- ini kita pakai untuk merekonstruksi baris & kolom
 * (PO info box, VENDOR/SUPPLIER vs SHIP TO, tabel item, ringkasan total)
 * tanpa perlu menebak dari teks polos.
 */

interface TextItem {
  str: string;
  x: number;
  y: number;
  w: number;
}

interface Row {
  y: number;
  items: TextItem[]; // non-whitespace items, sorted by x
}

function cleanLine(s: string): string {
  return s.trim().replace(/,\s*$/, "");
}

function isWhitespace(s: string): boolean {
  return s.trim() === "";
}

async function getPageItems(buffer: Buffer): Promise<TextItem[]> {
  // Legacy build works in plain Node without DOM/canvas for text extraction.
  const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.js");
  const data = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data, useWorkerFetch: false }).promise;

  const allItems: TextItem[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    for (const it of content.items as any[]) {
      if (!it.str) continue;
      allItems.push({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5] + pageNum * -2000, // offset per page to keep pages in order when concatenated
        w: it.width,
      });
    }
  }
  return allItems;
}

/** Group flat text items into rows (same visual line), sorted top-to-bottom then left-to-right. */
function groupIntoRows(items: TextItem[]): Row[] {
  const nonEmpty = items.filter((it) => !isWhitespace(it.str));
  const rowsMap = new Map<string, TextItem[]>();

  for (const it of nonEmpty) {
    const key = Math.round(it.y * 2) / 2; // tolerate tiny sub-pixel differences
    const arr = rowsMap.get(String(key)) ?? [];
    arr.push(it);
    rowsMap.set(String(key), arr);
  }

  const rows: Row[] = Array.from(rowsMap.entries()).map(([y, arr]) => ({
    y: Number(y),
    items: arr.sort((a, b) => a.x - b.x),
  }));

  // Descending y = top to bottom on the page (PDF coordinate origin is bottom-left)
  rows.sort((a, b) => b.y - a.y);
  return rows;
}

function rowText(row: Row): string {
  return row.items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
}

/** Find the first row whose joined text matches a pattern, searching within [fromIndex, toIndex). */
function findRowIndex(rows: Row[], pattern: RegExp, fromIndex = 0, toIndex = rows.length): number {
  for (let i = fromIndex; i < toIndex; i++) {
    if (pattern.test(rowText(rows[i]))) return i;
  }
  return -1;
}

/** For a "Label ... Value" row (label as first item, value as last item). */
function labelValueFromRow(row: Row): { label: string; value: string } | null {
  if (row.items.length < 2) return null;
  const label = row.items[0].str.trim();
  const value = row.items[row.items.length - 1].str.trim();
  return { label, value };
}

function toNumber(text: string): number {
  const cleaned = (text || "").replace(/[^0-9,.\-]/g, "").trim();
  if (!cleaned) return 0;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned.replace(/(\d)\.(?=\d{3}(\D|$))/g, "$1");
  const value = parseFloat(normalized);
  return isNaN(value) ? 0 : value;
}

export async function parsePurchaseOrderPdf(buffer: Buffer): Promise<ParsedPO> {
  const items = await getPageItems(buffer);
  const rows = groupIntoRows(items);

  // ---- PO info box: PO Number / PO Date / Delivery Deadline / Payment Terms ----
  const infobox: Record<string, string> = {};
  for (const label of ["PO Number", "PO Date", "Delivery Deadline", "Payment Terms"]) {
    const idx = findRowIndex(rows, new RegExp(`^${label}\\b`, "i"));
    if (idx >= 0) {
      const lv = labelValueFromRow(rows[idx]);
      if (lv) infobox[label.toLowerCase()] = lv.value;
    }
  }

  // ---- Buyer block: logo line, buyer name, address lines, contact line ----
  // Always the left-column block before "VENDOR / SUPPLIER".
  const vendorHeaderIdx = findRowIndex(rows, /VENDOR\s*\/\s*SUPPLIER/i);
  const buyerRows = rows
    .slice(0, vendorHeaderIdx >= 0 ? vendorHeaderIdx : rows.length)
    .filter((r) => r.items.every((i) => i.x < 250)) // left column only
    .filter((r) => !/^PURCHASE ORDER$/i.test(rowText(r)));

  let buyerName: string | null = null;
  let buyerAddress: string | null = null;
  if (buyerRows.length >= 2) {
    // buyerRows[0] is the hardcoded brand/logo text ("MONTY&Co." in this template) -- skip it
    buyerName = rowText(buyerRows[1]) || null;
    buyerAddress = buyerRows
      .slice(2)
      .map(rowText)
      .map(cleanLine)
      .filter(Boolean)
      .join(", ") || null;
  }

  // ---- VENDOR/SUPPLIER vs SHIP TO columns ----
  let supplierName: string | null = null;
  let supplierAddress: string | null = null;
  let shipName: string | null = null;
  let shipAddress: string | null = null;

  const itemTableHeaderIdx = findRowIndex(rows, /Deskripsi Barang/i);

  if (vendorHeaderIdx >= 0) {
    const headerRow = rows[vendorHeaderIdx];
    const shipToItem = headerRow.items.find((i) => /SHIP\s*TO/i.test(i.str));
    const vendorItem = headerRow.items.find((i) => /VENDOR/i.test(i.str));
    const colBoundary =
      shipToItem && vendorItem ? (shipToItem.x + vendorItem.x) / 2 + (vendorItem.x < shipToItem.x ? 40 : 0) : 250;

    const blockEnd = itemTableHeaderIdx >= 0 ? itemTableHeaderIdx : rows.length;
    const leftLines: string[] = [];
    const rightLines: string[] = [];

    for (let i = vendorHeaderIdx + 1; i < blockEnd; i++) {
      const left = rows[i].items.filter((it) => it.x < colBoundary).map((it) => it.str).join(" ").trim();
      const right = rows[i].items.filter((it) => it.x >= colBoundary).map((it) => it.str).join(" ").trim();
      if (left) leftLines.push(left);
      if (right) rightLines.push(right);
    }

    supplierName = leftLines[0] ?? null;
    supplierAddress = leftLines.slice(1).map(cleanLine).filter(Boolean).join(", ") || null;
    shipName = rightLines[0] ?? null;
    shipAddress = rightLines.slice(1).map(cleanLine).filter(Boolean).join(", ") || null;
  }

  // ---- Item table ----
  const items_out: ParsedPOLineItem[] = [];
  let currency: string | null = null;
  let subtotalRowIdx = -1;

  if (itemTableHeaderIdx >= 0) {
    const headerText = rowText(rows[itemTableHeaderIdx]);
    const currencyMatch = headerText.match(/Price\s*\(([^)]+)\)/i);
    if (currencyMatch) currency = currencyMatch[1].trim();

    subtotalRowIdx = findRowIndex(rows, /^Subtotal\b/i, itemTableHeaderIdx + 1);
    const dataEnd = subtotalRowIdx >= 0 ? subtotalRowIdx : rows.length;

    for (let i = itemTableHeaderIdx + 1; i < dataEnd; i++) {
      const cells = rows[i].items;
      if (cells.length < 6) continue; // expect No, Desc, Qty, Satuan, Price, Total
      const [no, desc, qty, unit, price, total] = [
        cells[0].str,
        cells[1].str,
        cells[2].str,
        cells[3].str,
        cells[4].str,
        cells[cells.length - 1].str,
      ];
      if (!desc) continue;
      items_out.push({
        itemName: desc.trim(),
        category: null,
        qty: toNumber(qty),
        unit: unit.trim() || null,
        price: toNumber(price),
        subtotal: toNumber(total),
      });
    }
  }

  // ---- Summary: Subtotal / Diskon / Diskon Cash / PPN / Grand Total ----
  let subtotal: number | null = null;
  let discountLabel: string | null = null;
  let discountAmount: number | null = null;
  let cashDiscountAmount: number | null = null;
  let ppnLabel: string | null = null;
  let ppn: number | null = null;
  let grandTotal: number | null = null;

  const summaryEnd = findRowIndex(rows, /^Terbilang:/i, subtotalRowIdx >= 0 ? subtotalRowIdx : 0);
  const summaryScanEnd = summaryEnd >= 0 ? summaryEnd : rows.length;
  if (subtotalRowIdx >= 0) {
    for (let i = subtotalRowIdx; i < summaryScanEnd; i++) {
      const lv = labelValueFromRow(rows[i]);
      if (!lv) continue;
      const label = rowText(rows[i]).replace(/[\d.,\-]+$/, "").trim();
      const value = toNumber(lv.value);
      if (/^subtotal/i.test(label)) subtotal = value;
      else if (/^diskon cash/i.test(label)) cashDiscountAmount = value;
      else if (/^diskon/i.test(label)) {
        discountLabel = label;
        discountAmount = value;
      } else if (/^ppn/i.test(label)) {
        ppnLabel = label;
        ppn = value;
      } else if (/^grand total/i.test(label)) {
        grandTotal = value;
      }
    }
  }

  // ---- Terbilang ----
  let terbilang: string | null = null;
  if (summaryEnd >= 0) {
    const text = rowText(rows[summaryEnd]);
    terbilang = text.replace(/^Terbilang:\s*/i, "").trim() || null;
  }

  // ---- Syarat & Ketentuan (terms) ----
  const terms: string[] = [];
  const termsHeaderIdx = findRowIndex(rows, /Syarat\s*&\s*Ketentuan/i);
  if (termsHeaderIdx >= 0) {
    const stopIdx = findRowIndex(rows, /^Dibuat Oleh/i, termsHeaderIdx + 1);
    const end = stopIdx >= 0 ? stopIdx : rows.length;
    for (let i = termsHeaderIdx + 1; i < end; i++) {
      const text = rowText(rows[i]);
      const match = text.match(/^\d+\.\s*(.+)/);
      if (match) terms.push(match[1].trim());
    }
  }

  return {
    poNumber: infobox["po number"] ?? null,
    poDate: infobox["po date"] ?? null,
    deliveryDeadline: infobox["delivery deadline"] ?? null,
    buyerName,
    buyerAddress,
    supplierName,
    supplierAddress,
    supplierPic: null,
    shipName,
    shipAddress,
    requester: null,
    project: null,
    items: items_out,
    currency,
    subtotal: subtotal ?? (items_out.length ? items_out.reduce((s, i) => s + i.subtotal, 0) : null),
    discountLabel,
    discountAmount,
    cashDiscountAmount,
    ppnLabel,
    ppn,
    grandTotal,
    terbilang,
    paymentTerm: infobox["payment terms"] ?? null,
    terms,
    referenceNote: null,
    notes: null,
    raw: infobox,
  };
}
