import "server-only";

import { sql } from "drizzle-orm";
import type { Db } from "@presenca/db/db";
import { conversaRateLimit, embeddingRateLimit } from "@presenca/db/schema";

/**
 * Rate limit por usuário pras chamadas de embedding (Server Actions/Route
 * Handlers) — reimplementa a RPC `pode_calcular_embedding` do Supabase
 * (ver supabase/migrations/20260712235620_rate_limit_embedding.sql) como
 * um único `insert ... on conflict do update ... returning`. Complementa
 * o limite por IP que já existe em services/ia (por trás do mesmo
 * Cloudflare/NAT, IP não distingue usuários).
 *
 * Sem transação explícita — D1 não tem o equivalente ao upsert atômico
 * numa função `security invoker` do Postgres, mas um INSERT/UPDATE via
 * SQLite já é atômico por statement; o único risco residual é corrida
 * entre 2 requisições concorrentes do MESMO usuário lendo/escrevendo a
 * mesma janela ao mesmo tempo — aceito de propósito (ver plano da
 * migração Supabase→Cloudflare), volume baixo demais pra justificar mais
 * complexidade agora.
 *
 * Se a própria checagem falhar, libera — mesmo espírito de
 * `lib/embed.ts`: infra auxiliar não deveria travar a escrita de quem
 * está usando o app.
 */
export async function podeCalcularEmbedding(
  db: Db,
  userId: string,
  limite = 20,
  janelaSegundos = 600,
): Promise<boolean> {
  try {
    const agora = Date.now();
    const limiteJanela = agora - janelaSegundos * 1000;
    const [linha] = await db
      .insert(embeddingRateLimit)
      .values({ userId, janelaInicio: new Date(agora), contagem: 1 })
      .onConflictDoUpdate({
        target: embeddingRateLimit.userId,
        set: {
          janelaInicio: sql`case when ${embeddingRateLimit.janelaInicio} < ${limiteJanela} then ${agora} else ${embeddingRateLimit.janelaInicio} end`,
          contagem: sql`case when ${embeddingRateLimit.janelaInicio} < ${limiteJanela} then 1 else ${embeddingRateLimit.contagem} + 1 end`,
        },
      })
      .returning({ contagem: embeddingRateLimit.contagem });
    return (linha?.contagem ?? 0) <= limite;
  } catch (erro) {
    console.error("podeCalcularEmbedding: falha ao checar rate limit", erro);
    return true;
  }
}

/**
 * Rate limit por usuário nas chamadas de conversa (Claude Sonnet 5) —
 * reimplementa a RPC `pode_conversar` (ver
 * supabase/migrations/20260715150000_rate_limit_conversa.sql). Mesmo
 * espírito gracioso de `podeCalcularEmbedding` (libera se a própria
 * checagem falhar, pra não travar quem está usando o app por causa de
 * infra auxiliar) — mas aqui a consequência de liberar demais é bem mais
 * cara por chamada (LLM de conversa, não embedding), então essa é uma
 * escolha deliberada, não um padrão copiado sem pensar: vale revisitar
 * pra fail-closed se o volume real do piloto mostrar abuso.
 */
export async function podeConversar(
  db: Db,
  userId: string,
  limite = 40,
  janelaSegundos = 600,
): Promise<boolean> {
  try {
    const agora = Date.now();
    const limiteJanela = agora - janelaSegundos * 1000;
    const [linha] = await db
      .insert(conversaRateLimit)
      .values({ userId, janelaInicio: new Date(agora), contagem: 1 })
      .onConflictDoUpdate({
        target: conversaRateLimit.userId,
        set: {
          janelaInicio: sql`case when ${conversaRateLimit.janelaInicio} < ${limiteJanela} then ${agora} else ${conversaRateLimit.janelaInicio} end`,
          contagem: sql`case when ${conversaRateLimit.janelaInicio} < ${limiteJanela} then 1 else ${conversaRateLimit.contagem} + 1 end`,
        },
      })
      .returning({ contagem: conversaRateLimit.contagem });
    return (linha?.contagem ?? 0) <= limite;
  } catch (erro) {
    console.error("podeConversar: falha ao checar rate limit", erro);
    return true;
  }
}
