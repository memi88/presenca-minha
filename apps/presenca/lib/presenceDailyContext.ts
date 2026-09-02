import { buscarLenteGenerica, type DailyPresent } from "./present";

/**
 * Domínio intermediário entre o motor Presente e o resto do Presença
 * (seção 4 de `docs/integracao-presente-presenca.md`) — o chat/prática/
 * fechamento consomem isto, nunca o `DailyPresent` bruto direto. Hoje só
 * combina o estado de chegada (`profiles.presenca_hoje`) com a lente do
 * dia; `recent_relevant_context`/`authorized_care_context` ficam pra
 * quando existirem fontes reais, não são inventados agora (P4+).
 */
export type PresenceDailyContext = {
  arrivalState: string | null;
  dailyPresent: DailyPresent | null;
};

/** `dailyPresent: null` é resultado normal (motor Presente fora do ar, ou
 * `PRESENTE_SERVICE_URL` não configurada) — nunca lança. */
export async function montarPresenceDailyContext(arrivalState: string | null): Promise<PresenceDailyContext> {
  const dailyPresent = await buscarLenteGenerica();
  return { arrivalState, dailyPresent };
}
