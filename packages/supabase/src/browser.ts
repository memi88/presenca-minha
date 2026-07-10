import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Client-side Supabase client. Uses only the public anon key — the anon key
 * is safe to ship to the browser by design; RLS policies (not key secrecy)
 * are what protect the data. Never import service_role here.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
