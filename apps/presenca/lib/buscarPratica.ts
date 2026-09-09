import "server-only";

import { and, eq, isNotNull } from "drizzle-orm";
import type { Db } from "@presenca/db/db";
import { biblioteca } from "@presenca/db/schema";

import { calcularEmbedding } from "@/lib/embed";
import { podeCalcularEmbedding } from "@/lib/rateLimit";
import { distanciaCosseno } from "@/lib/similaridade";

export type CandidatoPratica = {
  id: string;
  titulo: string | null;
  conteudo: string;
  origin: string | null;
  slug: string | null;
  distancia: number;
};

const DISTANCIA_MAXIMA = 0.5;
const LIMITE_CANDIDATOS = 3;

/**
 * P5 Fase A — busca prática relevante pra uma situação descrita em texto
 * livre (o argumento `situacao` da tool sugerir_pratica). Fail-open: sem
 * embedding calculável (serviço fora do ar, rate limit) ou sem candidato
 * dentro do limiar, devolve array vazio — a tool sempre retorna algo
 * válido pro modelo, nunca lança.
 *
 * Reimplementa a RPC `buscar_pratica_relevante` (ver
 * supabase/migrations/20260904134111_p5_biblioteca_origin.sql) em
 * memória, mesmo padrão de `lib/conexaoCaderno.ts`: busca candidatas já
 * filtradas por SQL (`tipo = 'pratica'`, `publicado`, `origin` não nulo —
 * "conteúdo sem origin não entra no pool", ver a migration), calcula a
 * distância de cosseno de cada uma em JS e devolve as 3 mais próximas
 * dentro do limiar, ordenadas.
 */
export async function buscarPraticaRelevante(
  db: Db,
  userId: string,
  situacao: string,
): Promise<CandidatoPratica[]> {
  const permitido = await podeCalcularEmbedding(db, userId);
  const embedding = permitido ? await calcularEmbedding(situacao, "query") : null;
  if (!embedding) return [];

  const candidatas = await db.query.biblioteca.findMany({
    where: and(
      eq(biblioteca.tipo, "pratica"),
      eq(biblioteca.publicado, true),
      isNotNull(biblioteca.origin),
      isNotNull(biblioteca.embedding),
    ),
    columns: { id: true, titulo: true, conteudo: true, origin: true, slug: true, embedding: true },
  });

  const comDistancia: CandidatoPratica[] = [];
  for (const candidata of candidatas) {
    if (!candidata.embedding) continue;
    const distancia = distanciaCosseno(embedding, candidata.embedding);
    if (distancia <= DISTANCIA_MAXIMA) {
      comDistancia.push({
        id: candidata.id,
        titulo: candidata.titulo,
        conteudo: candidata.conteudo,
        origin: candidata.origin,
        slug: candidata.slug,
        distancia,
      });
    }
  }

  return comDistancia.sort((a, b) => a.distancia - b.distancia).slice(0, LIMITE_CANDIDATOS);
}
