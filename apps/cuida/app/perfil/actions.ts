"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { profissionais } from "@presenca/db/schema";
import { ArquivoInvalidoError, apagarImagem, salvarImagem } from "@presenca/db/media";

import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getMedia } from "@/lib/media";
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

export type AtualizarFotoState = { erro?: string };

export async function atualizarFoto(_prev: AtualizarFotoState, formData: FormData): Promise<AtualizarFotoState> {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const arquivo = formData.get("foto");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Escolha uma imagem." };
  }

  const db = await getDb();
  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true, fotoChave: true },
  });
  if (!profissional) redirect("/");

  const media = await getMedia();
  let novaChave: string;
  try {
    novaChave = await salvarImagem(media, `profissionais/${profissional.id}`, arquivo);
  } catch (erro) {
    if (erro instanceof ArquivoInvalidoError) return { erro: erro.message };
    console.error("atualizarFoto: falha ao gravar no R2", erro);
    return { erro: "Não foi possível enviar a imagem agora." };
  }

  await db.update(profissionais).set({ fotoChave: novaChave }).where(eq(profissionais.id, profissional.id));
  await apagarImagem(media, profissional.fotoChave);

  revalidatePath("/perfil");
  return {};
}

export type AtualizarDescricaoState = { erro?: string; sucesso?: boolean };

export async function atualizarDescricao(
  _prev: AtualizarDescricaoState,
  formData: FormData,
): Promise<AtualizarDescricaoState> {
  const descricao = String(formData.get("descricao") ?? "").trim();

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profissional) redirect("/");

  await db
    .update(profissionais)
    .set({ descricao: descricao || null })
    .where(eq(profissionais.id, profissional.id));

  revalidatePath("/perfil");
  return { sucesso: true };
}
