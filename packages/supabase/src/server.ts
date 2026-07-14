import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions. Uses only the public anon key — the signed-in user's
 * session cookie is what elevates Postgres role from `anon` to
 * `authenticated` for RLS purposes, not an elevated API key. Never import
 * service_role here; admin-only writes (e.g. `biblioteca`) go through a
 * separate internal tool, not this app.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // `secure` não vem por padrão no @supabase/ssr — o Cloudflare já força
      // HTTPS antes de chegar aqui, mas isso adiciona a camada explícita.
      // `httpOnly` continua false (padrão da lib): o client de navegador
      // (browser.ts) precisa ler esse cookie via JS pro fluxo de entrada
      // anônima funcionar.
      cookieOptions: { secure: true },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component that can't set cookies (no
            // active response) — safe to ignore when middleware also
            // refreshes the session.
          }
        },
      },
    },
  );
}
