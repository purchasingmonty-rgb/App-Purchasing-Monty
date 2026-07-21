/**
 * Lapisan koneksi ke Google Sheets lewat Google Apps Script Web App
 * (menggantikan Supabase sebagai database).
 *
 * Ini TIDAK memakai Google Cloud Console / service account -- cukup script
 * yang ditempel langsung di spreadsheet (Extensions > Apps Script), lalu
 * di-deploy sebagai Web App. Lihat google-apps-script/Code.gs dan README
 * bagian "Setup Google Sheets" untuk cara setupnya.
 *
 * Env var yang dibutuhkan:
 *   GOOGLE_SCRIPT_URL     -- URL Web App (diakhiri /exec)
 *   GOOGLE_SCRIPT_SECRET  -- harus SAMA PERSIS dengan SECRET di Code.gs
 */

function getConfig() {
  const url = process.env.GOOGLE_SCRIPT_URL;
  const secret = process.env.GOOGLE_SCRIPT_SECRET;
  if (!url || !secret) {
    throw new Error(
      "Google Sheets belum dikonfigurasi. Isi GOOGLE_SCRIPT_URL dan GOOGLE_SCRIPT_SECRET di .env.local (lihat README)."
    );
  }
  return { url, secret };
}

async function callScript(body: Record<string, any>): Promise<any> {
  const { url, secret } = getConfig();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // hindari CORS preflight ke Apps Script
    body: JSON.stringify({ ...body, secret }),
    cache: "no-store",
  });
  const data = await res.json();
  if (data.error) throw new Error(`Google Sheets error: ${data.error}`);
  return data;
}

/** Read all data rows of a tab as an array of objects keyed by header. */
export async function getRows<T = Record<string, string>>(
  tab: string,
  opts?: { spreadsheetId?: string }
): Promise<T[]> {
  const { url, secret } = getConfig();
  const params = new URLSearchParams({ action: "getRows", tab, secret });
  if (opts?.spreadsheetId) params.set("spreadsheetId", opts.spreadsheetId);
  const res = await fetch(`${url}?${params.toString()}`, { cache: "no-store" });
  const data = await res.json();
  if (data.error) throw new Error(`Google Sheets error: ${data.error}`);
  return (data.rows || []).map((row: Record<string, any>) => {
    const obj: Record<string, string> = {};
    for (const k in row) obj[k] = row[k] == null ? "" : String(row[k]);
    return obj as T;
  });
}

/**
 * Read raw rows (array-of-arrays, not keyed by header) starting at `startRow`
 * (default row 2, i.e. skipping a single header row). Use this for external
 * sheets whose header text is messy/unreliable to use as object keys.
 */
export async function getRawRows(
  tab: string,
  opts?: { spreadsheetId?: string; startRow?: number }
): Promise<any[][]> {
  const { url, secret } = getConfig();
  const params = new URLSearchParams({ action: "getRawRows", tab, secret });
  if (opts?.spreadsheetId) params.set("spreadsheetId", opts.spreadsheetId);
  if (opts?.startRow) params.set("startRow", String(opts.startRow));
  const res = await fetch(`${url}?${params.toString()}`, { cache: "no-store" });
  const data = await res.json();
  if (data.error) throw new Error(`Google Sheets error: ${data.error}`);
  return data.rows || [];
}

/** Append a single row (object keyed by column name) to the end of a tab. */
export async function appendRow(tab: string, rowObject: Record<string, any>): Promise<void> {
  await callScript({ action: "appendRow", tab, row: rowObject });
}

/** Append many rows at once (more efficient than looping appendRow). */
export async function appendRows(tab: string, rowObjects: Record<string, any>[]): Promise<void> {
  if (!rowObjects.length) return;
  await callScript({ action: "appendRows", tab, rows: rowObjects });
}

/**
 * Replace ALL data rows of a tab (used for delete/update, since it's simpler
 * and more reliable than precise row deletion). Fine for the scale of a
 * single company's data; note this is last-write-wins if two people edit
 * at the exact same moment.
 */
export async function overwriteRows(tab: string, rowObjects: Record<string, any>[]): Promise<void> {
  await callScript({ action: "overwriteRows", tab, rows: rowObjects });
}
