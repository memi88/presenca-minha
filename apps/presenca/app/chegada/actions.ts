"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { type SalvarNascimentoState, lerDadosNascimentoDoForm, salvarESagendarNascimento } from "@/lib/nascimento";

export async function salvarNome(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Sem trigger de auto-criação (decisão da Fase 0): esta é a primeira
  // escrita em `profiles`, por isso upsert em vez de update.
  const { error } = await supabase.from("profiles").upsert({ id: user.id, nome });
  if (error) throw error;

  // Redireciona pra /chegada (não direto pra /home): com o nome já salvo,
  // a própria página passa a mostrar a etapa 2 (modal de nascimento).
  redirect("/chegada");
}

// Etapa 2 do cadastro — mesmos dados/regras de app/perfil/nascimento, mas
// termina em /home (fim do fluxo de chegada) em vez de /perfil.
export async function salvarNascimentoCadastro(
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

  redirect("/home");
}

// "Pular por enquanto" no modal do cadastro — diferente do "agora não" do
// banner em /home (que só adia com lembrete_nascimento_em), aqui a pessoa
// está decidindo já na primeira oportunidade, então registramos separado
// (nascimento_pulado_no_cadastro_em) pra medir quantas pessoas recusam
// nesse momento específico. Não impede o convite de aparecer de novo depois
// em /home — os dois sinais são independentes.
export async function pularNascimentoCadastro() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  await supabase
    .from("profiles")
    .update({ nascimento_pulado_no_cadastro_em: new Date().toISOString() })
    .eq("id", user.id);

  redirect("/home");
}
