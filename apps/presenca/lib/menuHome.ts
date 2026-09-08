// O check-in "como está sua presença hoje?" (Fase 6) já é o próprio nome da
// tag — mapeamento direto, sem vocabulário novo pra curadoria decorar.
// "nao_sei" não filtra nada (resposta neutra, sem sinal de momento). Usado
// pra priorizar itens da biblioteca com `tags_momento_vida` compatível —
// Livro Vivo (app/livro-vivo/page.tsx) e os blocos de destaque da Home.
export function tagDoMomento(presencaHoje: string | null): string | null {
  if (!presencaHoje || presencaHoje === "nao_sei") return null;
  return presencaHoje;
}

/** Reordena itens da biblioteca priorizando quem tem `tagsMomentoVida`
 * compatível com a tag do momento — nunca esconde, só prioriza (mesma
 * regra desde a Fase 7). CamelCase desde a Fase 4 (Drizzle) — os dois
 * callers (Home, Livro Vivo) já migraram, não precisa mais do adaptador
 * snake_case que o Livro Vivo usava enquanto a Home ainda era Supabase. */
export function ordenarPorMomento<T extends { tagsMomentoVida?: string[] | null }>(
  itens: T[],
  tag: string | null,
): T[] {
  if (!tag) return itens;
  return [...itens].sort((a, b) => {
    const aCombina = a.tagsMomentoVida?.includes(tag) ? 1 : 0;
    const bCombina = b.tagsMomentoVida?.includes(tag) ? 1 : 0;
    return bCombina - aCombina;
  });
}
