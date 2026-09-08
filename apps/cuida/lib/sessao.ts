import "server-only";

import { headers } from "next/headers";

import { getAuth } from "./auth";

/**
 * Sessão atual (Better Auth) — substitui `supabase.auth.getUser()` em
 * toda Server Action/Server Component. Ver apps/presenca/lib/sessao.ts
 * (mesmo D1, mesma tabela de usuário).
 */
export async function getSessao() {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
}

export type Sessao = NonNullable<Awaited<ReturnType<typeof getSessao>>>;
