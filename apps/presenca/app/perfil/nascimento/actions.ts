"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { type SalvarNascimentoState, lerDadosNascimentoDoForm, salvarESagendarNascimento } from "@/lib/nascimento";

export async function salvarNascimento(
  _prev: SalvarNascimentoState,
  formData: FormData,
): Promise<SalvarNascimentoState> {
  const lido = lerDadosNascimentoDoForm(formData);
  if ("erro" in lido) return lido;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const resultado = await salvarESagendarNascimento(supabase, user.id, lido.dados);
  if (resultado.erro) return resultado;

  redirect("/perfil");
}
