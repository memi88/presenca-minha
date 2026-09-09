"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { cadernoEntradas, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { processarConexaoEntrada } from "@/lib/conexaoCaderno";

/**
 * Guarda um trecho específico da conversa (mensagem do usuário ou do
 * assistente) como uma entrada normal do Diário — mesmo padrão de
 * `criarEntrada` em app/diario/actions.ts. A conversa em si nunca é
 * persistida; só o que a pessoa escolhe guardar vira registro permanente.
 */
export async function guardarNoDiario(conteudo: string, compartilhar: boolean = false) {
  const texto = conteudo.trim();
  if (!texto) return;

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) redirect("/chegada");

  const [entrada] = await db
    .insert(cadernoEntradas)
    .values({ pacienteId: profile.id, autorTipo: "usuario", tipo: "reflexao", conteudo: texto, compartilhar })
    .returning({ id: cadernoEntradas.id });
  if (!entrada) {
    console.error("guardarNoDiario: falha ao inserir entrada");
    return;
  }

  // Mesmo padrão de app/diario/actions.ts: embedding e busca de conexão
  // rodam depois da resposta (services/ia pode levar vários segundos).
  const { ctx } = await getCloudflareContext({ async: true });
  ctx.waitUntil(
    processarConexaoEntrada(db, sessao.user.id, profile.id, entrada.id, texto).then(() =>
      revalidatePath("/diario"),
    ),
  );

  revalidatePath("/diario");
}
