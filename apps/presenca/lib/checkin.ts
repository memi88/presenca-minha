const DOZE_HORAS_MS = 12 * 60 * 60 * 1000;

/**
 * O humor do check-in ("como está sua presença hoje?") não fica fresco pra
 * sempre — depois de 12h para de fazer sentido como sinal pra reduzir a tela
 * no estado "confuso" (`reduzido` em app/home/page.tsx). O gatilho em si
 * (MoodTrigger) fica sempre disponível — este check só afeta esse sinal
 * secundário, não se o modal aparece.
 */
export function precisaCheckin(presencaHojeEm: string | null): boolean {
  if (!presencaHojeEm) return true;
  return Date.now() - new Date(presencaHojeEm).getTime() > DOZE_HORAS_MS;
}
