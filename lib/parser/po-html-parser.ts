import * as cheerio from "cheerio";

/**
 * Parser ini disesuaikan PRESISI dengan struktur PO Generator Anda
 * (file "PO_Generator_AI__3_.html"). Dokumen PO final yang sesungguhnya
 * adalah HTML yang dirender oleh JS ke dalam <div id="po-preview"> --
 * jadi file yang diupload sebaiknya adalah hasil "Save As Complete
 * Webpage" SETELAH form PO diisi & preview tampil (bukan file generator
 * kosong), supaya markup #po-preview berisi data asli.
 *
 * Struktur yang disasar (dari fungsi renderPreview() di source Anda):
 *   #po-preview
 *     .pv-header
 *       .pv-buyer-name          -> nama perusahaan pembeli (buyer)
 *       .pv-small (1st)         -> alamat buyer (baris dipisah <br>)
 *       .pv-infobox tr          -> PO Number / PO Date / Delivery Deadline / Payment Terms
 *     .pv-cols
 *       .pv-bar "VENDOR/SUPPLIER" + .pv-small -> nama & alamat supplier
 *       .pv-bar "SHIP TO" + .pv-small          -> nama & alamat tujuan kirim
 *     .pv-item-table                            -> baris item barang
 *     .pv-summary                                -> subtotal/diskon/PPN/grand total
 *     .pv-terbilang, .pv-terms-title + .pv-terms, .pv-ref
 *
 * CATATAN PENTING: template ini TIDAK punya field "Requester", "Project",
 * atau "Kategori" barang -- field itu ada di skema database kita (untuk
 * kebutuhan filter/report) tapi harus diisi manual setelah upload, karena
 * memang tidak ada di dokumen sumbernya.
 */

export interface ParsedPOLineItem {
  itemName: string;
  category: string | null;
  qty: number;
  unit: string | null;
  price: number;
  subtotal: number;
}

export interface ParsedPO {
  poNumber: string | null;
  poDate: string | null;
  deliveryDeadline: string | null;
  buyerName: string | null;
  buyerAddress: string | null;
  supplierName: string | null;
  supplierAddress: string | null;
  supplierPic: string | null;
  shipName: string | null;
  shipAddress: string | null;
  requester: string | null;
  project: string | null;
  items: ParsedPOLineItem[];
  currency: string | null;
  subtotal: number | null;
  discountLabel: string | null;
  discountAmount: number | null;
  cashDiscountAmount: number | null;
  ppnLabel: string | null;
  ppn: number | null;
  grandTotal: number | null;
  terbilang: string | null;
  paymentTerm: string | null;
  terms: string[];
  referenceNote: string | null;
  notes: string | null;
  raw: Record<string, string>;
}

function parseCurrencyToNumber(text: string): number {
  const cleaned = (text || "")
    .replace(/rp/gi, "")
    .replace(/[^0-9,.\-]/g, "")
    .trim();
  if (!cleaned) return 0;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned.replace(/(\d)\.(?=\d{3}(\D|$))/g, "$1"); // strip thousands dots like 1.234.567
  const value = parseFloat(normalized);
  return isNaN(value) ? 0 : value;
}

/** Split an element's innerHTML on <br> tags into clean text lines. */
function linesFromBr($: cheerio.CheerioAPI, el: any): string[] {
  const html = $(el).html() || "";
  return html
    .split(/<br\s*\/?>/i)
    .map((s) => cheerio.load(`<div>${s}</div>`)("div").text().trim())
    .filter(Boolean);
}

function extractInfobox($: cheerio.CheerioAPI, $preview: cheerio.Cheerio<any>) {
  const map: Record<string, string> = {};
  $preview.find(".pv-infobox tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length === 2) {
      const label = $(cells[0]).text().trim().toLowerCase();
      const value = $(cells[1]).text().trim();
      map[label] = value;
    }
  });
  return map;
}

function extractPanelByBarLabel(
  $: cheerio.CheerioAPI,
  $preview: cheerio.Cheerio<any>,
  labelPattern: RegExp
): { name: string | null; addressLines: string[] } {
  let name: string | null = null;
  let addressLines: string[] = [];

  $preview.find(".pv-bar").each((_, bar) => {
    const barText = $(bar).text().trim();
    if (!labelPattern.test(barText)) return;

    const small = $(bar).nextAll(".pv-small").first();
    if (!small.length) return;

    const strong = small.find("strong").first();
    name = strong.length ? strong.text().trim() : null;

    // Lines after the <strong> (name) — split remaining innerHTML by <br>
    const fullLines = linesFromBr($, small.get(0));
    addressLines = strong.length ? fullLines.slice(1) : fullLines;
  });

  return { name, addressLines };
}

function extractItems($: cheerio.CheerioAPI, $preview: cheerio.Cheerio<any>): {
  items: ParsedPOLineItem[];
  currency: string | null;
} {
  const items: ParsedPOLineItem[] = [];
  const table = $preview.find(".pv-item-table").first();
  let currency: string | null = null;

  if (!table.length) return { items, currency };

  const headerText = table.find("tr").first().text();
  const currencyMatch = headerText.match(/Price\s*\(([^)]+)\)/i);
  if (currencyMatch) currency = currencyMatch[1].trim();

  const rows = table.find("tr").slice(1); // skip header row
  rows.each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 6) return;
    const cellTexts = cells.toArray().map((c) => $(c).text().trim());
    // Columns: No. | Deskripsi Barang | Qty | Satuan | Price | Total Price
    const [, desc, qty, unit, price, total] = cellTexts;
    if (!desc) return;
    items.push({
      itemName: desc,
      category: null,
      qty: parseCurrencyToNumber(qty) || 0,
      unit: unit || null,
      price: parseCurrencyToNumber(price),
      subtotal: parseCurrencyToNumber(total),
    });
  });

  return { items, currency };
}

function extractSummary($: cheerio.CheerioAPI, $preview: cheerio.Cheerio<any>) {
  const summary = {
    subtotal: null as number | null,
    discountLabel: null as string | null,
    discountAmount: null as number | null,
    cashDiscountAmount: null as number | null,
    ppnLabel: null as string | null,
    ppn: null as number | null,
    grandTotal: null as number | null,
  };

  $preview.find(".pv-summary tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length !== 2) return;
    const label = $(cells[0]).text().trim();
    const valueText = $(cells[1]).text().trim();
    const value = parseCurrencyToNumber(valueText);
    const isGrand = $(tr).hasClass("grand");

    if (/^subtotal/i.test(label)) {
      summary.subtotal = value;
    } else if (/^diskon cash/i.test(label)) {
      summary.cashDiscountAmount = value;
    } else if (/^diskon/i.test(label)) {
      summary.discountLabel = label;
      summary.discountAmount = value;
    } else if (/^ppn/i.test(label)) {
      summary.ppnLabel = label;
      summary.ppn = value;
    } else if (isGrand || /grand total/i.test(label)) {
      summary.grandTotal = value;
    }
  });

  return summary;
}

export function parsePurchaseOrderHtml(html: string): ParsedPO {
  const $ = cheerio.load(html);
  const $found = $("#po-preview");

  // Fallback: some exports may not include the #po-preview id wrapper
  // (e.g. if only the inner fragment was saved) -- in that case treat the
  // whole document body as the preview container.
  const $preview: cheerio.Cheerio<any> = $found.length ? $found : $("body");

  const infobox = extractInfobox($, $preview);
  const supplier = extractPanelByBarLabel($, $preview, /vendor|supplier/i);
  const ship = extractPanelByBarLabel($, $preview, /ship\s*to/i);
  const { items, currency } = extractItems($, $preview);
  const summary = extractSummary($, $preview);

  const buyerName = $preview.find(".pv-buyer-name").first().text().trim() || null;
  const headerSmall = $preview.find(".pv-header .pv-small").first();
  const buyerAddress = headerSmall.length
    ? linesFromBr($, headerSmall.get(0)).join(", ")
    : null;

  const terbilangText = $preview.find(".pv-terbilang").first().text().trim();
  const terbilang = terbilangText
    ? terbilangText.replace(/^terbilang:\s*/i, "").trim()
    : null;

  const terms: string[] = [];
  $preview.find(".pv-terms li").each((_, li) => {
    const t = $(li).text().trim();
    if (t) terms.push(t);
  });

  const referenceNote = $preview.find(".pv-ref").first().text().trim() || null;

  return {
    poNumber: infobox["po number"] || null,
    poDate: infobox["po date"] || null,
    deliveryDeadline: infobox["delivery deadline"] || null,
    buyerName,
    buyerAddress,
    supplierName: supplier.name,
    supplierAddress: supplier.addressLines.join(", ") || null,
    supplierPic: null, // not captured by this template -- fill manually if needed
    shipName: ship.name,
    shipAddress: ship.addressLines.join(", ") || null,
    requester: null, // not present in this PO template -- isi manual setelah upload
    project: null,    // not present in this PO template -- isi manual setelah upload
    items,
    currency,
    subtotal: summary.subtotal ?? (items.length ? items.reduce((s, i) => s + i.subtotal, 0) : null),
    discountLabel: summary.discountLabel,
    discountAmount: summary.discountAmount,
    cashDiscountAmount: summary.cashDiscountAmount,
    ppnLabel: summary.ppnLabel,
    ppn: summary.ppn,
    grandTotal: summary.grandTotal,
    terbilang,
    paymentTerm: infobox["payment terms"] || null,
    terms,
    referenceNote,
    notes: null,
    raw: infobox,
  };
}
