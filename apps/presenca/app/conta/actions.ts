"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Converte a sessão anônima em permanente preservando o mesmo auth.uid()
  // — não é um cadastro novo, é a mesma pessoa ganhando uma credencial
  // recuperável. Ver docs/presenca-prd.md seção 3.2 / checklist Fase 1.
  const { error } = await supabase.auth.updateUser({ email, password: senha });
  if (error) {
    return { erro: error.message };
  }

  redirect(next);
}
