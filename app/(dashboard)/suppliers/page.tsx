import { Plus, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { mockSuppliers } from "@/lib/mock-data";

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Supplier</h1>
          <p className="text-sm text-ink-muted">Data seluruh supplier perusahaan</p>
        </div>
        <Button>
          <Plus size={16} />
          Tambah Supplier
        </Button>
      </div>

      <Card className="p-4">
        <input
          placeholder="Cari nama supplier, kode, atau kategori..."
          className="h-9 w-full max-w-sm rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockSuppliers.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-ink-muted">{s.code}</p>
                <h3 className="font-display text-[15px] font-semibold text-ink">
                  {s.name}
                </h3>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <p className="mt-2 text-sm text-ink-muted">{s.address}</p>
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-ink-muted">
                <Phone size={13} /> {s.phone}
              </p>
              <p className="flex items-center gap-2 text-ink-muted">
                <Mail size={13} /> {s.email}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-ink-muted">
              <span>Kategori: {s.category}</span>
              <span>Termin: {s.payment_term}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
