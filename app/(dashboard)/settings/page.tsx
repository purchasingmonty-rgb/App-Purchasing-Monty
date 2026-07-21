import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSuppliers, getPurchaseOrders } from "@/lib/sheets/repository";
import { LogoutButton } from "./logout-button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [suppliers, pos] = await Promise.all([getSuppliers(), getPurchaseOrders()]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Setting</h1>
          <p className="text-sm text-ink-muted">Kelola akses & lihat ringkasan data aplikasi</p>
        </div>
        <LogoutButton />
      </div>

      <Card>
        <CardHeader><CardTitle>Ringkasan Data</CardTitle></CardHeader>
        <CardContent className="pt-2 text-sm">
          <p>Purchase Order tersimpan: <strong className="figure">{pos.length}</strong></p>
          <p className="mt-1">Supplier tersimpan: <strong className="figure">{suppliers.length}</strong></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Akses Tim</CardTitle></CardHeader>
        <CardContent className="pt-2 text-sm text-ink-muted">
          Aplikasi ini memakai 1 password bersama untuk seluruh tim (bukan akun per orang).
          Untuk mengganti password, ubah nilai <code className="rounded bg-bg-subtle px-1 py-0.5 text-xs">APP_PASSWORD</code> di
          Environment Variables Vercel, lalu redeploy.
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sumber Data</CardTitle></CardHeader>
        <CardContent className="pt-2 text-sm text-ink-muted">
          Seluruh data (Purchase Order & Supplier) disimpan di Google Sheets, dan bisa
          dibuka/diedit langsung lewat browser seperti spreadsheet biasa. Perubahan manual
          di Sheets akan langsung terlihat di aplikasi ini saat halaman dimuat ulang.
        </CardContent>
      </Card>
    </div>
  );
}
