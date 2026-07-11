/**
 * Contador de dias consecutivos de visita — só existe como gatilho interno
 * pra decidir quando convidar a pessoa a personalizar a experiência (dado
 * de nascimento, PRD §5). Nunca é mostrado como número/contador na
 * interface — isso seria gamificação, que a voz-de-marca (pilar 3) proíbe
 * explicitamente.
 */
function paraDataLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function atualizarStreak(
  streakAtual: number,
  streakAtualizadoEm: string | null,
  hoje: Date,
): { streak: number; atualizadoEm: string } {
  const hojeStr = paraDataLocal(hoje);
  if (streakAtualizadoEm === hojeStr) {
    // Já contamos uma visita hoje — não conta de novo a cada navegação.
    return { streak: streakAtual, atualizadoEm: hojeStr };
  }

  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (streakAtualizadoEm === paraDataLocal(ontem)) {
    return { streak: streakAtual + 1, atualizadoEm: hojeStr };
  }

  // Passou mais de um dia sem visitar (ou nunca visitou) — reinicia.
  return { streak: 1, atualizadoEm: hojeStr };
}
