"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";
import { biblioteca, cadernoEntradas, profiles, vinculos } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { calcularEmbedding } from "@/lib/embed";
import { podeCalcularEmbedding } from "@/lib/rateLimit";

export async function guardarPratica(bibliotecaId: string) {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) redirect("/chegada");

  const pratica = await db.query.biblioteca.findFirst({
    where: eq(biblioteca.id, bibliotecaId),
    columns: { titulo: true },
  });

  const conteudo = `Guardei: ${pratica?.titulo ?? "uma prática"}`;
  const permitido = await podeCalcularEmbedding(db, sessao.user.id);
  const embedding = permitido ? await calcularEmbedding(conteudo, "passage") : null;

  // Compartilhamento com o terapeuta é opt-in por categoria (toggle em
  // /terapia, ver app/terapia/CompartilhamentoToggle.tsx) — sem vínculo
  // ativo (findFirst vem undefined) fica false, mesmo default da coluna.
  const vinculo = await db.query.vinculos.findFirst({
    where: and(eq(vinculos.pacienteId, profile.id), eq(vinculos.ativo, true)),
    columns: { compartilharPraticas: true },
  });

  await db.insert(cadernoEntradas).values({
    pacienteId: profile.id,
    autorTipo: "usuario",
    tipo: "pratica_indicada",
    conteudo,
    bibliotecaRefId: bibliotecaId,
    embedding,
    compartilhar: vinculo?.compartilharPraticas ?? false,
  });

  revalidatePath(`/praticas/${bibliotecaId}`);
}
