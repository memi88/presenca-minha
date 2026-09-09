"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { APIError } from "better-auth/api";
import { profissionais } from "@presenca/db/schema";

import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export type CadastroState = { erro?: string };

// Cadastro mínimo (docs/presenca-extensao-terapeutas-biblioteca copy.md §2,
// docs/cuida-onboarding-mockup.html) — só nome/e-mail/senha. Abordagem,
// forma de trabalho e linguagens simbólicas ficam pro gatilho de
// /perfil/completar, pedidas só quando têm efeito real (antes do primeiro
// pré-cadastro de paciente), nunca como formulário de entrada.
//
// Cria a conta real direto (sem passar por sessão anônima): este
// formulário sempre pede e-mail/senha junto, então não há por que
// fabricar-e-promover uma sessão anônima no mesmo request — mesmo
// raciocínio de apps/presenca/app/chegada/actions.ts:cadastrar.
export async function cadastrar(_prev: CadastroState, formData: FormData): Promise<CadastroState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!nome) return { erro: "Diz seu nome." };
  if (!email || !senha) return { erro: "Preencha e-mail e senha." };
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };

  const auth = await getAuth();
  let userId: string;
  try {
    const resultado = await auth.api.signUpEmail({
      body: { email, password: senha, name: nome },
      headers: await headers(),
    });
    userId = resultado.user.id;
  } catch (erro) {
    const mensagem = erro instanceof APIError ? erro.message : "Não foi possível criar sua conta agora. Tenta de novo?";
    return { erro: mensagem };
  }

  // tipo fica null (sem default — migration cuida_perfil_gatilho) até o
  // gatilho de /perfil/completar preencher; usaLinguagensSimbolicas usa o
  // default da coluna (true); codigoConvite é gerado automaticamente
  // ($defaultFn em business.schema.ts).
  const db = await getDb();
  await db.insert(profissionais).values({ nome, userId });

  redirect("/pacientes");
}
