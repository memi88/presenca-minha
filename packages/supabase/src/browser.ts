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
    // `secure` não vem por padrão no @supabase/ssr — precisa bater com a
    // mesma opção do client de servidor (server.ts), senão os dois client
    // não concordam sobre o cookie.
    { cookieOptions: { secure: true } },
  );
}
