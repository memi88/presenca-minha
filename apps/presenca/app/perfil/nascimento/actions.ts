"use server";

import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { type SalvarNascimentoState, lerDadosNascimentoDoForm, salvarESagendarNascimento } from "@/lib/nascimento";

export async function salvarNascimento(
  _prev: SalvarNascimentoState,
  formData: FormData,
): Promise<SalvarNascimentoState> {
  const lido = lerDadosNascimentoDoForm(formData);
  if ("erro" in lido) return lido;

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const resultado = await salvarESagendarNascimento(db, sessao.user.id, lido.dados);
  if (resultado.erro) return resultado;

  redirect("/perfil");
}
