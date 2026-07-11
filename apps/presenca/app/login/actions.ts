"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

export type LoginState = { erro?: string; recuperacaoEnviada?: boolean };

export async function entrarComSenha(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  // Nunca diferenciar "e-mail não existe" de "senha errada" — evita
  // confirmar pra quem tenta adivinhar se um e-mail tem conta aqui.
  if (error || !data.user) {
    return { erro: "E-mail ou senha incorretos." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome")
    .eq("id", data.user.id)
    .maybeSingle();

  redirect(profile?.nome ? "/home" : "/chegada");
}

export async function enviarLinkRecuperacao(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { erro: "Digite seu e-mail." };
  }

  const supabase = await createClient();
  // Não trata erro aqui de propósito — a resposta é sempre a mesma
  // ("conferimos seu e-mail"), pra não confirmar se aquele e-mail tem
  // conta ou não.
  await supabase.auth.resetPasswordForEmail(email);

  return { recuperacaoEnviada: true };
}
