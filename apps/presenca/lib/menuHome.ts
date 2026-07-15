export type DestinoId = "livro" | "pratica" | "escrever" | "conversar";

export type Destino = { id: DestinoId; rota: string | null; rotulo: string };

const DESTINOS: Record<DestinoId, Destino> = {
  livro: { id: "livro", rota: "/livro-vivo", rotulo: "uma página do livro" },
  pratica: { id: "pratica", rota: "/meditacao", rotulo: "uma prática" },
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
    case "meditacao":
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
