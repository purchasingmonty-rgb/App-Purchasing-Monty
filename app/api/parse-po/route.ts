import { NextRequest, NextResponse } from "next/server";
import { parsePurchaseOrderHtml } from "@/lib/parser/po-html-parser";
import { parsePurchaseOrderPdf } from "@/lib/parser/po-pdf-parser";
import { getDriveFile } from "@/lib/sheets/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    // PDF uploads arrive as multipart/form-data (binary); HTML/Drive requests arrive as JSON.
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "File PDF tidak ditemukan" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parsePurchaseOrderPdf(buffer);
      return NextResponse.json({ parsed, fileName: file.name });
    }

    const body = await req.json();

    // Upload dari Google Drive: kita hanya diberi ID file-nya, isi filenya
    // diambil lewat Apps Script (jalan atas nama akun yang deploy Sheets).
    if (body.driveFileId) {
      const driveFile = await getDriveFile(body.driveFileId);
      const buffer = Buffer.from(driveFile.base64, "base64");
      const isPdf = driveFile.mimeType === "application/pdf" || /\.pdf$/i.test(driveFile.name);
      const isHtml = driveFile.mimeType.includes("html") || /\.html?$/i.test(driveFile.name);

      if (isPdf) {
        const parsed = await parsePurchaseOrderPdf(buffer);
        return NextResponse.json({ parsed, fileName: driveFile.name });
      }
      if (isHtml) {
        const parsed = parsePurchaseOrderHtml(buffer.toString("utf-8"));
        return NextResponse.json({ parsed, fileName: driveFile.name });
      }
      return NextResponse.json(
        { error: `Format file Drive tidak didukung (${driveFile.mimeType}). Gunakan .html atau .pdf.` },
        { status: 400 }
      );
    }

    const { html, fileName } = body;
    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "Isi file HTML tidak ditemukan" },
        { status: 400 }
      );
    }

    const parsed = parsePurchaseOrderHtml(html);

    return NextResponse.json({ parsed, fileName });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ? `Gagal memproses file PO: ${err.message}` : "Gagal memproses file PO" },
      { status: 500 }
    );
  }
}
