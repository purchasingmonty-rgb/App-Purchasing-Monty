"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink hover:bg-bg-subtle disabled:opacity-50"
    >
      <LogOut size={14} />
      {pending ? "Keluar..." : "Keluar"}
    </button>
  );
}
