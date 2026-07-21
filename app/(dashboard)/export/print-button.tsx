"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex w-full flex-col items-center gap-2 rounded-lg border border-border p-4 text-sm font-medium text-ink hover:border-primary hover:bg-primary-soft hover:text-primary"
    >
      <Printer size={20} />
      Print Halaman Ini
    </button>
  );
}
