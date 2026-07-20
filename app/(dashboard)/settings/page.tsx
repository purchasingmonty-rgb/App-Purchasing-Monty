import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Setting</h1>
        <p className="text-sm text-ink-muted">Kelola akun, hak akses, dan preferensi aplikasi</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Saya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Nama Lengkap</label>
            <input defaultValue="Dewi Kusuma" className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-ink focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Email</label>
            <input defaultValue="dewi@perusahaan.com" disabled className="h-10 w-full rounded-lg border border-border bg-bg-subtle px-3 text-sm text-ink-muted" />
          </div>
          <Button size="sm">Simpan Perubahan</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hak Akses</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-ink-muted">
            Peran Anda saat ini: <span className="font-medium text-ink">Admin</span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Admin dapat mengelola data supplier, barang, PO, dan melihat audit log.
            User hanya dapat melihat dan mengunggah PO.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 text-sm text-ink-muted">
          Riwayat perubahan data (siapa mengubah apa, kapan) akan tampil di sini
          setelah aplikasi terhubung ke Supabase.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup Database</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between pt-2">
          <p className="text-sm text-ink-muted">Backup otomatis dikelola oleh Supabase (harian).</p>
          <Button variant="secondary" size="sm">Unduh Backup Manual</Button>
        </CardContent>
      </Card>
    </div>
  );
}
