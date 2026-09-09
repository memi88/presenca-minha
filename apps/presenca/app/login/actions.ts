"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { profiles } from "@presenca/db/schema";

import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export type LoginState = { erro?: string; recuperacaoEnviada?: boolean; linkMagicoEnviado?: boolean };

export async function entrarComSenha(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }

  const auth = await getAuth();
  let userId: string;
  try {
    // Nunca diferenciar "e-mail não existe" de "senha errada" — evita
    // confirmar pra quem tenta adivinhar se um e-mail tem conta aqui.
    const resultado = await auth.api.signInEmail({ body: { email, password: senha }, headers: await headers() });
    userId = resultado.user.id;
  } catch {
    return { erro: "E-mail ou senha incorretos." };
  }

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
    columns: { nome: true },
  });

  redirect(profile?.nome ? "/home" : "/chegada");
}

export async function enviarLinkRecuperacao(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { erro: "Digite seu e-mail." };
  }

  const auth = await getAuth();
  // Não trata erro aqui de propósito — a resposta é sempre a mesma
  // ("conferimos seu e-mail"), pra não confirmar se aquele e-mail tem
  // conta ou não (o próprio Better Auth já segue essa prática — devolve
  // 200 mesmo pra e-mail inexistente, ver requestPasswordReset).
  try {
    await auth.api.requestPasswordReset({ body: { email }, headers: await headers() });
  } catch {
    // ignorado de propósito, ver comentário acima
  }

  return { recuperacaoEnviada: true };
}

export async function enviarLinkMagico(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { erro: "Digite seu e-mail." };
  }

  const auth = await getAuth();
  // Mesmo motivo de não tratar erro em enviarLinkRecuperacao.
  try {
    await auth.api.signInMagicLink({ body: { email, callbackURL: "/home" }, headers: await headers() });
  } catch {
    // ignorado de propósito, ver comentário acima
  }

  return { linkMagicoEnviado: true };
}
