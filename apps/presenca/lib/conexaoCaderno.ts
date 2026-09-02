import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { calcularEmbedding } from "@/lib/embed";
import { podeCalcularEmbedding } from "@/lib/rateLimit";

/**
 * "A IA percebe conexões" (presenca-ia-arquitetura.md §5) — extraído de
 * `app/diario/actions.ts`/`app/conversa/actions.ts` (eram cópias idênticas)
 * quando um terceiro chamador (`app/fechamento/actions.ts`, P7) surgiu.
 * Único lugar que decide o que vira `conexao_conteudo` — quem manda pra cá
 * é quem controla a superfície de privacidade de "isso conecta com algo
 * que você guardou".
 *
 * Roda depois da resposta (services/ia pode levar vários segundos) —
 * chamar sempre via `ctx.waitUntil(...)` no caller, nunca com `await`
 * direto na Server Action. Não chama `revalidatePath` aqui — isso é
 * responsabilidade de cada caller (só quem lista a entrada em algum lugar
 * precisa revalidar; `/fechamento`, por exemplo, não precisa).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processarConexaoEntrada(supabase: SupabaseClient<any>, entradaId: string, conteudo: string) {
  const permitido = await podeCalcularEmbedding(supabase);
  const embedding = permitido ? await calcularEmbedding(conteudo, "passage") : null;
  if (!embedding) return;

  // Exclui a própria entrada da busca (ela já existe agora) — PRD seção 7,
  // nunca "conecta consigo mesma". A própria função RPC exclui
  // `tipo = 'fechamento_dia'` do lado candidato (nunca é o lado citado de
  // uma conexão, mesmo quando ela mesma está buscando — P7).
  const { data: conexoesEncontradas } = (await supabase.rpc("buscar_conexao_caderno", {
    p_embedding: embedding,
    p_excluir_id: entradaId,
  })) as { data: { conteudo: string }[] | null };

  await supabase
    .from("caderno_entradas")
    .update({ embedding, conexao_conteudo: conexoesEncontradas?.[0]?.conteudo ?? null })
    .eq("id", entradaId);
}
