import "server-only";

/**
 * Chama o microsserviço de IA (services/ia) pra calcular o embedding de um
 * texto. Server-only por design — IA_SERVICE_API_KEY nunca pode chegar no
 * bundle do browser.
 *
 * Retorna `null` em vez de lançar quando o serviço não está configurado
 * ainda (IA_SERVICE_URL vazia — deploy pendente) ou quando a chamada falha.
 * Uma entrada do Caderno sem embedding ainda é uma entrada válida; a busca
 * semântica (Fase 7) simplesmente não vai encontrá-la até o embedding ser
 * recalculado. Isso não deveria travar a escrita de quem está usando o app.
 */
export async function calcularEmbedding(
  texto: string,
  tipo: "passage" | "query" = "passage",
): Promise<number[] | null> {
  const url = process.env.IA_SERVICE_URL;
  const chave = process.env.IA_SERVICE_API_KEY;
  if (!url || !chave) return null;

  try {
    const resposta = await fetch(`${url.replace(/\/$/, "")}/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({ texto, tipo }),
    });
    if (!resposta.ok) {
      console.error("calcularEmbedding: serviço respondeu", resposta.status);
      return null;
    }
    const dados = await resposta.json();
    return dados.embedding as number[];
  } catch (erro) {
    console.error("calcularEmbedding: falha ao chamar o serviço", erro);
    return null;
  }
}
