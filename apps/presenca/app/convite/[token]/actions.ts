"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

export type ConfirmarConviteState = { erro?: string };

// Mesmo padrão de app/chegada/actions.ts e do self-signup do terapeuta
// (apps/cuida/app/cadastro/actions.ts): sessão anônima primeiro, depois
// updateUser(email, senha) por cima dela — nunca signUp() direto. O doc
// original (presenca-extensao-terapeutas-biblioteca.md §3) descrevia
// signUp() direto, mas isso deixaria a pessoa sem sessão nenhuma até
// confirmar o e-mail (se "Confirm email" estiver ligado no projeto),
// quebrando a chamada de confirmar_pre_cadastro logo em seguida — que
// precisa de auth.uid() já válido.
export async function confirmarConvite(_prev: ConfirmarConviteState, formData: FormData): Promise<ConfirmarConviteState> {
  const token = String(formData.get("token") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!token) redirect("/");
  if (!email || !senha) return { erro: "Preencha e-mail e senha." };
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };

  const supabase = await createClient();

  // Nome vem sempre do token (nunca de input do form) — quem convidou já
  // digitou o nome certo, e isso evita confiar num campo escondido que
  // poderia ser adulterado antes do submit.
  const { data: pre } = await supabase.rpc("validar_token_pre_cadastro", { p_token: token });
  const registro = pre?.[0];
  if (!registro || registro.status !== "pendente") {
    return { erro: "Esse link não é mais válido." };
  }

  const { data: anonimo, error: erroAnonimo } = await supabase.auth.signInAnonymously();
  if (erroAnonimo || !anonimo.user) {
    return { erro: erroAnonimo?.message ?? "Não foi possível abrir seu espaço agora. Tenta de novo?" };
  }

  const { error: erroPerfil } = await supabase.from("profiles").upsert({ id: anonimo.user.id, nome: registro.nome });
  if (erroPerfil) throw erroPerfil;

  const { error: erroConta } = await supabase.auth.updateUser({ email, password: senha });
  if (erroConta) return { erro: erroConta.message };

  const { error: erroConfirmar } = await supabase.rpc("confirmar_pre_cadastro", {
    p_token: token,
    p_paciente_id: anonimo.user.id,
  });
  if (erroConfirmar) return { erro: erroConfirmar.message };

  redirect("/home");
}
