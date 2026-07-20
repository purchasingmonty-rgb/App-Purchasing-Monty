"use client";

import { Search, Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-surface px-5">
      <div className="relative flex-1 max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="text"
          placeholder="Cari No. PO, supplier, barang, project..."
          className="h-9 w-full rounded-lg border border-border bg-bg-subtle pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:bg-surface focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="Ganti tema"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-bg-subtle hover:text-ink"
        >
          {mounted && theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button
          aria-label="Notifikasi"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-bg-subtle hover:text-ink"
        >
          <Bell size={17} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
          DK
        </div>
      </div>
    </header>
  );
}
