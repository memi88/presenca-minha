import type Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";

import { eq } from "drizzle-orm";
import { cadernoEntradas, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { anthropic } from "@/lib/anthropic";
import { buscarPraticaRelevante } from "@/lib/buscarPratica";
import { avaliarRiscoLlamaGuard } from "@/lib/llamaGuard";
import { buscarLenteGenerica } from "@/lib/present";
import { decidirProtocoloRisco } from "@/lib/protocoloRisco";
import { podeConversar } from "@/lib/rateLimit";
import {
  MODELO_CONVERSA,
  TOOL_CONFIRMAR_PRATICA_MENCIONADA,
  TOOL_SINALIZAR_ENCERRAMENTO,
  TOOL_SINALIZAR_RISCO,
  TOOL_SUGERIR_PRATICA,
  montarSystemPromptConversa,
} from "@/lib/systemPromptConversa";

type MensagemEntrada = { role: "user" | "assistant"; content: string };

// Nunca confia cegamente no client: array não vazio, roles alternando
// (sempre começando por "user"), conteúdo não vazio em cada turno. O
// system prompt e a tool de risco nunca vêm do body — só vivem no servidor.
function corpoValido(mensagens: unknown): mensagens is MensagemEntrada[] {
  if (!Array.isArray(mensagens) || mensagens.length === 0) return false;
  return mensagens.every((m, i) => {
    if (!m || typeof m !== "object") return false;
    const { role, content } = m as Record<string, unknown>;
    const roleEsperado = i % 2 === 0 ? "user" : "assistant";
    return role === roleEsperado && typeof content === "string" && content.trim().length > 0;
  });
}

function linhaNdjson(objeto: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(objeto) + "\n");
}

type EstadoSinalizacao = { riscoSinalizado: boolean; encerramentoSinalizado: boolean };

/**
 * Trecho compartilhado entre a primeira chamada ao Sonnet e a continuação
 * depois do tool_result de sugerir_pratica (P5 Fase A) — texto/risco/
 * encerramento se comportam igual nas duas, então extraído em vez de
 * duplicado (mesmo raciocínio de lib/conexaoCaderno.ts no P7: menos lugar
 * pra uma correção futura ficar esquecida). `estado` é compartilhado entre
 * as duas chamadas de propósito — risco sinalizado na primeira precisa
 * continuar valendo na segunda.
 */
async function processarEventosStream(
  anthropicStream: ReturnType<typeof anthropic.messages.stream>,
  emitir: (objeto: unknown) => void,
  estado: EstadoSinalizacao,
) {
  for await (const event of anthropicStream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      emitir({ tipo: "texto", delta: event.delta.text });
    } else if (
      !estado.riscoSinalizado &&
      event.type === "content_block_start" &&
      event.content_block.type === "tool_use" &&
      event.content_block.name === "sinalizar_risco"
    ) {
      // Sinal estrutural — nunca espera o resto do turno nem completa
      // o ciclo tool_result/continuação. A troca é considerada
      // encerrada aqui; a próxima visita a /conversa começa do zero.
      estado.riscoSinalizado = true;
      emitir({ tipo: "risco" });
    } else if (
      !estado.riscoSinalizado &&
      !estado.encerramentoSinalizado &&
      event.type === "content_block_start" &&
      event.content_block.type === "tool_use" &&
      event.content_block.name === "sinalizar_encerramento"
    ) {
      // Mesmo canal estrutural do risco, mas reversível do lado do
      // client — risco sempre prevalece se as duas chegarem no
      // mesmo turno (checagem !riscoSinalizado acima).
      estado.encerramentoSinalizado = true;
      emitir({ tipo: "fechamento" });
    }
  }
  return anthropicStream.finalMessage();
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) {
    return new Response(null, { status: 401 });
  }

  const corpo = await request.json().catch(() => null);
  if (!corpo || !corpoValido(corpo.mensagens)) {
    return Response.json({ tipo: "erro", mensagem: "Requisição inválida." }, { status: 400 });
  }
  const mensagens: MensagemEntrada[] = corpo.mensagens;

  const db = await getDb();
  const permitido = await podeConversar(db, sessao.user.id);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emitir = (objeto: unknown) => controller.enqueue(linhaNdjson(objeto));

      if (!permitido) {
        emitir({
          tipo: "erro",
          mensagem: "Muitas mensagens em pouco tempo — espera um instante e tenta de novo.",
        });
        controller.close();
        return;
      }

      try {
        // P4 — contexto opcional pro chat (docs/integracao-presente-
        // presenca-decisoes.md, item 7): a lente do dia entra no system
        // prompt só quando existe (fail-open — buscarLenteGenerica nunca
        // lança, degrada pra null). Precisa terminar antes de montar o
        // prompt, então não roda em paralelo ao Sonnet como o Llama Guard
        // roda — é a única espera sequencial nova que o P4 introduz.
        const dailyPresent = await buscarLenteGenerica();
        const systemPrompt = montarSystemPromptConversa(dailyPresent);

        const primeiraStream = anthropic.messages.stream({
          model: MODELO_CONVERSA,
          max_tokens: 4096,
          system: systemPrompt,
          tools: [TOOL_SINALIZAR_RISCO, TOOL_SINALIZAR_ENCERRAMENTO, TOOL_SUGERIR_PRATICA],
          messages: mensagens,
        });
        // Roda em paralelo à resposta do Sonnet, não depois dela — por
        // isso disparado aqui, antes do loop de streaming, e só aguardado
        // no fim. Verifica a conversa da própria pessoa (mensagens), nunca
        // a resposta do turno atual (docs/integracao-presente-presenca-
        // decisoes.md, item 5.1).
        const llamaGuardPromise = avaliarRiscoLlamaGuard(mensagens);

        const estado: EstadoSinalizacao = { riscoSinalizado: false, encerramentoSinalizado: false };
        const mensagemFinal1 = await processarEventosStream(primeiraStream, emitir, estado);

        // P5 Fase A — se o modelo pediu a tool, roda a busca de verdade e
        // manda o resultado numa segunda chamada, pra ele decidir (ou não)
        // mencionar. Nunca se risco já disparou na primeira chamada —
        // mesma prioridade de sempre. tools da segunda chamada
        // deliberadamente não incluem sugerir_pratica de novo: trava o
        // cap de 1 round-trip por rodada estruturalmente, não só por
        // convenção.
        const blocoPratica = mensagemFinal1.content.find(
          (b: Anthropic.ContentBlock): b is Anthropic.ToolUseBlock =>
            b.type === "tool_use" && b.name === "sugerir_pratica",
        );
        if (blocoPratica && !estado.riscoSinalizado) {
          const { situacao } = blocoPratica.input as { situacao?: string };
          const candidatos = situacao ? await buscarPraticaRelevante(db, sessao.user.id, situacao) : [];

          const mensagensContinuacao: Anthropic.MessageParam[] = [
            ...mensagens,
            { role: "assistant", content: mensagemFinal1.content },
            {
              role: "user",
              content: [
                { type: "tool_result", tool_use_id: blocoPratica.id, content: JSON.stringify(candidatos) },
              ],
            },
          ];

          const segundaStream = anthropic.messages.stream({
            model: MODELO_CONVERSA,
            max_tokens: 4096,
            system: systemPrompt,
            tools: [TOOL_SINALIZAR_RISCO, TOOL_SINALIZAR_ENCERRAMENTO, TOOL_CONFIRMAR_PRATICA_MENCIONADA],
            messages: mensagensContinuacao,
          });
          const mensagemFinal2 = await processarEventosStream(segundaStream, emitir, estado);

          if (!estado.riscoSinalizado) {
            const blocoConfirmacao = mensagemFinal2.content.find(
              (b: Anthropic.ContentBlock): b is Anthropic.ToolUseBlock =>
                b.type === "tool_use" && b.name === "confirmar_pratica_mencionada",
            );
            if (blocoConfirmacao) {
              const { biblioteca_id } = blocoConfirmacao.input as { biblioteca_id?: string };
              const candidato = candidatos.find((c) => c.id === biblioteca_id);
              if (candidato) {
                const profile = await db.query.profiles.findFirst({
                  where: eq(profiles.userId, sessao.user.id),
                  columns: { id: true },
                });
                if (profile) {
                  await db.insert(cadernoEntradas).values({
                    pacienteId: profile.id,
                    autorTipo: "usuario",
                    tipo: "pratica_sugerida",
                    conteudo: `Sugestão: ${candidato.titulo ?? "uma prática"}`,
                    bibliotecaRefId: candidato.id,
                  });
                }
              } else {
                console.warn(
                  "confirmar_pratica_mencionada: id não bate com nenhum candidato retornado",
                  biblioteca_id,
                );
              }
            }
          }
        }

        const { sinalizouRisco: llamaSinalizouRisco } = await llamaGuardPromise;
        const decisaoRisco = decidirProtocoloRisco(estado.riscoSinalizado, llamaSinalizouRisco);
        if (decisaoRisco.log) console.warn(decisaoRisco.log);
        if (decisaoRisco.forcarRecursos) {
          estado.riscoSinalizado = true;
          emitir({ tipo: "risco" });
        }

        emitir({ tipo: "fim" });
      } catch (erro) {
        console.error("conversa: falha na chamada ao Sonnet 5", erro);
        emitir({ tipo: "erro", mensagem: "Algo não funcionou. Tenta de novo em instantes." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
