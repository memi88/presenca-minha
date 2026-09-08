import "server-only";

import { sql } from "drizzle-orm";
import type { Db } from "@presenca/db/db";
import { embeddingRateLimit } from "@presenca/db/schema";

/**
 * Rate limit por usuário pras chamadas de embedding (Server Actions) —
 * reimplementa a RPC `pode_calcular_embedding` do Supabase (ver
 * apps/presenca/lib/rateLimit.ts — mesmo D1, mesma tabela, mesmo padrão)
 * como um único `insert ... on conflict do update ... returning`.
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
