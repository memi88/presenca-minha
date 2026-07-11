"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

export type AtualizarSenhaState = { erro?: string; sucesso?: boolean };

export async function atualizarSenha(
  _prev: AtualizarSenhaState,
  formData: FormData,
): Promise<AtualizarSenhaState> {
  const senha = String(formData.get("senha") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (senha.length < 8) {
    return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  }
  if (senha !== confirmar) {
    return { erro: "As duas senhas não são iguais." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: error.message };

  return { sucesso: true };
}
