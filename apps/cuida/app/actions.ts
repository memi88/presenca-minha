"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

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
