"use client";

import { useState, useTransition } from "react";
import { Plus, Phone, Mail, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { addSupplierAction, deleteSupplierAction } from "@/lib/actions";
import { formatDate } from "@/lib/utils";
import type { Supplier } from "@/lib/types";
import type { DerivedSupplierInfo } from "@/lib/sheets/repository";

export function SuppliersClient({
  initialData,
  derivedInfo,
}: {
  initialData: Supplier[];
  derivedInfo: DerivedSupplierInfo[];
}) {
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [prefill, setPrefill] = useState<{ name: string; address: string }>({ name: "", address: "" });
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Supplier yang terdeteksi dari PO/Master Barang tapi belum punya data lengkap manual.
  const manualNamesLower = new Set(initialData.map((s) => s.name.trim().toLowerCase()));
  const undocumented = derivedInfo.filter((d) => !manualNamesLower.has(d.name.trim().toLowerCase()));

  const filteredManual = initialData.filter(
    (s) => !q || [s.name, s.code, s.category].some((v) => (v || "").toLowerCase().includes(q.toLowerCase()))
  );
  const filteredUndocumented = undocumented.filter(
    (d) => !q || [d.name, d.address].some((v) => (v || "").toLowerCase().includes(q.toLowerCase()))
  );

  function handleDelete(id: string) {
    if (!confirm("Hapus supplier ini?")) return;
    startTransition(async () => {
      await deleteSupplierAction(id);
    });
  }

  function openAddModal(name = "", address = "") {
    setPrefill({ name, address });
    setShowModal(true);
  }

  function handleSubmit(formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      const result = await addSupplierAction(formData);
      if (result?.error) {
        setFormError(result.error);
        return;
      }
      setShowModal(false);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama, kode, kategori, atau alamat..."
          className="h-9 w-full max-w-sm rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />
        <Button onClick={() => openAddModal()}>
          <Plus size={16} />
          Tambah Supplier
        </Button>
      </div>

      {filteredManual.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredManual.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-ink-muted">{s.code}</div>
                  <h3 className="font-display text-[15px] font-semibold text-ink">{s.name}</h3>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <p className="mt-2 text-sm text-ink-muted">{s.address || "-"}</p>
              <div className="mt-3 space-y-1.5 text-sm">
                <p className="flex items-center gap-2 text-ink-muted"><Phone size={13} /> {s.phone || "-"}</p>
                <p className="flex items-center gap-2 text-ink-muted"><Mail size={13} /> {s.email || "-"}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-ink-muted">
                <span>{s.category || "-"}</span>
                <span>{s.payment_term || "-"}</span>
              </div>
              <div className="mt-2 text-right">
                <button onClick={() => handleDelete(s.id)} className="text-xs font-medium text-danger hover:underline">
                  Hapus
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredUndocumented.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-ink-muted">
            Terdeteksi dari Purchase Order / Master Barang -- belum ada data lengkap
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUndocumented.map((d) => (
              <Card key={d.name} className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-display text-[15px] font-semibold text-ink">{d.name}</h3>
                    <Badge tone="warning">Belum lengkap</Badge>
                  </div>
                  {d.address ? (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-muted">
                      <MapPin size={13} className="mt-0.5 shrink-0" /> {d.address}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-ink-muted">Alamat belum diketahui.</p>
                  )}
                  {d.lastPoNumber && (
                    <p className="mt-2 text-xs text-ink-muted">
                      Terakhir dipakai di PO <span className="text-primary">{d.lastPoNumber}</span>
                      {d.lastPoDate ? ` (${formatDate(d.lastPoDate)})` : ""}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-4"
                  onClick={() => openAddModal(d.name, d.address || "")}
                >
                  Lengkapi Data
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!filteredManual.length && !filteredUndocumented.length && (
        <Card className="p-10 text-center text-sm text-ink-muted">
          Belum ada supplier yang cocok. Klik &quot;Tambah Supplier&quot; untuk menambahkan.
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-semibold text-ink">
              {prefill.name ? `Lengkapi Data: ${prefill.name}` : "Tambah Supplier"}
            </h3>
            <form action={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field name="name" label="Nama Supplier" required defaultValue={prefill.name} />
              <Field name="code" label="Kode Supplier" placeholder="auto jika kosong" />
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-muted">Alamat</label>
                <textarea
                  name="address"
                  rows={2}
                  defaultValue={prefill.address}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                {prefill.address && (
                  <p className="mt-1 text-xs text-ink-muted">
                    Alamat ini diambil otomatis dari Purchase Order terakhir -- silakan cek/perbaiki kalau perlu.
                  </p>
                )}
              </div>
              <Field name="pic" label="PIC" />
              <Field name="phone" label="No. HP / WhatsApp" />
              <Field name="email" label="Email" />
              <Field name="category" label="Kategori" />
              <Field name="payment_term" label="Payment Term" placeholder="cth: Net 30" />
              <Field name="lead_time" label="Lead Time (hari)" type="number" />

              {formError && <p className="sm:col-span-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{formError}</p>}

              <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Simpan Supplier"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  name,
  label,
  required,
  placeholder,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-muted">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-9 w-full rounded-lg border border-border bg-bg px-3 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}
