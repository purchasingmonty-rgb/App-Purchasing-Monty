import { createClient } from "@supabase/supabase-js";

// Client-side Supabase instance. Safe to use in "use client" components.
// Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// in your .env.local (see .env.local.example).
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars belum diset. Lihat .env.local.example dan README bagian Setup Supabase."
    );
  }

  return createClient(url, anonKey);
}
