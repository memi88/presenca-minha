"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

export type ConectarProfissionalState = { erro?: string };

export async function conectarProfissional(
  _prev: ConectarProfissionalState,
  formData: FormData,
): Promise<ConectarProfissionalState> {
  const codigo = String(formData.get("codigo") ?? "").trim();
  if (!codigo) {
    return { erro: "Digite o código que o profissional te passou." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // A tela só mostra este formulário pra quem já converteu a conta — esta
  // checagem é defesa em profundidade, não o gatilho principal.
  if (user.is_anonymous) {
    return { erro: "Primeiro guarde seu espaço com e-mail e senha." };
  }

  const { data, error } = await supabase.rpc("conectar_profissional", { p_codigo: codigo });
  if (error) {
    return { erro: error.message };
  }
  const resultado = data as { ok: boolean; erro?: string; nome?: string };
  if (!resultado.ok) {
    return { erro: resultado.erro ?? "Código inválido." };
  }

  redirect("/terapia");
}
