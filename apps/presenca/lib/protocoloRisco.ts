export type DecisaoProtocoloRisco = { forcarRecursos: boolean; log: string | null };

/**
 * Combina o sinal do Sonnet (tool `sinalizar_risco`, já processado no
 * momento em que isso é chamado) com o do Llama Guard 3 e decide o que
 * fazer, conforme item 5.1 de `docs/integracao-presente-presenca-
 * decisoes.md`: Llama sinalizando risco força Recursos mesmo que o Sonnet
 * não tenha sinalizado (dois caminhos independentes pro mesmo destino);
 * qualquer desacordo (nas duas direções) vira log, sem ação além do
 * registro; concordância não gera log.
 *
 * Função pura, sem I/O — por isso vive fora de `lib/llamaGuard.ts`
 * (`server-only`, que só pode ser importado dentro do runtime do Next.js):
 * é o que permite testar as 4 combinações direto via `tsx`, sem mockar
 * Anthropic nem Workers AI (ver `scripts/testar-protocolo-risco.ts`).
 */
export function decidirProtocoloRisco(
  riscoSinalizadoPeloSonnet: boolean,
  llamaSinalizouRisco: boolean,
): DecisaoProtocoloRisco {
  if (llamaSinalizouRisco && !riscoSinalizadoPeloSonnet) {
    return {
      forcarRecursos: true,
      log: "conversa: Llama Guard sinalizou risco que o Sonnet não sinalizou — forçando Recursos",
    };
  }
  if (!llamaSinalizouRisco && riscoSinalizadoPeloSonnet) {
    return {
      forcarRecursos: false,
      log: "conversa: Sonnet sinalizou risco que o Llama Guard não sinalizou (Recursos já acionado)",
    };
  }
  return { forcarRecursos: false, log: null };
}
