import type { NextRequest } from "next/server";

import { createClient } from "@presenca/supabase/server";

import { anthropic } from "@/lib/anthropic";
import { podeConversar } from "@/lib/rateLimit";
import { MODELO_CONVERSA, SYSTEM_PROMPT_CONVERSA, TOOL_SINALIZAR_RISCO } from "@/lib/systemPromptConversa";

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
        const anthropicStream = anthropic.messages.stream({
          model: MODELO_CONVERSA,
          max_tokens: 4096,
          system: SYSTEM_PROMPT_CONVERSA,
          tools: [TOOL_SINALIZAR_RISCO],
          messages: mensagens,
        });

        let riscoSinalizado = false;

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
          }
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
