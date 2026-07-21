import { NextRequest, NextResponse } from "next/server";
import { parsePurchaseOrderHtml } from "@/lib/parser/po-html-parser";
import { parsePurchaseOrderPdf } from "@/lib/parser/po-pdf-parser";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    // PDF uploads arrive as multipart/form-data (binary); HTML arrives as JSON text.
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

    const { html, fileName } = await req.json();
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
