import "server-only";

import { and, eq, isNotNull, ne, or } from "drizzle-orm";
import type { Db } from "@presenca/db/db";
import { cadernoEntradas } from "@presenca/db/schema";

import { calcularEmbedding } from "@/lib/embed";
import { podeCalcularEmbedding } from "@/lib/rateLimit";
import { distanciaCosseno } from "@/lib/similaridade";

/**
 * "A IA percebe conexões" (presenca-ia-arquitetura.md §5) — usado por
 * Diário, Conversa e Fechamento (3 chamadores, mesma lógica). Único lugar
 * que decide o que vira `conexaoConteudo` — quem manda pra cá é quem
 * controla a superfície de privacidade de "isso conecta com algo que você
 * guardou".
 *
 * Roda depois da resposta (services/ia pode levar vários segundos) —
 * chamar sempre via `ctx.waitUntil(...)` no caller, nunca com `await`
 * direto na Server Action. Não chama `revalidatePath` aqui — isso é
 * responsabilidade de cada caller (só quem lista a entrada em algum lugar
 * precisa revalidar; `/fechamento`, por exemplo, não precisa).
 *
 * Reimplementa a RPC `buscar_conexao_caderno` (ver
 * supabase/migrations/20260901163707_p7_fechamento_nunca_citado.sql,
 * versão final da função — pgvector `<=>`) em memória: busca as
 * candidatas já filtradas por SQL, calcula a distância de cosseno de cada
 * uma em JS (`lib/similaridade.ts`) e fica com a mais próxima dentro do
 * limiar. Réplica exata dos mesmos filtros da RPC, incluindo a exclusão
 * de `tipo = 'fechamento_dia'` (P7 — nunca é o lado citado de uma
 * conexão, mesmo quando ela mesma está buscando).
 */
export async function processarConexaoEntrada(
  db: Db,
  userId: string,
  pacienteId: string,
  entradaId: string,
  conteudo: string,
) {
  const permitido = await podeCalcularEmbedding(db, userId);
  const embedding = permitido ? await calcularEmbedding(conteudo, "passage") : null;
  if (!embedding) return;

  const candidatas = await db.query.cadernoEntradas.findMany({
    where: and(
      eq(cadernoEntradas.pacienteId, pacienteId),
      isNotNull(cadernoEntradas.embedding),
      ne(cadernoEntradas.id, entradaId),
      ne(cadernoEntradas.tipo, "fechamento_dia"),
      or(
        and(eq(cadernoEntradas.autorTipo, "profissional"), eq(cadernoEntradas.tipo, "pergunta")),
        eq(cadernoEntradas.revisitar, true),
      ),
    ),
    columns: { conteudo: true, embedding: true },
  });

  const DISTANCIA_MAXIMA = 0.5;
  let melhor: { conteudo: string; distancia: number } | null = null;
  for (const candidata of candidatas) {
    if (!candidata.embedding) continue;
    const distancia = distanciaCosseno(embedding, candidata.embedding);
    if (distancia <= DISTANCIA_MAXIMA && (!melhor || distancia < melhor.distancia)) {
      melhor = { conteudo: candidata.conteudo, distancia };
    }
  }

  await db
    .update(cadernoEntradas)
    .set({ embedding, conexaoConteudo: melhor?.conteudo ?? null })
    .where(eq(cadernoEntradas.id, entradaId));
}
