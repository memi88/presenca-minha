"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { APIError } from "better-auth/api";

import { getAuth } from "@/lib/auth";
import { getSessao } from "@/lib/sessao";

export type AtualizarSenhaState = { erro?: string; sucesso?: boolean };

export async function atualizarSenha(
  _prev: AtualizarSenhaState,
  formData: FormData,
): Promise<AtualizarSenhaState> {
  const senhaAtual = String(formData.get("senhaAtual") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (!senhaAtual) {
    return { erro: "Digite sua senha atual." };
  }
  if (senha.length < 8) {
    return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  }
  if (senha !== confirmar) {
    return { erro: "As duas senhas não são iguais." };
  }

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  // `changePassword` (diferente do `updateUser({ password })` do Supabase
  // que isso substitui) exige a senha atual — o Supabase permitia trocar
  // só com a sessão válida, sem reconfirmar; o Better Auth não tem
  // equivalente direto pra isso. Decisão: pedir a senha atual (prática
  // padrão, mais segura), 1 campo a mais no formulário.
  const auth = await getAuth();
  try {
    await auth.api.changePassword({
      body: { currentPassword: senhaAtual, newPassword: senha },
      headers: await headers(),
    });
  } catch (erro) {
    const mensagem = erro instanceof APIError ? erro.message : "Não foi possível atualizar a senha agora.";
    return { erro: mensagem };
  }

  return { sucesso: true };
}
