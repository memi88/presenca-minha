import type { NextRequest } from "next/server";

import { createClient } from "@presenca/supabase/server";

import { anthropic } from "@/lib/anthropic";
import { avaliarRiscoLlamaGuard } from "@/lib/llamaGuard";
import { buscarLenteGenerica } from "@/lib/present";
import { decidirProtocoloRisco } from "@/lib/protocoloRisco";
import { podeConversar } from "@/lib/rateLimit";
import {
  MODELO_CONVERSA,
  TOOL_SINALIZAR_ENCERRAMENTO,
  TOOL_SINALIZAR_RISCO,
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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(null, { status: 401 });
  }

  const corpo = await request.json().catch(() => null);
  if (!corpo || !corpoValido(corpo.mensagens)) {
    return Response.json({ tipo: "erro", mensagem: "Requisição inválida." }, { status: 400 });
  }
  const mensagens: MensagemEntrada[] = corpo.mensagens;

  const permitido = await podeConversar(supabase);

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

        const anthropicStream = anthropic.messages.stream({
          model: MODELO_CONVERSA,
          max_tokens: 4096,
          system: montarSystemPromptConversa(dailyPresent),
          tools: [TOOL_SINALIZAR_RISCO, TOOL_SINALIZAR_ENCERRAMENTO],
          messages: mensagens,
        });
        // Roda em paralelo à resposta do Sonnet, não depois dela — por
        // isso disparado aqui, antes do loop de streaming, e só aguardado
        // no fim. Verifica a conversa da própria pessoa (mensagens), nunca
        // a resposta do turno atual (docs/integracao-presente-presenca-
        // decisoes.md, item 5.1).
        const llamaGuardPromise = avaliarRiscoLlamaGuard(mensagens);

        let riscoSinalizado = false;
        let encerramentoSinalizado = false;

        for await (const event of anthropicStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            emitir({ tipo: "texto", delta: event.delta.text });
          } else if (
            !riscoSinalizado &&
            event.type === "content_block_start" &&
            event.content_block.type === "tool_use" &&
            event.content_block.name === "sinalizar_risco"
          ) {
            // Sinal estrutural — nunca espera o resto do turno nem completa
            // o ciclo tool_result/continuação. A troca é considerada
            // encerrada aqui; a próxima visita a /conversa começa do zero.
            riscoSinalizado = true;
            emitir({ tipo: "risco" });
          } else if (
            !riscoSinalizado &&
            !encerramentoSinalizado &&
            event.type === "content_block_start" &&
            event.content_block.type === "tool_use" &&
            event.content_block.name === "sinalizar_encerramento"
          ) {
            // Mesmo canal estrutural do risco, mas reversível do lado do
            // client — risco sempre prevalece se as duas chegarem no
            // mesmo turno (checagem !riscoSinalizado acima).
            encerramentoSinalizado = true;
            emitir({ tipo: "fechamento" });
          }
        }

        const { sinalizouRisco: llamaSinalizouRisco } = await llamaGuardPromise;
        const decisaoRisco = decidirProtocoloRisco(riscoSinalizado, llamaSinalizouRisco);
        if (decisaoRisco.log) console.warn(decisaoRisco.log);
        if (decisaoRisco.forcarRecursos) {
          riscoSinalizado = true;
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
