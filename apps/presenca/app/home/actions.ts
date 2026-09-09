"use server";

import { revalidatePath } from "next/cache";

import { eq } from "drizzle-orm";
import { profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

const DIAS_ATE_PROXIMO_CONVITE = 7;

// Convite de conversão "gentil e recorrente" (checklist Fase 1) — dispensar
// não silencia pra sempre, só adia. Nada de insistência a cada visita,
// nada de nunca mais perguntar.
export async function adiarConversao() {
  const sessao = await getSessao();
  if (!sessao) return;

  const proximoConvite = new Date();
  proximoConvite.setDate(proximoConvite.getDate() + DIAS_ATE_PROXIMO_CONVITE);

  const db = await getDb();
  await db
    .update(profiles)
    .set({ lembreteConversaoEm: proximoConvite })
    .where(eq(profiles.userId, sessao.user.id));

  revalidatePath("/home");
}

// Mesmo padrão do convite de conversão — "agora não" adia 7 dias, nunca
// silencia de vez (PRD §5).
export async function adiarNascimento() {
  const sessao = await getSessao();
  if (!sessao) return;

  const proximoConvite = new Date();
  proximoConvite.setDate(proximoConvite.getDate() + DIAS_ATE_PROXIMO_CONVITE);

  const db = await getDb();
  await db
    .update(profiles)
    .set({ lembreteNascimentoEm: proximoConvite })
    .where(eq(profiles.userId, sessao.user.id));

  revalidatePath("/home");
}

// Antes era a rota /hoje inteira — absorvida pelo bloco de saudação da
// Home no redesign (docs/redesign/presenca-redesign-sistema-visual-status.md
// §5): mesmo registro, só que sem sair da página.
export async function registrarPresenca(momento: string) {
  const sessao = await getSessao();
  if (!sessao) return;

  const agora = new Date();
  const db = await getDb();
  await db
    .update(profiles)
    .set({ presencaHoje: momento, presencaHojeEm: agora, ultimaVisitaEm: agora })
    .where(eq(profiles.userId, sessao.user.id));

  revalidatePath("/home");
}
