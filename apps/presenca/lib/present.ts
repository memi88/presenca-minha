import "server-only";

/** `caches.default` (Cache API nativa do Workers) não faz parte do DOM lib
 * padrão — só `caches`/`Cache`/`CacheStorage` sem `.default`, que é
 * extensão específica da Cloudflare. */
declare global {
  interface CacheStorage {
    default: Cache;
  }
}

/** Shape confirmado contra a resposta real de produção (2026-08-31,
 * `https://alpha.presenca.app/api/publico/hoje-dreamspell`). `selo_natal`/
 * `relation_mode`/`authorized_relations` vêm sempre nulos/vazios no
 * endpoint genérico (P1-P7) — só o endpoint personalizado (P8) os
 * preenche. `qa_status`/`prompt_version` não aparecem neste payload público
 * (confirmado pelo Guilherme: já removidos/nunca expostos do lado do
 * Presente) — não precisam de tratamento aqui. */
export type DerivationSummary = {
  tipoDia: string;
  tomHoje: string;
  seloHoje: string;
  seloNatal: string | null;
  relationMode: string | null;
  textoCuradoTom: string;
  textoCuradoSelo: string;
  authorizedRelations: string[];
};

export type DailyPresent = {
  reflection: string;
  question: string;
  derivationSummary: DerivationSummary;
};

/**
 * Data civil em America/Sao_Paulo (mesmo fuso do Presente), formato
 * YYYY-MM-DD — chave do dia pra tudo que depende de "qual lente é a de
 * hoje": o cache HTTP abaixo e a tabela `lente_reacoes`
 * (app/lente-do-dia/actions.ts). Precisa ser a mesma função nos dois
 * lugares — se a reação usasse outro cálculo de "hoje", um dia poderia
 * ficar com reação gravada pro dia errado perto da virada da meia-noite.
 */
export function dataCivilHoje(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/**
 * Chave de cache com a data civil em America/Sao_Paulo — não é um TTL
 * numérico rolante: na virada do dia, uma chave nova passa a ser usada,
 * então nunca serve a lente de ontem depois da meia-noite. A URL é só uma
 * chave interna, nunca chamada de verdade.
 */
function chaveCacheLenteHoje(): Request {
  return new Request(`https://cache.interno.presenca.app/lente-do-dia/${dataCivilHoje()}`);
}

/**
 * Cache real via Cache API nativa do Workers (`caches.default`, sem
 * binding novo no `wrangler.jsonc` — diferente de KV/R2, já vem disponível
 * no runtime). Substitui `next: { revalidate }`, que **não tem efeito
 * neste Worker**: sem KV/R2 configurado pro incremental cache do OpenNext,
 * `resolveIncrementalCache` (`@opennextjs/cloudflare/dist/api/config.js`)
 * cai no default `"dummy"`, que não faz nada — confirmado lendo o pacote
 * instalado, não suposição.
 *
 * Sem isso, cada mensagem de conversa disparava uma chamada de rede
 * síncrona ao Presente antes do Sonnet sequer começar a responder — uma
 * instabilidade no Railway do Presente afetaria a latência de toda
 * conversa em andamento, turno a turno, categoria de risco bem maior que a
 * Home não mostrar a lente por um momento.
 */
async function buscarPayloadComCache(url: string): Promise<unknown | null> {
  // `caches.default` só existe no runtime real dos Workers — em `pnpm dev`
  // (Next.js puro, sem o adapter do OpenNext) `caches` nem está definida, e
  // acessá-la direto lança ReferenceError antes mesmo do fetch acontecer
  // (silenciado pelo catch de `buscarLenteGenerica`, então a Lente do dia
  // simplesmente nunca aparecia em dev local, sem erro visível na tela).
  // Fallback: busca sem cache — correto em dev (dado sempre fresco) e sem
  // efeito em produção real (lá `caches` sempre existe).
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const chave = chaveCacheLenteHoje();

  const emCache = await cache?.match(chave);
  if (emCache) return emCache.json();

  const resposta = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!resposta.ok) {
    console.error("buscarLenteGenerica: serviço respondeu", resposta.status);
    return null;
  }
  const bruto = await resposta.text();
  await cache?.put(
    chave,
    new Response(bruto, {
      headers: { "content-type": "application/json", "cache-control": "public, max-age=86400" },
    }),
  );
  return JSON.parse(bruto);
}

/**
 * Busca a lente genérica do dia — endpoint público, sem autenticação,
 * `nivel_relacao = NONE` sempre (P1-P7; a versão personalizada por Selo
 * natal é P8, endpoint e fluxo de consentimento à parte). Cacheada por dia
 * civil em America/Sao_Paulo e compartilhada entre todos os usuários do
 * Presença (`buscarPayloadComCache`) — uma chamada de rede por dia basta
 * pro app inteiro, não uma por mensagem/visita.
 *
 * Caminho `/api/publico/hoje-dreamspell` confirmado em produção — a
 * decisão de renomear pra `/api/lente-do-dia`
 * (`docs/integracao-presente-presenca-decisoes.md`, item 2) ainda não foi
 * refletida do lado do motor Presente. Como essa chamada é sempre
 * servidor-a-servidor (`server-only`, nunca chega no bundle do browser), o
 * risco original que motivou a decisão (usuário inspecionando a URL) não
 * se aplica a esta chamada — só valeria pra uma rota nossa client-facing,
 * que não existe. Ver nota na "Status de implementação" do doc de decisões.
 *
 * Retorna `null` em vez de lançar quando `PRESENTE_SERVICE_URL` não está
 * configurada ainda ou quando a chamada falha — a Home degrada mostrando-se
 * sem a seção da lente, mesmo espírito de `calcularEmbedding`/
 * `calcularConfiguracaoHD` (fail-open, decisão item 6).
 */
export async function buscarLenteGenerica(): Promise<DailyPresent | null> {
  const url = process.env.PRESENTE_SERVICE_URL;
  if (!url) return null;

  try {
    const dados = (await buscarPayloadComCache(`${url.replace(/\/$/, "")}/api/publico/hoje-dreamspell`)) as
      | Record<string, unknown>
      | null;
    if (!dados) return null;
    const ds = dados.derivation_summary as Record<string, unknown> | undefined;
    if (!dados.reflection || !dados.question || !ds) {
      console.error("buscarLenteGenerica: payload sem reflection/question/derivation_summary");
      return null;
    }
    return {
      reflection: dados.reflection as string,
      question: dados.question as string,
      derivationSummary: {
        tipoDia: ds.tipo_dia as string,
        tomHoje: ds.tom_hoje as string,
        seloHoje: ds.selo_hoje as string,
        seloNatal: (ds.selo_natal as string | null) ?? null,
        relationMode: (ds.relation_mode as string | null) ?? null,
        textoCuradoTom: ds.texto_curado_tom as string,
        textoCuradoSelo: ds.texto_curado_selo as string,
        authorizedRelations: (ds.authorized_relations as string[]) ?? [],
      },
    };
  } catch (erro) {
    console.error("buscarLenteGenerica: falha ao chamar o serviço", erro);
    return null;
  }
}
