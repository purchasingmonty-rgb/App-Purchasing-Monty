"use client";

import { useCallback, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ParsedPO } from "@/lib/parser/po-html-parser";

export default function UploadPOPage() {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedPO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setParsed(null);
    setFileName(file.name);

    const isHtml = file.type === "text/html" || file.name.endsWith(".html");
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

    if (!isHtml && !isPdf) {
      setError("Format tidak didukung. Gunakan file .html atau .pdf.");
      return;
    }

    setLoading(true);
    try {
      let res: Response;
      if (isPdf) {
        const form = new FormData();
        form.append("file", file);
        res = await fetch("/api/parse-po", { method: "POST", body: form });
      } else {
        const text = await file.text();
        res = await fetch("/api/parse-po", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html: text, fileName: file.name }),
        });
      }
      if (!res.ok) throw new Error("Gagal membaca file PO");
      const data = await res.json();
      setParsed(data.parsed);
    } catch (err: any) {
      setError(err.message ?? "Terjadi kesalahan saat membaca file");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">
          Upload Purchase Order
        </h1>
        <p className="text-sm text-ink-muted">
          Unggah file PO (HTML) yang sudah Anda buat — datanya akan dibaca otomatis
        </p>
      </div>

      <Card
        className={`border-2 border-dashed p-10 text-center transition-colors ${
          dragActive ? "border-primary bg-primary-soft" : "border-border"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <UploadCloud size={22} />
        </div>
        <p className="mt-3 text-sm font-medium text-ink">
          Tarik & letakkan file PO di sini, atau
        </p>
        <label className="mt-3 inline-block cursor-pointer">
          <span className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:opacity-90">
            Pilih File
          </span>
          <input
            type="file"
            accept=".html,.htm,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
        <p className="mt-2 text-xs text-ink-muted">Mendukung: .html, .pdf (Excel segera hadir)</p>
      </Card>

      {fileName && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-ink-muted" />
            <span className="text-sm text-ink">{fileName}</span>
            {loading && <span className="text-xs text-ink-muted">Membaca file...</span>}
            {!loading && parsed && (
              <span className="ml-auto flex items-center gap-1 text-xs font-medium text-success">
                <CheckCircle2 size={14} /> Berhasil dibaca
              </span>
            )}
            {!loading && error && (
              <span className="ml-auto flex items-center gap-1 text-xs font-medium text-danger">
                <AlertCircle size={14} /> {error}
              </span>
            )}
          </div>
        </Card>
      )}

      {parsed && (
        <Card>
          <CardHeader>
            <CardTitle>Pratinjau Data Terbaca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="No. PO" value={parsed.poNumber} />
              <Field label="Tanggal PO" value={parsed.poDate} />
              <Field label="Delivery Deadline" value={parsed.deliveryDeadline} />
              <Field label="Termin Pembayaran" value={parsed.paymentTerm} />
              <Field label="Buyer (Perusahaan)" value={parsed.buyerName} />
              <Field label="Supplier" value={parsed.supplierName} />
              <Field label="Ship To" value={parsed.shipName} />
              <Field label="Mata Uang" value={parsed.currency} />
              <Field label="Requester" value={parsed.requester} />
              <Field label="Project" value={parsed.project} />
            </div>

            <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
              Field <strong>Requester</strong> dan <strong>Project</strong> tidak ada di
              template PO ini — silakan isi manual setelah data tersimpan.
            </p>

            {parsed.items.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-subtle text-left text-xs text-ink-muted">
                      <th className="px-3 py-2 font-medium">Item</th>
                      <th className="px-3 py-2 font-medium text-right">Qty</th>
                      <th className="px-3 py-2 font-medium">Satuan</th>
                      <th className="px-3 py-2 font-medium text-right">Harga</th>
                      <th className="px-3 py-2 font-medium text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.items.map((item, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 text-ink">{item.itemName}</td>
                        <td className="figure px-3 py-2 text-right">{item.qty}</td>
                        <td className="px-3 py-2 text-ink-muted">{item.unit ?? "-"}</td>
                        <td className="figure px-3 py-2 text-right">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="figure px-3 py-2 text-right">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {parsed.grandTotal != null && (
              <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
                <SummaryRow label="Subtotal" value={parsed.subtotal} />
                {parsed.discountAmount != null && (
                  <SummaryRow label={parsed.discountLabel ?? "Diskon"} value={-parsed.discountAmount} />
                )}
                {parsed.cashDiscountAmount != null && (
                  <SummaryRow label="Diskon Cash" value={-parsed.cashDiscountAmount} />
                )}
                {parsed.ppn != null && (
                  <SummaryRow label={parsed.ppnLabel ?? "PPN"} value={parsed.ppn} />
                )}
                <div className="flex justify-between border-t border-border pt-1 font-semibold text-ink">
                  <span>Grand Total</span>
                  <span className="figure">{formatCurrency(parsed.grandTotal)}</span>
                </div>
              </div>
            )}

            {parsed.terbilang && (
              <p className="text-right text-xs italic text-ink-muted">
                Terbilang: {parsed.terbilang}
              </p>
            )}

            {parsed.terms.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-ink-muted">
                  Syarat &amp; Ketentuan Pembelian
                </p>
                <ol className="list-decimal space-y-0.5 pl-4 text-xs text-ink-muted">
                  {parsed.terms.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ol>
              </div>
            )}

            <p className="rounded-lg bg-primary-soft px-3 py-2 text-xs text-primary">
              Parser sudah disesuaikan presisi dengan struktur PO Generator Anda,
              baik untuk file HTML (struktur #po-preview) maupun PDF hasil
              &quot;Download PDF&quot; (dibaca berdasarkan posisi teks asli).
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="secondary">Edit Manual</Button>
              <Button>Simpan ke Database</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value ?? "—"}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  return (
    <div className="flex justify-between text-ink-muted">
      <span>{label}</span>
      <span className="figure">{formatCurrency(value)}</span>
    </div>
  );
}
