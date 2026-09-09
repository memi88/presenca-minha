import "server-only";

import type { D1Database } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@presenca/db/db";

// Mesmo padrão de lib/auth.ts (e lib/llamaGuard.ts antes dele) — cada
// arquivo que usa um binding novo declara a própria fatia de
// CloudflareEnv, TypeScript funde tudo numa interface só.
declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }
}

/**
 * Cliente Drizzle pras tabelas de negócio (Fase 4) — montado por
 * requisição, nunca em module scope, mesmo motivo de `getAuth()`.
 */
export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  return createDb(env.DB);
}
