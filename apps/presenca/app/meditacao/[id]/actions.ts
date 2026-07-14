"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { calcularEmbedding } from "@/lib/embed";
import { podeCalcularEmbedding } from "@/lib/rateLimit";

export async function guardarPratica(bibliotecaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: pratica } = await supabase
    .from("biblioteca")
    .select("titulo")
    .eq("id", bibliotecaId)
    .maybeSingle();

  const conteudo = `Guardei: ${pratica?.titulo ?? "uma prática"}`;
  const permitido = await podeCalcularEmbedding(supabase);
  const embedding = permitido ? await calcularEmbedding(conteudo, "passage") : null;

  await supabase.from("caderno_entradas").insert({
    paciente_id: user.id,
    autor_tipo: "usuario",
    tipo: "pratica_indicada",
    conteudo,
    biblioteca_ref_id: bibliotecaId,
    embedding,
  });

  revalidatePath(`/meditacao/${bibliotecaId}`);
}
