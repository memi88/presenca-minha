export type DestinoId = "livro" | "pratica" | "escrever" | "conversar";

export type Destino = { id: DestinoId; rota: string | null; rotulo: string };

const DESTINOS: Record<DestinoId, Destino> = {
  livro: { id: "livro", rota: "/livro-vivo", rotulo: "uma página do livro" },
  pratica: { id: "pratica", rota: "/praticas", rotulo: "uma prática" },
  escrever: { id: "escrever", rota: "/diario", rotulo: "escrever algo" },
  conversar: { id: "conversar", rota: "/conversa", rotulo: "conversar" },
};

const ORDEM_CURIOSO: DestinoId[] = ["livro", "pratica", "escrever", "conversar"];
const ORDEM_CANSADO: DestinoId[] = ["pratica", "livro", "conversar", "escrever"];

/**
 * Ordem dos 4 destinos logo depois do check-in, pelo humor respondido.
 * Curioso/Em paz têm ordem explícita; Não sei responder usa a mesma de
 * Curioso (neutro) e Confuso usa a mesma de Cansado (prática primeiro,
 * mais aterrador) — são as duas únicas suposições não confirmadas.
 */
export function ordemPorMood(mood: string | null): DestinoId[] {
  if (mood === "cansado" || mood === "confuso") return ORDEM_CANSADO;
  return ORDEM_CURIOSO;
}

/** Coloca um destino na frente dos outros 3 (ordem de Curioso pro resto). */
export function ordemComDestaque(destaqueId: DestinoId | null): DestinoId[] {
  if (!destaqueId) return ORDEM_CURIOSO;
  return [destaqueId, ...ORDEM_CURIOSO.filter((id) => id !== destaqueId)];
}

export function listaDestinos(ids: DestinoId[]): Destino[] {
  return ids.map((id) => DESTINOS[id]);
}

/** `profiles.ultimo_destino` usa os nomes das rotas; o menu usa nomes de
 * conceito (a "prática" pode não ser sempre o Fôlego, por exemplo) — essa
 * função é a ponte entre os dois vocabulários. */
export function destinoIdDeUltimoDestino(ultimoDestino: string | null): DestinoId | null {
  switch (ultimoDestino) {
    case "livro_vivo":
      return "livro";
    case "diario":
      return "escrever";
    case "folego":
    case "meditacao": // valor legado, gravado antes da rota virar /praticas
    case "praticas":
      return "pratica";
    case "conversa":
      return "conversar";
    default:
      return null;
  }
}

export const HEADLINE_MOOD = "Há outros lugares por onde você pode caminhar.";
export const HEADLINE_RETOMADA = "Tem uma pergunta te esperando no seu diário.";
export const HEADLINE_CONTINUAR = "Continue de onde você parou.";
export const HEADLINE_CONTINUAR_SEM_HISTORICO = "Por onde você quer seguir?";

// O check-in "como está sua presença hoje?" (Fase 6) já é o próprio nome da
// tag — mapeamento direto, sem vocabulário novo pra curadoria decorar.
// "nao_sei" não filtra nada (resposta neutra, sem sinal de momento). Usado
// pra priorizar itens da biblioteca com `tags_momento_vida` compatível —
// Livro Vivo (app/livro-vivo/page.tsx) e os blocos de destaque da Home.
export function tagDoMomento(presencaHoje: string | null): string | null {
  if (!presencaHoje || presencaHoje === "nao_sei") return null;
  return presencaHoje;
}

/** Reordena itens da biblioteca priorizando quem tem `tags_momento_vida`
 * compatível com a tag do momento — nunca esconde, só prioriza (mesma
 * regra desde a Fase 7). */
export function ordenarPorMomento<T extends { tags_momento_vida?: string[] | null }>(
  itens: T[],
  tag: string | null,
): T[] {
  if (!tag) return itens;
  return [...itens].sort((a, b) => {
    const aCombina = a.tags_momento_vida?.includes(tag) ? 1 : 0;
    const bCombina = b.tags_momento_vida?.includes(tag) ? 1 : 0;
    return bCombina - aCombina;
  });
}
