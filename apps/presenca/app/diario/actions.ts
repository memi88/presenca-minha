"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { processarConexaoEntrada } from "@/lib/conexaoCaderno";

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
  // `conexao_conteudo` em EntradaItem), não mais na hora — daí revalidar de
  // novo depois que o helper terminar.
  const { ctx } = await getCloudflareContext({ async: true });
  ctx.waitUntil(
    processarConexaoEntrada(supabase, entrada.id, conteudo).then(() => revalidatePath("/diario")),
  );

  revalidatePath("/diario");
  return {};
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
