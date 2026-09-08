"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";
import { profiles, profissionais, vinculos } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

export type ConectarProfissionalState = { erro?: string };

// Reimplementa a RPC `conectar_profissional` (ver
// supabase/migrations/20260710141751_fase4_vinculos.sql): resolve o
// código de convite, cria (ou reativa) o vínculo e marca
// `profiles.profissionalId`. Sem RLS/security definer no D1 — a
// autorização aqui é só "está logado", igual a RPC original (qualquer
// paciente autenticado pode conectar com um código válido).
export async function conectarProfissional(
  _prev: ConectarProfissionalState,
  formData: FormData,
): Promise<ConectarProfissionalState> {
  const codigo = String(formData.get("codigo") ?? "").trim();
  if (!codigo) {
    return { erro: "Digite o código que o profissional te passou." };
  }

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  // A tela só mostra este formulário pra quem já converteu a conta — esta
  // checagem é defesa em profundidade, não o gatilho principal.
  if (sessao.user.isAnonymous) {
    return { erro: "Primeiro guarde seu espaço com e-mail e senha." };
  }

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) redirect("/chegada");

  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.codigoConvite, codigo.toUpperCase()),
    columns: { id: true, nome: true },
  });
  if (!profissional) {
    return { erro: "código não encontrado" };
  }

  await db
    .insert(vinculos)
    .values({ profissionalId: profissional.id, pacienteId: profile.id, ativo: true })
    .onConflictDoUpdate({
      target: [vinculos.profissionalId, vinculos.pacienteId],
      set: { ativo: true },
    });

  await db.update(profiles).set({ profissionalId: profissional.id }).where(eq(profiles.id, profile.id));

  redirect("/terapia");
}

export async function definirCompartilharPraticas(valor: boolean) {
  const sessao = await getSessao();
  if (!sessao) return;

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) return;

  await db
    .update(vinculos)
    .set({ compartilharPraticas: valor })
    .where(and(eq(vinculos.pacienteId, profile.id), eq(vinculos.ativo, true)));
  revalidatePath("/terapia");
}

export async function definirCompartilharLivroVivo(valor: boolean) {
  const sessao = await getSessao();
  if (!sessao) return;

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) return;

  await db
    .update(vinculos)
    .set({ compartilharLivroVivo: valor })
    .where(and(eq(vinculos.pacienteId, profile.id), eq(vinculos.ativo, true)));
  revalidatePath("/terapia");
}

// Encerra o vínculo (soft delete, ver migration) — precisa de um novo
// código de convite pra reconectar, por isso o componente que chama isso
// (DesconectarBotao.tsx) pede confirmação inline antes.
export async function desconectarTerapeuta() {
  const sessao = await getSessao();
  if (!sessao) return;

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) return;

  await db
    .update(vinculos)
    .set({ ativo: false })
    .where(and(eq(vinculos.pacienteId, profile.id), eq(vinculos.ativo, true)));
  await db.update(profiles).set({ profissionalId: null }).where(eq(profiles.id, profile.id));

  revalidatePath("/terapia");
  revalidatePath("/perfil");
  revalidatePath("/home");
}
