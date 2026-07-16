import "server-only";

/**
 * Chama o microsserviço de IA (services/ia) pra calcular a configuração de
 * Human Design. Server-only por design — IA_SERVICE_API_KEY nunca pode
 * chegar no bundle do browser.
 *
 * Retorna `null` em vez de lançar quando o serviço não está configurado
 * (IA_SERVICE_URL vazia) ou quando a chamada falha — mesmo espírito de
 * `calcularEmbedding`: os dados de nascimento já foram salvos de qualquer
 * forma, isso não deveria travar a tela de perfil.
 */
export async function calcularConfiguracaoHD(
  dataNascimento: string,
  horaNascimento: string | null,
  localNascimento: string | null,
  latitude: number | null = null,
  longitude: number | null = null,
): Promise<Record<string, unknown> | null> {
  const url = process.env.IA_SERVICE_URL;
  const chave = process.env.IA_SERVICE_API_KEY;
  if (!url || !chave) return null;

  try {
    const resposta = await fetch(`${url.replace(/\/$/, "")}/human-design`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({
        data_nascimento: dataNascimento,
        hora_nascimento: horaNascimento,
        local_nascimento: localNascimento,
        latitude,
        longitude,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!resposta.ok) {
      console.error("calcularConfiguracaoHD: serviço respondeu", resposta.status);
      return null;
    }
    return (await resposta.json()) as Record<string, unknown>;
  } catch (erro) {
    console.error("calcularConfiguracaoHD: falha ao chamar o serviço", erro);
    return null;
  }
}
