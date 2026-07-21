/**
 * PROCUREMENT HUB — Backend Google Apps Script
 * ============================================================================
 * Cara pakai:
 *   1. Buka spreadsheet "Procurement Hub" Anda (yang sudah punya 3 tab:
 *      Suppliers, PurchaseOrders, PurchaseOrderItems dengan header di baris 1).
 *   2. Menu Extensions > Apps Script.
 *   3. Hapus semua isi editor yang tampil, ganti dengan seluruh isi file ini.
 *   4. Ganti nilai SECRET di bawah dengan kata sandi acak pilihan Anda sendiri
 *      (bebas, cukup panjang, contoh: "monty-2026-xyzsecret").
 *   5. Klik Deploy > New deployment > pilih tipe "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   6. Klik Deploy, lalu Authorize access (izinkan akses ke akun Google Anda).
 *   7. Copy URL yang muncul (diakhiri /exec) → itu untuk GOOGLE_SCRIPT_URL.
 *   8. SECRET yang Anda isi di langkah 4 → itu untuk GOOGLE_SCRIPT_SECRET.
 *
 * PENTING: Setiap kali Anda mengedit script ini lagi, harus buat deployment
 * BARU (Deploy > Manage deployments > Edit > New version) supaya perubahan
 * benar-benar aktif di URL yang sama.
 * ============================================================================
 */

const SECRET = "GANTI_DENGAN_SECRET_ACAK_ANDA_SENDIRI";

function doGet(e) {
  if (e.parameter.secret !== SECRET) {
    return jsonResponse({ error: "unauthorized" });
  }
  const action = e.parameter.action;
  const tab = e.parameter.tab;

  if (action === "getRows") {
    return jsonResponse({ rows: getRows(tab) });
  }
  return jsonResponse({ error: "unknown action: " + action });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: "invalid JSON body" });
  }

  if (body.secret !== SECRET) {
    return jsonResponse({ error: "unauthorized" });
  }

  try {
    if (body.action === "appendRow") {
      appendRow(body.tab, body.row);
      return jsonResponse({ success: true });
    }
    if (body.action === "appendRows") {
      appendRows(body.tab, body.rows);
      return jsonResponse({ success: true });
    }
    if (body.action === "overwriteRows") {
      overwriteRows(body.tab, body.rows);
      return jsonResponse({ success: true });
    }
    return jsonResponse({ error: "unknown action: " + body.action });
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function getSheet(tab) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tab);
  if (!sheet) throw new Error("Tab tidak ditemukan: " + tab);
  return sheet;
}

function getHeader(tab) {
  const sheet = getSheet(tab);
  const lastCol = sheet.getLastColumn();
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

function getRows(tab) {
  const sheet = getSheet(tab);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];
  const header = getHeader(tab);
  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return data
    .filter((row) => row.some((cell) => cell !== "" && cell !== null))
    .map((row) => {
      const obj = {};
      header.forEach((h, i) => (obj[h] = row[i]));
      return obj;
    });
}

function appendRow(tab, rowObj) {
  const sheet = getSheet(tab);
  const header = getHeader(tab);
  const row = header.map((h) => (rowObj[h] !== undefined ? rowObj[h] : ""));
  sheet.appendRow(row);
}

function appendRows(tab, rowObjs) {
  if (!rowObjs || !rowObjs.length) return;
  const sheet = getSheet(tab);
  const header = getHeader(tab);
  const rows = rowObjs.map((obj) => header.map((h) => (obj[h] !== undefined ? obj[h] : "")));
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, header.length).setValues(rows);
}

function overwriteRows(tab, rowObjs) {
  const sheet = getSheet(tab);
  const header = getHeader(tab);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, header.length).clearContent();
  }
  if (rowObjs && rowObjs.length) {
    const rows = rowObjs.map((obj) => header.map((h) => (obj[h] !== undefined ? obj[h] : "")));
    sheet.getRange(2, 1, rows.length, header.length).setValues(rows);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
