"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { calcularEmbedding } from "@/lib/embed";
import { podeCalcularEmbedding } from "@/lib/rateLimit";

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

  const { data: entrada, error } = await supabase
    .from("caderno_entradas")
    .insert({
      paciente_id: user.id,
      autor_tipo: "usuario",
      tipo: "pagina_indicada",
      conteudo,
      biblioteca_ref_id: bibliotecaId,
    })
    .select("id")
    .single();

  // Embedding roda depois da resposta (services/ia pode levar vários
  // segundos) — ctx.waitUntil garante que o Worker não mata a promise assim
  // que a Server Action retorna. A leitura já foi guardada de qualquer forma.
  if (!error) {
    const { ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(processarEmbeddingEntrada(supabase, entrada.id, conteudo));
  }

  revalidatePath(`/livro-vivo/${bibliotecaId}`);
}

async function processarEmbeddingEntrada(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entradaId: string,
  conteudo: string,
) {
  const permitido = await podeCalcularEmbedding(supabase);
  const embedding = permitido ? await calcularEmbedding(conteudo, "passage") : null;
  if (!embedding) return;

  await supabase.from("caderno_entradas").update({ embedding }).eq("id", entradaId);
}
