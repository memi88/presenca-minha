// Taxonomia de categoria de prática (migration biblioteca_categoria_pratica)
// — mesma lista espelhada em apps/presenca/lib/categoriasPratica.ts, que é
// quem lê pra filtrar. Só se aplica quando tipo = "pratica".
export const CATEGORIAS_PRATICA = [
  { valor: "respiracao", rotulo: "Respiração" },
  { valor: "meditacao", rotulo: "Meditação" },
  { valor: "movimento", rotulo: "Movimento" },
  { valor: "sono", rotulo: "Sono" },
] as const;

export type CategoriaPratica = (typeof CATEGORIAS_PRATICA)[number]["valor"];
