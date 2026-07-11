"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { calcularEmbedding } from "@/lib/embed";

export type EscreverEntradaState = { erro?: string; sucesso?: boolean };

export async function escreverEntrada(
  pacienteId: string,
  _prev: EscreverEntradaState,
  formData: FormData,
): Promise<EscreverEntradaState> {
  const tipo = String(formData.get("tipo") ?? "reflexao");
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!conteudo) return { erro: "Escreva alguma coisa antes de enviar." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profissional) redirect("/");

  // Mesmo padrão do Presença (apps/presenca/app/diario/actions.ts): não
  // trava a escrita se o serviço de embedding ainda não estiver no ar.
  const embedding = await calcularEmbedding(conteudo, "passage");

  const { error } = await supabase.from("caderno_entradas").insert({
    paciente_id: pacienteId,
    autor_tipo: "profissional",
    autor_profissional_id: profissional.id,
    tipo,
    conteudo,
    embedding,
  });
  // A policy de insert (paciente vinculado) é o que realmente trava isso —
  // este erro só aparece se o vínculo não existir mais.
  if (error) return { erro: error.message };

  revalidatePath(`/pacientes/${pacienteId}`);
  return { sucesso: true };
}
