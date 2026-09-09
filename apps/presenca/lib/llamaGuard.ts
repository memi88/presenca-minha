import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Binding mínimo que a chamada usa — evita depender de `@cloudflare/workers-types`
 * só por causa desse único método. Shape confirmado contra a documentação
 * do modelo (`developers.cloudflare.com/workers-ai/models/llama-guard-3-8b`). */
type WorkersAiBinding = {
  run(
    model: "@cf/meta/llama-guard-3-8b",
    input: { messages: { role: "user" | "assistant"; content: string }[]; max_tokens?: number },
  ): Promise<{ response?: string }>;
};

declare global {
  interface CloudflareEnv {
    AI?: WorkersAiBinding;
  }
}

export type ClassificacaoLlamaGuard = { sinalizouRisco: boolean; bruto: string | null };

/**
 * Segunda camada de verificação de risco, em paralelo à resposta do Sonnet
 * (`docs/presenca-ia-arquitetura.md` §7) — decisão de comportamento fechada
 * em `docs/integracao-presente-presenca-decisoes.md`, item 5.1: qualquer
 * classificação "unsafe" força o caminho de Recursos, sem distinguir
 * categoria, sem exceção — é reforço do protocolo de risco existente
 * (tool `sinalizar_risco` do próprio Sonnet), nunca substituição.
 *
 * Classifica a conversa do jeito que o Presença mais precisa verificar:
 * sinal de risco vindo da própria pessoa, não conteúdo gerado pela IA — por
 * isso recebe `mensagens` (o histórico enviado à Sonnet), nunca a resposta
 * do turno atual, o que também é o que permite rodar em paralelo de
 * verdade, sem esperar o Sonnet terminar de responder.
 *
 * Fail-open: sem o binding `AI` (ex: `next dev` sem `wrangler` configurado
 * pra isso) ou com a chamada falhando, retorna `sinalizouRisco: false` —
 * essa camada nunca bloqueia a conversa por falhar; o protocolo principal
 * (tool `sinalizar_risco`) continua de pé independente disso.
 */
export async function avaliarRiscoLlamaGuard(
  mensagens: { role: "user" | "assistant"; content: string }[],
): Promise<ClassificacaoLlamaGuard> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const ai = env.AI;
    if (!ai) return { sinalizouRisco: false, bruto: null };

    const resultado = await ai.run("@cf/meta/llama-guard-3-8b", {
      messages: mensagens,
      max_tokens: 20,
    });
    const bruto = resultado.response ?? null;
    return { sinalizouRisco: !!bruto && bruto.trim().toLowerCase().startsWith("unsafe"), bruto };
  } catch (erro) {
    console.error("avaliarRiscoLlamaGuard: falha ao chamar Workers AI", erro);
    return { sinalizouRisco: false, bruto: null };
  }
}
