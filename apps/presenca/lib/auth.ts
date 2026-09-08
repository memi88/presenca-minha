import "server-only";

import type { D1Database } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@presenca/db";

// Mesmo padrão de lib/llamaGuard.ts — cada arquivo que usa um binding
// novo declara a própria fatia de CloudflareEnv (TypeScript funde tudo
// numa interface só).
declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }
}

/**
 * Instância do Better Auth desta app — montada por requisição, nunca em
 * module scope (o binding D1 só existe dentro do Worker, via
 * `getCloudflareContext()`). Chamada pelo Route Handler
 * (`app/api/auth/[...all]/route.ts`) e por qualquer Server Action que
 * precise ler a sessão atual direto do Better Auth.
 */
export async function getAuth(baseURL?: string) {
  const { env } = await getCloudflareContext({ async: true });
  return createAuth(
    {
      DB: env.DB,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    },
    baseURL,
  );
}
