import type { R2Bucket } from "@cloudflare/workers-types";

// Bucket único `presenca-media`, compartilhado pelos dois Workers (mesmo
// padrão do D1) — ver comentário em apps/*/wrangler.jsonc. Guardamos só a
// CHAVE do objeto nas colunas `foto_chave`/`capa_chave` (não a URL
// pronta): cada app serve o binding via a própria rota
// `app/imagens/[...chave]/route.ts`, então a URL final depende de em qual
// domínio a imagem é exibida.

const TIPOS_ACEITOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class ArquivoInvalidoError extends Error {}

/**
 * Valida e grava uma imagem no R2, devolvendo a chave gravada. `prefixo`
 * separa o namespace por dono (ex: "profissionais/{id}",
 * "biblioteca/{id}") — cada chamada gera um sufixo novo (timestamp), então
 * o chamador precisa apagar a chave antiga (`apagarImagem`) depois de
 * trocar com sucesso, senão o objeto velho fica órfão no bucket.
 */
export async function salvarImagem(bucket: R2Bucket, prefixo: string, arquivo: File): Promise<string> {
  if (!TIPOS_ACEITOS.has(arquivo.type)) {
    throw new ArquivoInvalidoError("Formato não aceito — envie JPEG, PNG ou WEBP.");
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    throw new ArquivoInvalidoError("Arquivo maior que 5MB.");
  }
  if (arquivo.size === 0) {
    throw new ArquivoInvalidoError("Arquivo vazio.");
  }

  const extensao = EXTENSAO_POR_TIPO[arquivo.type];
  const chave = `${prefixo}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extensao}`;

  await bucket.put(chave, await arquivo.arrayBuffer(), {
    httpMetadata: { contentType: arquivo.type },
  });

  return chave;
}

/** Sem-graça de propósito (mesmo espírito de lib/rateLimit.ts): apagar uma
 * chave órfã não deveria travar a ação principal (trocar a foto/capa) se o
 * R2 falhar por qualquer motivo — loga e segue. */
export async function apagarImagem(bucket: R2Bucket, chave: string | null): Promise<void> {
  if (!chave) return;
  try {
    await bucket.delete(chave);
  } catch (erro) {
    console.error("apagarImagem: falha ao apagar do R2", chave, erro);
  }
}

export type TipoMidia = "audio" | "video";

const TIPOS_MIDIA_ACEITOS: Record<string, TipoMidia> = {
  "audio/mpeg": "audio",
  "audio/mp4": "audio",
  "audio/wav": "audio",
  "audio/ogg": "audio",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
};

const EXTENSAO_POR_TIPO_MIDIA: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

// Bem maior que imagem (5MB) — primeira vez que o app aceita mídia
// grande. 50MB é um teto de partida conservador (upload de tiro único,
// sem multipart, pra não estourar limite de corpo de requisição do
// Worker) — dá pra subir depois se o conteúdo real precisar.
const TAMANHO_MAXIMO_MIDIA_BYTES = 50 * 1024 * 1024;

/**
 * Mesma ideia de `salvarImagem`, pro áudio/vídeo de uma prática (campo
 * "Conteúdo" do cadastro, apps/cuida/app/biblioteca/nova) — bucket e
 * padrão de chave iguais, tipos aceitos e limite de tamanho diferentes.
 * Devolve o tipo detectado junto (`biblioteca.midiaTipo`), sem precisar
 * sniff de extensão na hora de exibir.
 */
export async function salvarMidia(
  bucket: R2Bucket,
  prefixo: string,
  arquivo: File,
): Promise<{ chave: string; tipo: TipoMidia }> {
  const tipo = TIPOS_MIDIA_ACEITOS[arquivo.type];
  if (!tipo) {
    throw new ArquivoInvalidoError("Formato não aceito — envie MP3/WAV/OGG (áudio) ou MP4/WEBM/MOV (vídeo).");
  }
  if (arquivo.size > TAMANHO_MAXIMO_MIDIA_BYTES) {
    throw new ArquivoInvalidoError("Arquivo maior que 50MB.");
  }
  if (arquivo.size === 0) {
    throw new ArquivoInvalidoError("Arquivo vazio.");
  }

  const extensao = EXTENSAO_POR_TIPO_MIDIA[arquivo.type];
  const chave = `${prefixo}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extensao}`;

  await bucket.put(chave, await arquivo.arrayBuffer(), {
    httpMetadata: { contentType: arquivo.type },
  });

  return { chave, tipo };
}
