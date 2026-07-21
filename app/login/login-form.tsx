"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Card className="p-6">
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Password Tim
          </label>
          <input
            type="password"
            name="password"
            required
            autoFocus
            placeholder="Masukkan password bersama"
            className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Memproses..." : "Masuk"}
        </Button>
      </form>
    </Card>
  );
}
