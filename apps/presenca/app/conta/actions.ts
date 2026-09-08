"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { profiles } from "@presenca/db/schema";

import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

export type ConverterContaState = { erro?: string };

export async function converterConta(
  _prev: ConverterContaState,
  formData: FormData,
): Promise<ConverterContaState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const nextRaw = String(formData.get("next") ?? "/home");
  const next = nextRaw.startsWith("/") ? nextRaw : "/home";

  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }
  if (senha.length < 8) {
    return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { nome: true },
  });

  const auth = await getAuth();
  try {
    // `signUpEmail` enquanto a sessão atual é anônima aciona o
    // `onLinkAccount` (packages/db/src/auth.ts) — converte a sessão
    // anônima em permanente repassando profiles/profissionais pro id
    // novo, não é um cadastro do zero. Ver mesmo comentário em
    // app/chegada/actions.ts.
    await auth.api.signUpEmail({
      body: { email, password: senha, name: profile?.nome ?? sessao.user.name },
      headers: await headers(),
    });
  } catch (erro) {
    const mensagem = erro instanceof APIError ? erro.message : "Não foi possível guardar seu espaço agora.";
    return { erro: mensagem };
  }

  redirect(next);
}
