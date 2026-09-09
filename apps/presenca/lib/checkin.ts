// Início do dia civil em America/Sao_Paulo, como instante ISO — Brasil não
// usa horário de verão desde 2019, então o offset fixo "-03:00" já resolve
// certo o instante. Mesmo cálculo duplicado em app/home/page.tsx (helper
// pequeno, mesmo padrão de trecho()/dataCivilHoje() usado em outros
// lugares do projeto — não vale um import cruzado só por isso).
function inicioDoDiaSaoPauloISO(): string {
  const dataSaoPaulo = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  return `${dataSaoPaulo}T00:00:00-03:00`;
}

/**
 * O humor ("como está sua presença hoje?") reseta na virada do dia civil
 * em America/Sao_Paulo — nunca fica valendo pra sempre (pedido do
 * Guilherme, 09/09/2026). Substitui a janela rolante de 12h que existia
 * antes (`precisaCheckin`): mais simples, e corresponde à expectativa de
 * "resposta de hoje", não um timer que soma horas.
 *
 * O valor cru (`presencaHoje`/`presencaHojeEm`) nunca é apagado do banco
 * — isto só decide se ele ainda conta como resposta válida pra exibir/
 * usar em curadoria; o histórico continua intacto.
 */
export function presencaHojeValida(presencaHoje: string | null, presencaHojeEm: Date | null): string | null {
  if (!presencaHoje || !presencaHojeEm) return null;
  return presencaHojeEm >= new Date(inicioDoDiaSaoPauloISO()) ? presencaHoje : null;
}
