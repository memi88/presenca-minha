import { and, eq } from "drizzle-orm";

import { experienciasEtapas, experienciasInstancias } from "./business.schema";
import type { Db } from "./db";

/**
 * Compartilhado entre Presença (`responderEtapa`, avança sozinho quando a
 * etapa não é compartilhada) e Cuida (`liberarProximaEtapa`, o
 * especialista decide quando avançar uma etapa compartilhada) — mesma
 * regra de "qual é a próxima etapa" nos dois lados: ramificação por
 * resposta (só faz sentido com `tipoResposta='escolha'`; sem
 * `ramificacoes` ou resposta em texto, cai no próximo `ordem`), ou
 * conclusão da instância se não houver mais etapa.
 */
export async function avancarEtapa(
  db: Db,
  instanciaId: string,
  etapaAtual: { id: string; experienciaId: string; ordem: number; ramificacoes: Record<string, string> | null },
  respostaEscolha?: string,
) {
  const proximaEtapaId = respostaEscolha ? etapaAtual.ramificacoes?.[respostaEscolha] : undefined;

  const proximaEtapa = proximaEtapaId
    ? await db.query.experienciasEtapas.findFirst({ where: eq(experienciasEtapas.id, proximaEtapaId) })
    : await db.query.experienciasEtapas.findFirst({
        where: and(
          eq(experienciasEtapas.experienciaId, etapaAtual.experienciaId),
          eq(experienciasEtapas.ordem, etapaAtual.ordem + 1),
        ),
      });

  if (proximaEtapa) {
    await db
      .update(experienciasInstancias)
      .set({ etapaAtualId: proximaEtapa.id, estado: "em_andamento" })
      .where(eq(experienciasInstancias.id, instanciaId));
  } else {
    await db
      .update(experienciasInstancias)
      .set({ estado: "concluida", concluidoEm: new Date() })
      .where(eq(experienciasInstancias.id, instanciaId));
  }
}
