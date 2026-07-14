import "server-only";

import type { createClient } from "@presenca/supabase/server";

/**
 * Rate limit por usuário pras chamadas de embedding (Server Actions) — ver
 * migration `rate_limit_embedding`. Complementa o limite por IP que já
 * existe em services/ia (por trás do mesmo Cloudflare/NAT, IP não distingue
 * usuários). Mesmo padrão do Presença (apps/presenca/lib/rateLimit.ts).
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
