"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { calcularEmbedding } from "@/lib/embed";
import { podeCalcularEmbedding } from "@/lib/rateLimit";

export type EscreverEntradaState = { erro?: string; sucesso?: boolean };

const TIPOS_COM_REFERENCIA = new Set(["pratica_indicada", "pagina_indicada"]);
const TIPO_BIBLIOTECA_ESPERADO: Record<string, string> = {
  pratica_indicada: "pratica",
  pagina_indicada: "pagina_livro_vivo",
};

export async function escreverEntrada(
  pacienteId: string,
  _prev: EscreverEntradaState,
  formData: FormData,
): Promise<EscreverEntradaState> {
  const tipo = String(formData.get("tipo") ?? "reflexao");
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  const bibliotecaRefId = String(formData.get("biblioteca_ref_id") ?? "").trim() || null;
  const precisaReferencia = TIPOS_COM_REFERENCIA.has(tipo);

  if (precisaReferencia && !bibliotecaRefId) {
    return { erro: "Escolha qual prática ou página você quer indicar." };
  }
  if (!precisaReferencia && !conteudo) return { erro: "Escreva alguma coisa antes de enviar." };

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

  // Confere que a referência escolhida existe, está publicada e é do tipo
  // certo (prática pra "prática indicada", página do Livro Vivo pra
  // "página indicada") — o <select> do form já filtra isso, mas o form
  // pode ser manipulado, então confere de novo aqui.
  if (precisaReferencia && bibliotecaRefId) {
    const { data: item } = await supabase
      .from("biblioteca")
      .select("id, tipo")
      .eq("id", bibliotecaRefId)
      .eq("publicado", true)
      .maybeSingle();
    if (!item || item.tipo !== TIPO_BIBLIOTECA_ESPERADO[tipo]) {
      return { erro: "Essa indicação não é válida — escolha de novo." };
    }
  }

  // Mesmo padrão do Presença (apps/presenca/app/diario/actions.ts): não
  // trava a escrita se o serviço de embedding ainda não estiver no ar, nem
  // se o limite de uso do usuário estourou. Sem conteúdo (indicação sem
  // nota), não tem o que gerar embedding — fica nulo mesmo.
  const permitido = conteudo && (await podeCalcularEmbedding(supabase));
  const embedding = permitido ? await calcularEmbedding(conteudo, "passage") : null;

  const { error } = await supabase.from("caderno_entradas").insert({
    paciente_id: pacienteId,
    autor_tipo: "profissional",
    autor_profissional_id: profissional.id,
    tipo,
    conteudo,
    biblioteca_ref_id: bibliotecaRefId,
    embedding,
  });
  // A policy de insert (paciente vinculado) é o que realmente trava isso —
  // este erro só aparece se o vínculo não existir mais.
  if (error) return { erro: error.message };

  revalidatePath(`/pacientes/${pacienteId}`);
  return { sucesso: true };
}
