"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { profiles } from "@presenca/db/schema";

import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { type SalvarNascimentoState, lerDadosNascimentoDoForm, salvarESagendarNascimento } from "@/lib/nascimento";

export type CadastroState = { erro?: string };

// Etapa 1 do cadastro — apelido, com e-mail/senha opcionais na mesma tela.
// A sessão anônima acontece aqui, silenciosamente, na primeira vez que
// alguém chega sem sessão nenhuma — igual sempre foi, só que agora
// unificada com o passo do apelido em vez de acontecer antes, no clique
// de /bem-vindo.
//
// Quando e-mail/senha vêm preenchidos junto (mesma visita, sem sessão
// nenhuma ainda), pula o passo anônimo e cria a conta real direto — não
// tem por que fabricar uma sessão anônima só pra promovê-la no mesmo
// request (frágil: `auth.api.signUpEmail` decide "é uma promoção?" lendo
// a sessão do cookie QUE CHEGOU nesta requisição, e o cookie que a
// própria action acabou de escrever nesta mesma execução não é
// reobservável assim). Quando a sessão anônima já existe de uma visita
// anterior e a pessoa preenche e-mail/senha só agora (ex.: reabriu
// /chegada, ou converteu em /conta), aí sim é uma promoção de verdade —
// o cookie anônimo já chegou legitimamente nesta requisição, e
// `onLinkAccount` (packages/db/src/auth.ts) repassa profiles/profissionais
// pro id novo antes do Better Auth apagar o usuário anônimo. Testado ao
// vivo nos dois casos na Fase 4.
export async function cadastrar(_prev: CadastroState, formData: FormData): Promise<CadastroState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!nome) return { erro: "Diz pra gente como te chamar." };
  if ((email && !senha) || (!email && senha)) {
    return { erro: "Preencha e-mail e senha juntos, ou deixe os dois em branco por enquanto." };
  }
  if (email && senha.length < 8) {
    return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const auth = await getAuth();

  // `getSessao()` é 1 ida-e-volta ao D1 (Brasil→ENAM, a região mais
  // próxima disponível — D1 não tem hint de região sul-americana ainda)
  // só pra checar sessão anônima prévia — sem sentido pagar isso quando
  // e-mail+senha já vêm preenchidos (esse caminho nem usa `sessaoAtual`).
  // Pedido de performance do Guilherme (08/09/2026): cada ida-e-volta
  // extra é sensível daqui.
  let userId: string;
  try {
    if (email && senha) {
      const resultado = await auth.api.signUpEmail({
        body: { email, password: senha, name: nome },
        headers: await headers(),
      });
      userId = resultado.user.id;
    } else {
      const sessaoAtual = await getSessao();
      if (sessaoAtual) {
        userId = sessaoAtual.user.id;
      } else {
        const resultado = await auth.api.signInAnonymous({ headers: await headers() });
        userId = resultado.user.id;
      }
    }
  } catch (erro) {
    const mensagem = erro instanceof APIError ? erro.message : "Não foi possível abrir seu espaço agora. Tenta de novo?";
    return { erro: mensagem };
  }

  // Upsert num round trip só, em vez de find+insert/update (2-3 antes) —
  // `profiles.userId` já é unique, então `onConflictDoUpdate` resolve os
  // dois casos (perfil novo ou já existente) na mesma query.
  const db = await getDb();
  await db
    .insert(profiles)
    .values({ userId, nome })
    .onConflictDoUpdate({ target: profiles.userId, set: { nome } });

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

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const resultado = await salvarESagendarNascimento(db, sessao.user.id, lido.dados);
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
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  await db
    .update(profiles)
    .set({ nascimentoPuladoNoCadastroEm: new Date() })
    .where(eq(profiles.userId, sessao.user.id));

  redirect("/home");
}
