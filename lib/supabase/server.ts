import { createClient } from "@supabase/supabase-js";

// Server-side Supabase instance using the service role key.
// NEVER import this file from a "use client" component -- the service role
// key bypasses Row Level Security and must stay on the server only.
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase server env vars belum diset. Lihat .env.local.example."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
