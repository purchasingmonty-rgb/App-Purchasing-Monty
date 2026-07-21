import { google } from "googleapis";

/**
 * Lapisan koneksi ke Google Sheets (menggantikan Supabase sebagai database).
 *
 * Cara kerja: aplikasi ini login ke Google Sheets pakai "Service Account"
 * (akun robot, bukan akun pribadi Anda), lalu membaca/menulis baris seperti
 * database biasa. Spreadsheet-nya tetap bisa Anda buka & edit manual kapan
 * saja lewat browser seperti Google Sheets pada umumnya.
 *
 * Env var yang dibutuhkan (lihat .env.local.example):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_SHEET_ID
 */

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error(
      "Google Sheets belum dikonfigurasi. Isi GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, dan GOOGLE_SHEET_ID di .env.local (lihat README)."
    );
  }
  // Private key disimpan di env var dengan \n literal -- perlu diubah jadi newline asli.
  const privateKey = rawKey.replace(/\\n/g, "\n");
  return new google.auth.JWT(email, undefined, privateKey, [
    "https://www.googleapis.com/auth/spreadsheets",
  ]);
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID belum diisi di .env.local");
  return id;
}

function getSheetsApi() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

/** Read the header row (row 1) of a tab. */
async function getHeader(tab: string): Promise<string[]> {
  const sheets = getSheetsApi();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A1:Z1`,
  });
  return (res.data.values && res.data.values[0]) || [];
}

/** Read all data rows of a tab as an array of objects keyed by header. */
export async function getRows<T = Record<string, string>>(tab: string): Promise<T[]> {
  const sheets = getSheetsApi();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A1:Z10000`,
  });
  const rows = res.data.values || [];
  if (rows.length < 2) return [];
  const [header, ...data] = rows;
  return data
    .filter((row) => row.some((cell) => cell !== "" && cell != null))
    .map((row) => {
      const obj: Record<string, string> = {};
      header.forEach((h, i) => (obj[h] = row[i] ?? ""));
      return obj as T;
    });
}

/** Append a single row (object keyed by column name) to the end of a tab. */
export async function appendRow(tab: string, rowObject: Record<string, any>): Promise<void> {
  const header = await getHeader(tab);
  const sheets = getSheetsApi();
  const values = [header.map((h) => stringifyCell(rowObject[h]))];
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

/** Append many rows at once (more efficient than looping appendRow). */
export async function appendRows(tab: string, rowObjects: Record<string, any>[]): Promise<void> {
  if (!rowObjects.length) return;
  const header = await getHeader(tab);
  const sheets = getSheetsApi();
  const values = rowObjects.map((obj) => header.map((h) => stringifyCell(obj[h])));
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

/**
 * Replace ALL data rows of a tab (used for delete/update, since Sheets API
 * doesn't have a simple "delete row by id" -- we filter in memory then
 * rewrite the whole tab). Fine for the scale of a single company's data;
 * note this is last-write-wins if two people edit at the exact same moment.
 */
export async function overwriteRows(tab: string, rowObjects: Record<string, any>[]): Promise<void> {
  const header = await getHeader(tab);
  const sheets = getSheetsApi();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A2:Z10000`,
  });
  if (!rowObjects.length) return;
  const values = rowObjects.map((obj) => header.map((h) => stringifyCell(obj[h])));
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

function stringifyCell(value: any): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(" | ");
  return String(value);
}
