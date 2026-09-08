"use server";

import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { TIPOS_PROFISSIONAL } from "@/lib/tiposProfissional";

export type CompletarPerfilState = { erro?: string };

export async function completarPerfil(_prev: CompletarPerfilState, formData: FormData): Promise<CompletarPerfilState> {
  const tipo = String(formData.get("tipo") ?? "");
  const formaDeTrabalho = String(formData.get("forma_de_trabalho") ?? "").trim();
  const usaLinguagensSimbolicas = formData.get("usa_linguagens_simbolicas") === "on";
  const nextRaw = String(formData.get("next") ?? "/pacientes");
  const next = nextRaw.startsWith("/") ? nextRaw : "/pacientes";

  if (!TIPOS_PROFISSIONAL.includes(tipo as (typeof TIPOS_PROFISSIONAL)[number])) {
    return { erro: "Escolha sua abordagem." };
  }
  if (tipo === "Outra" && !formaDeTrabalho) {
    return { erro: "Descreve rapidamente sua abordagem." };
  }

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  await db
    .update(profissionais)
    .set({
      tipo,
      formaDeTrabalho: tipo === "Outra" ? formaDeTrabalho : null,
      usaLinguagensSimbolicas,
    })
    .where(eq(profissionais.userId, sessao.user.id));

  redirect(next);
}
