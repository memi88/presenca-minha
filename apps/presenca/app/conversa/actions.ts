"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { calcularEmbedding } from "@/lib/embed";
import { podeCalcularEmbedding } from "@/lib/rateLimit";

/**
 * Guarda um trecho específico da conversa (mensagem do usuário ou do
 * assistente) como uma entrada normal do Diário — mesmo padrão de
 * `criarEntrada` em app/diario/actions.ts. A conversa em si nunca é
 * persistida; só o que a pessoa escolhe guardar vira registro permanente.
 */
export async function guardarNoDiario(conteudo: string) {
  const texto = conteudo.trim();
  if (!texto) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: entrada, error } = await supabase
    .from("caderno_entradas")
    .insert({ paciente_id: user.id, autor_tipo: "usuario", tipo: "reflexao", conteudo: texto })
    .select("id")
    .single();
  if (error) {
    console.error("guardarNoDiario: falha ao inserir entrada", error);
    return;
  }

  // Mesmo padrão de app/diario/actions.ts: embedding e busca de conexão
  // rodam depois da resposta (services/ia pode levar vários segundos).
  const { ctx } = await getCloudflareContext({ async: true });
  ctx.waitUntil(processarConexaoEntrada(supabase, entrada.id, texto));

  revalidatePath("/diario");
}

async function processarConexaoEntrada(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entradaId: string,
  conteudo: string,
) {
  const permitido = await podeCalcularEmbedding(supabase);
  const embedding = permitido ? await calcularEmbedding(conteudo, "passage") : null;
  if (!embedding) return;

  const { data: conexoesEncontradas } = (await supabase.rpc("buscar_conexao_caderno", {
    p_embedding: embedding,
    p_excluir_id: entradaId,
  })) as { data: { conteudo: string }[] | null };

  await supabase
    .from("caderno_entradas")
    .update({ embedding, conexao_conteudo: conexoesEncontradas?.[0]?.conteudo ?? null })
    .eq("id", entradaId);

  revalidatePath("/diario");
}
