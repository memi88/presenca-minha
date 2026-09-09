import "server-only";

import type { D1Database } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@presenca/db/db";

// Mesmo D1 do Presença — ver lib/auth.ts.
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
