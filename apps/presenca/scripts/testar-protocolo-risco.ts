// Testa a decisão do protocolo de risco combinando Llama Guard 3 e a tool
// sinalizar_risco do Sonnet — decisão fechada em
// docs/integracao-presente-presenca-decisoes.md, item 5.1. Não chama
// Anthropic nem Workers AI: exercita só a função pura que decide o que
// fazer a partir dos dois sinais já resolvidos (lib/llamaGuard.ts).
//
// Uso: npx tsx apps/presenca/scripts/testar-protocolo-risco.ts

import { decidirProtocoloRisco } from "../lib/protocoloRisco";

let falhas = 0;

function checar(nome: string, condicao: boolean) {
  console.log(`${condicao ? "✅" : "❌"} ${nome}`);
  if (!condicao) falhas++;
}

// Cenário pedido 1: Llama sinaliza, Sonnet não chamou sinalizar_risco —
// força Recursos mesmo assim (dois caminhos independentes pro mesmo destino).
{
  const decisao = decidirProtocoloRisco(false, true);
  checar("Llama sinaliza + Sonnet não sinalizou → força Recursos", decisao.forcarRecursos === true);
  checar("...e registra o desacordo em log", decisao.log !== null);
}

// Cenário pedido 2: os dois concordam que há risco — comportamento
// inalterado (Sonnet já acionou Recursos sozinho, nada extra a fazer).
{
  const decisao = decidirProtocoloRisco(true, true);
  checar("Ambos sinalizam risco → não força de novo (Sonnet já acionou)", decisao.forcarRecursos === false);
  checar("...sem log (concordância não é desacordo)", decisao.log === null);
}

// Cenário pedido 3: nenhum dos dois sinaliza — conversa segue normal.
{
  const decisao = decidirProtocoloRisco(false, false);
  checar("Nenhum sinaliza → não força Recursos", decisao.forcarRecursos === false);
  checar("...sem log", decisao.log === null);
}

// Cenário extra, mesmo princípio em direção oposta: Sonnet sinaliza, Llama
// não — Recursos já foi acionado pelo Sonnet; só o desacordo precisa virar log.
{
  const decisao = decidirProtocoloRisco(true, false);
  checar("Sonnet sinaliza + Llama não → não força de novo (já acionado)", decisao.forcarRecursos === false);
  checar("...mas registra o desacordo em log", decisao.log !== null);
}

console.log(falhas === 0 ? "\nTodos os cenários passaram." : `\n${falhas} cenário(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
