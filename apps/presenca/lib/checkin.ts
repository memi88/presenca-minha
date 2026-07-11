const DOZE_HORAS_MS = 12 * 60 * 60 * 1000;
const DOIS_DIAS_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * O humor do check-in ("como está sua presença hoje?") não fica fresco pra
 * sempre — depois de um tempo ele para de fazer sentido como sinal pra
 * ordenar o menu da Home (`lib/menuHome.ts`). 12h é um proxy simples pra
 * "outro momento do dia", sem entrar em fuso horário / dia de calendário.
 * Não decide mais se a pessoa cai no check-in — isso é `precisaVisitaCheckin`.
 */
export function precisaCheckin(presencaHojeEm: string | null): boolean {
  if (!presencaHojeEm) return true;
  return Date.now() - new Date(presencaHojeEm).getTime() > DOZE_HORAS_MS;
}

/**
 * Decide se a Home redireciona pro check-in (`/hoje`) — agora baseado em
 * quanto tempo faz desde a última *visita* (não desde a última resposta de
 * humor). Quem visita todo dia nunca cai aqui, mesmo que o humor de ontem
 * já tenha "esfriado" — nesse caso a Home usa "continue de onde você
 * parou" em vez de perguntar de novo.
 */
export function precisaVisitaCheckin(ultimaVisitaEm: string | null): boolean {
  if (!ultimaVisitaEm) return true;
  return Date.now() - new Date(ultimaVisitaEm).getTime() >= DOIS_DIAS_MS;
}
