"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { calcularEmbedding } from "@/lib/embed";

export type CriarEntradaState = { erro?: string };

export async function criarEntrada(
  _prev: CriarEntradaState,
  formData: FormData,
): Promise<CriarEntradaState> {
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!conteudo) return { erro: "Escreva alguma coisa antes de guardar." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Não trava a escrita se o serviço de embedding ainda não estiver no ar
  // (deploy pendente) — a entrada é salva de qualquer forma, só sem
  // embedding por enquanto.
  const embedding = await calcularEmbedding(conteudo, "passage");

  const { error } = await supabase.from("caderno_entradas").insert({
    paciente_id: user.id,
    autor_tipo: "usuario",
    conteudo,
    embedding,
  });
  if (error) return { erro: error.message };

  revalidatePath("/caderno");
  return {};
}

export async function alternarRevisitar(id: string, valorAtual: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  await supabase.from("caderno_entradas").update({ revisitar: !valorAtual }).eq("id", id);
  revalidatePath("/caderno");
}

export async function apagarEntrada(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  await supabase.from("caderno_entradas").delete().eq("id", id);
  revalidatePath("/caderno");
}
