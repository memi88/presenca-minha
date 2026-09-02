"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

const DIAS_ATE_PROXIMO_LEMBRETE = 7;

export type LoginState = { erro?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error || !data.user) {
    return { erro: "E-mail ou senha incorretos." };
  }

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!profissional) {
    await supabase.auth.signOut();
    return { erro: "Essa conta não está vinculada a nenhum profissional." };
  }

  redirect("/pacientes");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// "Agora não" no banner de perfil incompleto (/pacientes) — mesmo padrão de
// adiarConversao/adiarNascimento em apps/presenca/app/home/actions.ts: adia
// 7 dias, nunca silencia de vez.
export async function adiarLembretePerfil() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const proximoLembrete = new Date();
  proximoLembrete.setDate(proximoLembrete.getDate() + DIAS_ATE_PROXIMO_LEMBRETE);

  await supabase.from("profissionais").update({ lembrete_perfil_em: proximoLembrete.toISOString() }).eq("user_id", user.id);

  revalidatePath("/pacientes");
}
