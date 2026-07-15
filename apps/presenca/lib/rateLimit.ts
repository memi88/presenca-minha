import "server-only";

import type { createClient } from "@presenca/supabase/server";

/**
 * Rate limit por usuário pras chamadas de embedding (Server Actions) — ver
 * migration `rate_limit_embedding`. Complementa o limite por IP que já
 * existe em services/ia (por trás do mesmo Cloudflare/NAT, IP não distingue
 * usuários).
 *
 * Se a própria checagem falhar (RPC indisponível, tabela ausente), libera —
 * mesmo espírito de `lib/embed.ts`: infra auxiliar não deveria travar a
 * escrita de quem está usando o app.
 */
export async function podeCalcularEmbedding(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("pode_calcular_embedding");
  if (error) {
    console.error("podeCalcularEmbedding: falha ao checar rate limit", error);
    return true;
  }
  return data === true;
}

/**
 * Rate limit por usuário nas chamadas de conversa (Claude Sonnet 5) — ver
 * migration `rate_limit_conversa`. Mesmo espírito gracioso de
 * `podeCalcularEmbedding` (libera se a própria checagem falhar, pra não
 * travar quem está usando o app por causa de infra auxiliar) — mas aqui a
 * consequência de liberar demais é bem mais cara por chamada (LLM de
 * conversa, não embedding), então essa é uma escolha deliberada, não um
 * padrão copiado sem pensar: vale revisitar pra fail-closed se o volume
 * real do piloto mostrar abuso.
 */
export async function podeConversar(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("pode_conversar");
  if (error) {
    console.error("podeConversar: falha ao checar rate limit", error);
    return true;
  }
  return data === true;
}
