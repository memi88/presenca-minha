import "server-only";

import { headers } from "next/headers";

import { getAuth } from "./auth";

/**
 * Sessão atual (Better Auth) — substitui `supabase.auth.getUser()` em
 * toda Server Action/Server Component. Devolve `null` sem sessão
 * nenhuma (nem anônima) — só acontece antes do primeiro acesso a
 * `/chegada`, que é quem cria a sessão anônima.
 *
 * `sessao.user.isAnonymous` distingue sessão anônima de conta real
 * (e-mail/senha ou Google) — usar isso onde o código antigo checava
 * implicitamente "tem e-mail confirmado?" via `user.email`.
 */
export async function getSessao() {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
}

export type Sessao = NonNullable<Awaited<ReturnType<typeof getSessao>>>;
