import "server-only";

// Distância de cosseno — reimplementação em memória do operador `<=>` do
// pgvector (Postgres), decisão registrada na Fase 4 da migração
// Supabase→Cloudflare: D1/SQLite não tem tipo vetor nem busca por
// similaridade nativa, e o volume por pessoa (poucas dezenas de linhas)
// não justifica um banco vetorial dedicado (Vectorize) por ora. 0 =
// idêntico, 2 = oposto — mesma escala do pgvector.
export function distanciaCosseno(a: number[], b: number[]): number {
  let produtoEscalar = 0;
  let normaA = 0;
  let normaB = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    produtoEscalar += x * y;
    normaA += x * x;
    normaB += y * y;
  }
  const similaridade = produtoEscalar / (Math.sqrt(normaA) * Math.sqrt(normaB));
  return 1 - similaridade;
}
