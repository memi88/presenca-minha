// Vocabulário de momento/humor usado em `biblioteca.tags_momento_vida` —
// mesmos 4 valores do check-in da Home (MoodTrigger.tsx), sem "nao_sei"
// (que lá também não filtra nada, ver tagDoMomento em lib/menuHome.ts).
// Usado pro filtro do acervo do Livro Vivo (docs/redesign/
// acervo_do_livro_vivo_atmosfera_quarto) — os rótulos do mockup ("quando
// tudo parece confuso" etc.) eram só exemplo do Stitch, a taxonomia real
// é essa, a mesma que a pessoa já respondeu no check-in.
export const MOMENTOS_VIDA = [
  { valor: "confuso", rotulo: "Confuso" },
  { valor: "em_paz", rotulo: "Em paz" },
  { valor: "cansado", rotulo: "Cansado" },
  { valor: "curioso", rotulo: "Curioso" },
] as const;

export type MomentoVida = (typeof MOMENTOS_VIDA)[number]["valor"];

// Valida um `?momento=` de query string contra a taxonomia real — usado
// tanto pelo acervo (app/livro-vivo/page.tsx, pra filtrar) quanto pelo
// detalhe (app/livro-vivo/[id]/page.tsx, só pra repassar no link de
// voltar e preservar o filtro ativo ao entrar numa leitura e voltar).
export function momentoValido(momento: string | undefined): MomentoVida | null {
  return (MOMENTOS_VIDA.find((m) => m.valor === momento)?.valor as MomentoVida | undefined) ?? null;
}
