"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";
import type { Db } from "@presenca/db/db";
import { biblioteca, cadernoEntradas, profiles, vinculos } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { calcularEmbedding } from "@/lib/embed";
import { podeCalcularEmbedding } from "@/lib/rateLimit";

export async function guardarLeitura(bibliotecaId: string) {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) redirect("/chegada");

  const pagina = await db.query.biblioteca.findFirst({
    where: eq(biblioteca.id, bibliotecaId),
    columns: { titulo: true },
  });

  const conteudo = `Guardei: ${pagina?.titulo ?? "uma leitura do Livro Vivo"}`;

  // Compartilhamento com o terapeuta é opt-in por categoria (toggle em
  // /terapia, ver app/terapia/CompartilhamentoToggle.tsx) — sem vínculo
  // ativo (findFirst vem undefined) fica false, mesmo default da coluna.
  const vinculo = await db.query.vinculos.findFirst({
    where: and(eq(vinculos.pacienteId, profile.id), eq(vinculos.ativo, true)),
    columns: { compartilharLivroVivo: true },
  });

  const [entrada] = await db
    .insert(cadernoEntradas)
    .values({
      pacienteId: profile.id,
      autorTipo: "usuario",
      tipo: "pagina_indicada",
      conteudo,
      bibliotecaRefId: bibliotecaId,
      compartilhar: vinculo?.compartilharLivroVivo ?? false,
    })
    .returning({ id: cadernoEntradas.id });

  // Embedding roda depois da resposta (services/ia pode levar vários
  // segundos) — ctx.waitUntil garante que o Worker não mata a promise assim
  // que a Server Action retorna. A leitura já foi guardada de qualquer forma.
  if (entrada) {
    const { ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(processarEmbeddingEntrada(db, sessao.user.id, entrada.id, conteudo));
  }

  revalidatePath(`/livro-vivo/${bibliotecaId}`);
}

async function processarEmbeddingEntrada(db: Db, userId: string, entradaId: string, conteudo: string) {
  const permitido = await podeCalcularEmbedding(db, userId);
  const embedding = permitido ? await calcularEmbedding(conteudo, "passage") : null;
  if (!embedding) return;

  await db.update(cadernoEntradas).set({ embedding }).where(eq(cadernoEntradas.id, entradaId));
}
