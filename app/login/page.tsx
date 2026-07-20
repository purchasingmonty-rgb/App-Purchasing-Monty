import { Boxes } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-subtle px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <Boxes size={20} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-lg font-semibold text-ink">
              Procurement Hub
            </h1>
            <p className="text-sm text-ink-muted">
              Masuk untuk mengelola Purchase Order perusahaan
            </p>
          </div>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-xs text-ink-muted">
          Belum bisa masuk? Hubungi admin Procurement Anda.
        </p>
      </div>
    </div>
  );
}
