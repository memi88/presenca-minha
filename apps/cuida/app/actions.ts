"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profissionais } from "@presenca/db/schema";

import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

const DIAS_ATE_PROXIMO_LEMBRETE = 7;

export type LoginState = { erro?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }

  const auth = await getAuth();
  let userId: string;
  try {
    const resultado = await auth.api.signInEmail({ body: { email, password: senha }, headers: await headers() });
    userId = resultado.user.id;
  } catch {
    return { erro: "E-mail ou senha incorretos." };
  }

  const db = await getDb();
  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.userId, userId),
    columns: { id: true },
  });

  if (!profissional) {
    await auth.api.signOut({ headers: await headers() });
    return { erro: "Essa conta não está vinculada a nenhum profissional." };
  }

  redirect("/pacientes");
}

export async function logout() {
  const auth = await getAuth();
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

// "Agora não" no banner de perfil incompleto (/pacientes) — mesmo padrão de
// adiarConversao/adiarNascimento em apps/presenca/app/home/actions.ts: adia
// 7 dias, nunca silencia de vez.
export async function adiarLembretePerfil() {
  const sessao = await getSessao();
  if (!sessao) return;

  const proximoLembrete = new Date();
  proximoLembrete.setDate(proximoLembrete.getDate() + DIAS_ATE_PROXIMO_LEMBRETE);

  const db = await getDb();
  await db
    .update(profissionais)
    .set({ lembretePerfilEm: proximoLembrete })
    .where(eq(profissionais.userId, sessao.user.id));

  revalidatePath("/pacientes");
}
