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
  const spreadsheetId = e.parameter.spreadsheetId || null;

  try {
    if (action === "getRows") {
      return jsonResponse({ rows: getRows(tab, spreadsheetId) });
    }
    if (action === "getRawRows") {
      const startRow = e.parameter.startRow ? parseInt(e.parameter.startRow, 10) : 2;
      return jsonResponse({ rows: getRawRows(tab, spreadsheetId, startRow) });
    }
    if (action === "getDriveFile") {
      return jsonResponse(getDriveFile(e.parameter.fileId));
    }
    return jsonResponse({ error: "unknown action: " + action });
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
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
function getSpreadsheet(spreadsheetId) {
  // spreadsheetId kosong/null -> pakai spreadsheet tempat script ini ditempel
  // (Procurement Hub). Kalau diisi -> buka spreadsheet LAIN dengan ID itu
  // (misal "Cost Data"), asal masih di akun Google yang sama dengan yang
  // dipakai saat Deploy (Execute as: Me).
  if (spreadsheetId) return SpreadsheetApp.openById(spreadsheetId);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(tab, spreadsheetId) {
  const ss = getSpreadsheet(spreadsheetId);
  const sheet = ss.getSheetByName(tab);
  if (!sheet) throw new Error("Tab tidak ditemukan: " + tab);
  return sheet;
}

function getHeader(tab, spreadsheetId) {
  const sheet = getSheet(tab, spreadsheetId);
  const lastCol = sheet.getLastColumn();
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

function getRows(tab, spreadsheetId) {
  const sheet = getSheet(tab, spreadsheetId);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];
  const header = getHeader(tab, spreadsheetId);
  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return data
    .filter((row) => row.some((cell) => cell !== "" && cell !== null))
    .map((row) => {
      const obj = {};
      header.forEach((h, i) => (obj[h] = row[i]));
      return obj;
    });
}

/**
 * Baca baris mentah (array per baris, BUKAN object per nama kolom) --
 * dipakai untuk sheet eksternal yang header-nya berantakan/tidak cocok
 * dipakai sebagai key (contoh: "Cost Data" yang header-nya gabungan
 * teks China+Inggris dalam satu sel).
 */
function getRawRows(tab, spreadsheetId, startRow) {
  const sheet = getSheet(tab, spreadsheetId);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < startRow) return [];
  return sheet
    .getRange(startRow, 1, lastRow - startRow + 1, lastCol)
    .getValues()
    .filter((row) => row.some((cell) => cell !== "" && cell !== null));
}

function appendRow(tab, rowObj) {
  const sheet = getSheet(tab, null);
  const header = getHeader(tab, null);
  const row = header.map((h) => (rowObj[h] !== undefined ? rowObj[h] : ""));
  sheet.appendRow(row);
}

function appendRows(tab, rowObjs) {
  if (!rowObjs || !rowObjs.length) return;
  const sheet = getSheet(tab, null);
  const header = getHeader(tab, null);
  const rows = rowObjs.map((obj) => header.map((h) => (obj[h] !== undefined ? obj[h] : "")));
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, header.length).setValues(rows);
}

function overwriteRows(tab, rowObjs) {
  const sheet = getSheet(tab, null);
  const header = getHeader(tab, null);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, header.length).clearContent();
  }
  if (rowObjs && rowObjs.length) {
    const rows = rowObjs.map((obj) => header.map((h) => (obj[h] !== undefined ? obj[h] : "")));
    sheet.getRange(2, 1, rows.length, header.length).setValues(rows);
  }
}

/**
 * Baca file dari Google Drive milik akun yang men-deploy script ini
 * (Execute as: Me) -- dipakai untuk fitur "Upload PO dari Google Drive".
 * Filenya harus ada di Drive akun yang sama, atau sudah di-share ke akun itu.
 */
function getDriveFile(fileId) {
  if (!fileId) throw new Error("fileId tidak diisi");
  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();
  return {
    name: file.getName(),
    mimeType: blob.getContentType(),
    base64: Utilities.base64Encode(blob.getBytes()),
  };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
