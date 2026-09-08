"use server";

import { redirect } from "next/navigation";

import { and, asc, eq } from "drizzle-orm";
import { experienciasEtapas, experienciasInstancias, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

export async function iniciarExperiencia(experienciaId: string) {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) redirect("/chegada");

  // Idempotente: se já existe instância, só manda pra ela (não deixa
  // começar a mesma experiência duas vezes).
  const existente = await db.query.experienciasInstancias.findFirst({
    where: and(eq(experienciasInstancias.pacienteId, profile.id), eq(experienciasInstancias.experienciaId, experienciaId)),
    columns: { id: true },
  });
  if (existente) redirect(`/experiencias/instancia/${existente.id}`);

  const primeiraEtapa = await db.query.experienciasEtapas.findFirst({
    where: eq(experienciasEtapas.experienciaId, experienciaId),
    orderBy: asc(experienciasEtapas.ordem),
    columns: { id: true },
  });
  if (!primeiraEtapa) redirect(`/experiencias/${experienciaId}`);

  const [instancia] = await db
    .insert(experienciasInstancias)
    .values({ pacienteId: profile.id, experienciaId, etapaAtualId: primeiraEtapa.id })
    .returning({ id: experienciasInstancias.id });

  if (!instancia) redirect(`/experiencias/${experienciaId}`);
  redirect(`/experiencias/instancia/${instancia.id}`);
}
