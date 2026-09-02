"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

export type CadastroState = { erro?: string };

// Cadastro mínimo (docs/presenca-extensao-terapeutas-biblioteca copy.md §2,
// docs/cuida-onboarding-mockup.html) — só nome/e-mail/senha. Abordagem,
// forma de trabalho e linguagens simbólicas ficam pro gatilho de
// /perfil/completar, pedidas só quando têm efeito real (antes do primeiro
// pré-cadastro de paciente), nunca como formulário de entrada.
export async function cadastrar(_prev: CadastroState, formData: FormData): Promise<CadastroState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!nome) return { erro: "Diz seu nome." };
  if (!email || !senha) return { erro: "Preencha e-mail e senha." };
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };

  const supabase = await createClient();

  // Mesmo padrão de apps/presenca/app/chegada/actions.ts: sessão anônima
  // primeiro, depois updateUser(email, senha) por cima dela — nunca
  // signUp() direto (deixaria a pessoa sem sessão nenhuma até confirmar o
  // e-mail, quebrando "profissional já entra logado").
  const { data: anonimo, error: erroAnonimo } = await supabase.auth.signInAnonymously();
  if (erroAnonimo || !anonimo.user) {
    return { erro: erroAnonimo?.message ?? "Não foi possível criar sua conta agora. Tenta de novo?" };
  }

  const { error: erroConta } = await supabase.auth.updateUser({ email, password: senha });
  if (erroConta) return { erro: erroConta.message };

  // tipo fica null (sem default — migration cuida_perfil_gatilho) até o
  // gatilho de /perfil/completar preencher; usa_linguagens_simbolicas usa o
  // default da coluna (true).
  const { error: erroProfissional } = await supabase.from("profissionais").insert({
    nome,
    user_id: anonimo.user.id,
  });
  if (erroProfissional) return { erro: erroProfissional.message };

  redirect("/pacientes");
}
