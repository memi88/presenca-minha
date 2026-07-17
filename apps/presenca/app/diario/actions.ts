"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { calcularEmbedding } from "@/lib/embed";
import { podeCalcularEmbedding } from "@/lib/rateLimit";

export type CriarEntradaState = { erro?: string };

export async function criarEntrada(
  _prev: CriarEntradaState,
  formData: FormData,
): Promise<CriarEntradaState> {
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!conteudo) return { erro: "Escreva alguma coisa antes de guardar." };
  const compartilhar = formData.get("compartilhar") === "on";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: entrada, error } = await supabase
    .from("caderno_entradas")
    .insert({ paciente_id: user.id, autor_tipo: "usuario", conteudo, compartilhar })
    .select("id")
    .single();
  if (error) return { erro: error.message };

  // Embedding e busca de conexão rodam depois da resposta (services/ia pode
  // levar vários segundos) — ctx.waitUntil garante que o Worker não mata a
  // promise assim que a Server Action retorna. A entrada já está salva; se
  // houver conexão, ela aparece na próxima vez que a lista for exibida (ver
  // `conexao_conteudo` em EntradaItem), não mais na hora.
  const { ctx } = await getCloudflareContext({ async: true });
  ctx.waitUntil(processarConexaoEntrada(supabase, entrada.id, conteudo));

  revalidatePath("/diario");
  return {};
}

async function processarConexaoEntrada(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entradaId: string,
  conteudo: string,
) {
  // Não trava a escrita se o serviço de embedding ainda não estiver no ar
  // (deploy pendente) ou se o limite de uso do usuário estourou — a entrada
  // já foi salva de qualquer forma, só sem embedding por enquanto.
  const permitido = await podeCalcularEmbedding(supabase);
  const embedding = permitido ? await calcularEmbedding(conteudo, "passage") : null;
  if (!embedding) return;

  // Exclui a própria entrada da busca (ela já existe agora, diferente de
  // quando a busca rodava antes do insert) — PRD seção 7, nunca "conecta
  // consigo mesma".
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

export async function alternarRevisitar(id: string, valorAtual: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  await supabase.from("caderno_entradas").update({ revisitar: !valorAtual }).eq("id", id);
  revalidatePath("/diario");
}

export async function alternarCompartilhar(id: string, valorAtual: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  await supabase.from("caderno_entradas").update({ compartilhar: !valorAtual }).eq("id", id);
  revalidatePath("/diario");
}

export async function apagarEntrada(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  await supabase.from("caderno_entradas").delete().eq("id", id);
  revalidatePath("/diario");
}
