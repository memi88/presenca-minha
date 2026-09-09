"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";
import { cadernoEntradas, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { processarConexaoEntrada } from "@/lib/conexaoCaderno";

export type CriarEntradaState = { erro?: string };

export async function criarEntrada(
  _prev: CriarEntradaState,
  formData: FormData,
): Promise<CriarEntradaState> {
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!conteudo) return { erro: "Escreva alguma coisa antes de guardar." };
  const compartilhar = formData.get("compartilhar") === "on";

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
    .values({ pacienteId: profile.id, autorTipo: "usuario", conteudo, compartilhar })
    .returning({ id: cadernoEntradas.id });
  if (!entrada) return { erro: "Não foi possível guardar agora. Tenta de novo?" };

  // Embedding e busca de conexão rodam depois da resposta (services/ia pode
  // levar vários segundos) — ctx.waitUntil garante que o Worker não mata a
  // promise assim que a Server Action retorna. A entrada já está salva; se
  // houver conexão, ela aparece na próxima vez que a lista for exibida (ver
  // `conexaoConteudo` em EntradaItem), não mais na hora — daí revalidar de
  // novo depois que o helper terminar.
  const { ctx } = await getCloudflareContext({ async: true });
  ctx.waitUntil(
    processarConexaoEntrada(db, sessao.user.id, profile.id, entrada.id, conteudo).then(() =>
      revalidatePath("/diario"),
    ),
  );

  revalidatePath("/diario");
  return {};
}

// As 3 ações abaixo recebem um `id` de entrada vindo do cliente — sem RLS
// pra garantir isso sozinha (D1 não tem), o filtro `pacienteId = profile.id`
// no WHERE é o que impede alguém de editar/apagar uma entrada que não é
// dela, só adivinhando o id. Substitui a policy "paciente só edita a
// própria entrada" (ver comentário "RLS antiga" em business.schema.ts).

export async function alternarRevisitar(id: string, valorAtual: boolean) {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) redirect("/chegada");

  await db
    .update(cadernoEntradas)
    .set({ revisitar: !valorAtual })
    .where(and(eq(cadernoEntradas.id, id), eq(cadernoEntradas.pacienteId, profile.id)));
  revalidatePath("/diario");
}

export async function alternarCompartilhar(id: string, valorAtual: boolean) {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) redirect("/chegada");

  await db
    .update(cadernoEntradas)
    .set({ compartilhar: !valorAtual })
    .where(and(eq(cadernoEntradas.id, id), eq(cadernoEntradas.pacienteId, profile.id)));
  revalidatePath("/diario");
}

export async function apagarEntrada(id: string) {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) redirect("/chegada");

  await db
    .delete(cadernoEntradas)
    .where(and(eq(cadernoEntradas.id, id), eq(cadernoEntradas.pacienteId, profile.id)));
  revalidatePath("/diario");
}
