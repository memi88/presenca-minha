"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { calcularEmbedding } from "@/lib/embed";

export async function guardarLeitura(bibliotecaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: pagina } = await supabase
    .from("biblioteca")
    .select("titulo")
    .eq("id", bibliotecaId)
    .maybeSingle();

  const conteudo = `Guardei: ${pagina?.titulo ?? "uma leitura do Livro Vivo"}`;
  const embedding = await calcularEmbedding(conteudo, "passage");

  await supabase.from("caderno_entradas").insert({
    paciente_id: user.id,
    autor_tipo: "usuario",
    tipo: "pagina_indicada",
    conteudo,
    biblioteca_ref_id: bibliotecaId,
    embedding,
  });

  revalidatePath(`/livro-vivo/${bibliotecaId}`);
}
