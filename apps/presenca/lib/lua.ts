const SINODICO_DIAS = 29.53058867;
// Lua nova de referência conhecida (2000-01-06 18:14 UTC) — qualquer outra
// data se calcula em relação a essa, sem precisar de serviço externo.
const LUA_NOVA_REFERENCIA = Date.UTC(2000, 0, 6, 18, 14);

const FASES = [
  "nova",
  "crescente",
  "quarto-crescente",
  "gibosa-crescente",
  "cheia",
  "gibosa-minguante",
  "quarto-minguante",
  "minguante",
] as const;

export type FaseDaLua = { nome: (typeof FASES)[number]; indice: number };

/** Cálculo local da fase da lua — sem serviço externo (PRD seção 7). */
export function faseDaLua(data: Date): FaseDaLua {
  const diasDesdeReferencia = (data.getTime() - LUA_NOVA_REFERENCIA) / 86_400_000;
  const cicloAtual = diasDesdeReferencia % SINODICO_DIAS;
  const fracaoDoCiclo = (cicloAtual < 0 ? cicloAtual + SINODICO_DIAS : cicloAtual) / SINODICO_DIAS;
  const indice = Math.floor(fracaoDoCiclo * FASES.length) % FASES.length;
  // Sempre em [0, FASES.length) por construção — o cast só contorna
  // noUncheckedIndexedAccess, não é uma checagem real de bounds.
  return { nome: FASES[indice] as FaseDaLua["nome"], indice };
}
