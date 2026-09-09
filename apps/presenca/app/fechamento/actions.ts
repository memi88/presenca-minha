"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { cadernoEntradas, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { processarConexaoEntrada } from "@/lib/conexaoCaderno";

// Nunca chama redirect() aqui dentro (exceto o guard de sessão abaixo) —
// esta action é invocada direto do client (não via <form action>), mesmo
// padrão de guardarNoDiario/TelaFechamento em app/conversa/actions.ts.
// Quem fecha o modal depois é o componente client (FechamentoTrigger.tsx),
// sem navegação — o fechamento agora é um modal sobre a Home, não uma
// rota própria (ver comentário em FechamentoTrigger.tsx).

/** Traceability pro P7 (memória do Presença, ainda não implementada) —
 * `tipo = "fechamento_dia"` é o que distingue este registro de uma entrada
 * qualquer do Diário quando a memória for construída.
 *
 * Nenhuma constante de valor (só o `type` abaixo) é exportada daqui — um
 * arquivo "use server" só pode exportar funções async; exportar um valor
 * real (ex: um array de respostas) quebra o módulo de forma silenciosa:
 * nenhum erro no build, só um 500 genérico ("Server Components render")
 * na hora de chamar a action, sem stack trace nem log — descoberto
 * testando de verdade. `app/home/FechamentoTrigger.tsx` define as opções
 * localmente. */
export type RespostaRapida = "algo_encontrou_eco" | "percebi_de_outra_maneira" | "nada_em_especial";

const ROTULO_RESPOSTA_RAPIDA: Record<RespostaRapida, string> = {
  algo_encontrou_eco: "algo encontrou eco",
  percebi_de_outra_maneira: "percebi algo de outra maneira",
  nada_em_especial: "nada em especial",
};

/**
 * "Sem obrigatoriedade" (docs/integracao-presente-presenca-decisoes.md,
 * seção do P6): se a pessoa não interagiu com nada — nem resposta rápida,
 * nem texto livre —, não cria linha nenhuma. Nunca salva um valor
 * vazio/default só pra ter registro de que a tela foi aberta.
 *
 * `conteudo` é NOT NULL em caderno_entradas — quando só a resposta rápida
 * foi escolhida (sem texto livre), o rótulo dela vira o conteúdo.
 *
 * Decoplado da lente e da conversa por design: isto é só um insert em
 * caderno_entradas, nunca toca `buscarLenteGenerica`/Cache API nem
 * `api/conversa`. Nenhum caminho de código compartilhado entre os dois.
 */
export async function salvarFechamento(respostaRapida: RespostaRapida | null, textoLivre: string) {
  const texto = textoLivre.trim();
  if (!respostaRapida && !texto) return;

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) redirect("/chegada");

  const [entrada] = await db
    .insert(cadernoEntradas)
    .values({
      pacienteId: profile.id,
      autorTipo: "usuario",
      tipo: "fechamento_dia",
      conteudo: texto || ROTULO_RESPOSTA_RAPIDA[respostaRapida as RespostaRapida],
      fechamentoRespostaRapida: respostaRapida,
    })
    .returning({ id: cadernoEntradas.id });
  if (!entrada) {
    console.error("salvarFechamento: falha ao inserir entrada");
    return;
  }

  // P7 (integracao-presente-presenca-decisoes.md): só entra no pipeline de
  // conexão quando há texto livre de verdade. Um fechamento só-com-rótulo
  // (as 3 strings fixas de resposta rápida) nunca ganha embedding — duas
  // pessoas escolhendo "nada em especial" em dias diferentes não é uma
  // conexão real, é a mesma string de UI repetida. `buscar_conexao_caderno`
  // também exclui `tipo = 'fechamento_dia'` do lado candidato (nunca é o
  // lado citado de volta pra ninguém, mesmo quando ela mesma está
  // buscando) — texto possivelmente influenciado pela lente simbólica
  // nunca é reproduzido como "padrão da pessoa" na UI de conexão.
  if (texto) {
    const { ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(processarConexaoEntrada(db, sessao.user.id, profile.id, entrada.id, texto));
  }
}
