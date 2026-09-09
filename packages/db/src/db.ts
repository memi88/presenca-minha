import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";

import { schema } from "./schema";

/**
 * Cliente Drizzle pras tabelas de negócio (Fase 2), compartilhado entre
 * Presença e Cuida — cada app chama isso a partir do próprio
 * `lib/db.ts` (que resolve o binding `env.DB` via `getCloudflareContext()`,
 * só existe dentro de uma requisição real do Worker, mesmo padrão de
 * `createAuth()` em `auth.ts`).
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Db = ReturnType<typeof createDb>;
