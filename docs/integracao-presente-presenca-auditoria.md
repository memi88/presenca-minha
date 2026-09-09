# Auditoria — Integração Presente → Presença

> Auditoria gerada em 2026-08-30, sem nenhuma implementação — aguarda decisões de produto antes de qualquer código, conforme seção 16 do documento original (`docs/integracao-presente-presenca.md`).

---

## A. Estado atual

### Home
`apps/presenca/app/home/page.tsx` é um Server Component que, a cada carregamento: lê `profiles` (mood, `ultimo_destino`, streak, `data_nascimento`), decide se redireciona pro check-in (`precisaVisitaCheckin`, 2+ dias sem visita), calcula `headline` + ordem dos 4 destinos via `lib/menuHome.ts` (`ordemPorMood`/`ordemComDestaque`), e grava `ultima_visita_em`/streak de volta no mesmo request. Não existe hoje nenhum bloco de "lente"/reflexão/pergunta do dia — a Home é só saudação + headline + 4 pílulas (`livro`, `pratica`, `escrever`, `conversar`) + convites de conversão/nascimento + banner de PWA (`InstalarPWABanner`, ver nota de escopo abaixo). Não há chamada de rede além do Supabase nesta rota — nenhum fetch a serviço externo acontece na Home hoje.

### Check-in/humor
`lib/checkin.ts` define dois relógios independentes: `precisaCheckin` (12h — "o humor ainda está fresco pra ordenar o menu?") e `precisaVisitaCheckin` (2 dias — "precisa responder de novo?"). O enum vive só como union de strings soltas em `apps/presenca/app/hoje/page.tsx:10-16` (`confuso | em_paz | cansado | curioso | nao_sei`), gravado em `profiles.presenca_hoje`/`presenca_hoje_em` via `registrarPresenca` (Server Action em `app/hoje/actions.ts`, não lida mas referenciada). **Não há schema/enum formal no banco** — é `text` livre (confirmar em `supabase/migrations/20260710174036_fase6_checkin_presenca.sql`), então qualquer migração de vocabulário é só constraint + valores, sem tipo a alterar.

### Mecanismo de recomendação
`apps/presenca/app/livro-vivo/page.tsx:13-16,53-59` (`tagDoMomento`) **reaproveita o próprio valor de `profiles.presenca_hoje` como tag**, comparando direto contra `biblioteca.tags_momento_vida` (`text[]`, schema em `supabase/migrations/20260710015241_fase0_schema_inicial.sql:107`). `apps/presenca/app/praticas/page.tsx` lista da `biblioteca` sem esse filtro de tag (só `tipo = 'pratica'` + `publicado = true`) — a ordenação por momento hoje só existe no Livro Vivo, não em Práticas.

**Correção pós-auditoria (2026-08-30):** o achado abaixo, como escrito originalmente, atribuía a `integracao-presente-presenca.md` uma "seção 0, item 1" que assumiria `tags_contexto` como pré-requisito. Isso está errado — conferido contra o texto real do documento, essa seção/item não existe nele. O trecho citado ("Classificação de sinais reaproveita `tags_contexto`...") pertence a `docs/presenca-organizacoes.md` (extensão separada, não relacionada a esta integração), que esta auditoria confundiu ao vasculhar `docs/` em busca de contexto de custo. Ver `integracao-presente-presenca-decisoes.md`, item 1, para o registro da decisão corrigida.

**Achado revisado: `tags_contexto` não existe em lugar nenhum do repositório** (`grep -rn "tags_contexto"` em `apps/`, `packages/`, `supabase/` retorna zero ocorrências de código real, só documentação) **e, diferente do que esta auditoria afirmou antes da correção acima, o documento de integração Presente→Presença nunca assumiu essa dependência** — quem assume é `presenca-organizacoes.md`, um documento não relacionado. `caderno_entradas` (schema em `supabase/migrations/20260710015241_fase0_schema_inicial.sql:131-142`) de fato não tem essa coluna, mas isso nunca foi um pré-requisito real desta integração — era um falso positivo da auditoria. O único vocabulário de "momento" que existe de fato é o dos 5 valores do check-in (`confuso`/`em_paz`/`cansado`/`curioso`/`nao_sei`), que é sobre estado emocional do dia, não sobre domínio de vida (trabalho/relacionamento/etc.).

### Chat
`apps/presenca/app/api/conversa/route.ts` é um Route Handler stateless: recebe `mensagens` do client, valida formato (`corpoValido`), chama `anthropic.messages.stream` com `system: SYSTEM_PROMPT_CONVERSA` fixo (`lib/systemPromptConversa.ts`) + duas tools estruturais (`sinalizar_risco`, `sinalizar_encerramento`) e faz streaming NDJSON de volta. **Não há nenhuma injeção de contexto além do próprio histórico de mensagens da sessão** — nem `arrival_state`, nem mood do check-in, nem busca semântica na Biblioteca, nem histórico do Caderno. Isso contradiz o que `docs/presenca-ia-arquitetura.md:44-52` descreve como arquitetura pretendida ("busca no núcleo Presença... quando a conversa chega num ponto de sugerir algo concreto") — **essa busca pontual não está implementada no route.ts atual**, é doc de intenção, não estado real. Isso importa diretamente pra seção 5 do documento de integração ("Ponte Presente → Conversa"): hoje não existe mecanismo nenhum de passar contexto estruturado pro system prompt por turno — seria a primeira vez que isso é construído, não uma extensão de algo existente.

As duas tools (`TOOL_SINALIZAR_RISCO`, `TOOL_SINALIZAR_ENCERRAMENTO`) seguem um padrão relevante pro P4 (contexto opcional pro chat): são canais estruturais sem side-effect real, cujo comportamento de destino é hardcoded no client (`app/conversa/ConversaExperiencia.tsx`, não lida agora mas referenciada no comentário de `systemPromptConversa.ts:272-276`), nunca decidido pelo modelo. O mesmo padrão (tool estrutural + destino fixo no código) é candidato natural pra "Conversar sobre isso" (seção 5 do doc de integração).

### Práticas / Livro Vivo
Ambos são listagens simples da `biblioteca` (SQL puro, sem LLM na listagem) — `praticas/page.tsx:17-31`, `livro-vivo/page.tsx:25-38`. `PainelPratica.tsx`/`PainelLeitura.tsx` (não lidos em detalhe nesta auditoria) renderizam a leitura ativa. O botão "guardar" cria uma entrada em `caderno_entradas` com `biblioteca_ref_id`, mesmo pipeline de embedding do Diário.

### Memória/Caderno
`app/diario/actions.ts:47-73` (`processarConexaoEntrada`) é o mecanismo real de "memória do Presença" que o documento de integração distingue da memória do motor Presente (seção 10). Fluxo: ao salvar, calcula embedding via `lib/embed.ts` (fire-and-forget via `ctx.waitUntil`, não bloqueia a resposta), chama a RPC `buscar_conexao_caderno` (exclui a própria entrada), grava `conexao_conteudo` na entrada se achar correspondência acima do limiar. Roda **depois** de a entrada já estar salva, nunca em tempo real. Essa arquitetura já está estruturalmente separada do que seria o motor Presente (RPC própria, tabela própria, sem cruzar com histórico de terceiros) — alinhado com o que a seção 10 do doc pede, sem exigir mudança.

### Banco / RLS
Padrão consistente em todo o schema (`supabase/migrations/20260710015241_fase0_schema_inicial.sql`): tabelas sensíveis (`biblioteca`) só têm policy de `select`, escrita é `revoke all` + só via `service_role` (nunca client-side); tabelas com múltiplos papéis (`vinculos`, `caderno_entradas`) usam funções `security definer` pra evitar recursão de RLS (ver bug documentado no checklist, Fase 4). Qualquer tabela nova pro `daily_present`/cache do Presente ou pro estado de consentimento (seção F/P8) deveria seguir esse mesmo padrão: RLS restrita a `auth.uid()`, sem policy de insert/update client-side se o dado for escrito por infra (análogo à Biblioteca).

### APIs / padrão de proxy autenticado
Só existem 2 Route Handlers hoje: `app/api/conversa/route.ts` (streaming) e `app/api/geocoding/route.ts` (proxy autenticado pro Photon, nunca chamado direto do browser). As chamadas ao microsserviço `services/ia` (Railway) **não passam por Route Handler** — `lib/embed.ts` e `lib/humanDesign.ts` (mesmo padrão: `server-only`, env `IA_SERVICE_URL`/`IA_SERVICE_API_KEY`, header `Bearer`, `AbortSignal.timeout(15_000)`, retorno gracioso `null` em falha, log de erro) são chamados direto de Server Actions/Server Components. Uma chamada ao motor Presente (também Railway, conforme o doc) deveria seguir esse mesmo padrão de lib server-only — **exceto** o endpoint genérico (`GET /api/publico/hoje-dreamspell`), que por ser cacheável por 1 dia e compartilhado entre todos os usuários é candidato real a um Route Handler próprio com `Cache-Control`/`revalidate`, diferente do padrão atual (que sempre busca fresco por request).

### Analytics
**Não existe nenhum mecanismo de analytics/telemetria no repositório.** Busca por `analytics|posthog|mixpanel|gtag|dataLayer` em `apps/` não retorna nenhuma ocorrência em código-fonte real (só falsos positivos em artefatos de build/`.tsbuildinfo`). As métricas pedidas na seção 15 do doc de integração (lente exibida? abriu Entender? iniciou conversa a partir da lente? etc.) não têm hoje onde pendurar — não é questão de "adicionar mais um evento", é decidir a solução mínima do zero (tabela própria de eventos em Supabase vs. serviço externo) antes de instrumentar qualquer coisa.

### Infra de IA / rate limiting
Dupla camada já estabelecida: `services/ia` tem rate limit por IP (`slowapi`, 20/min `/embed`, 10/min `/human-design`); `lib/rateLimit.ts` adiciona rate limit por usuário via RPC (`pode_calcular_embedding`, `pode_conversar`), fail-open (libera se a própria checagem falhar) — exceto uma nota explícita no código (`rateLimit.ts:27-34`) de que isso é decisão deliberada pra embedding mas "vale revisitar pra fail-closed" pro caso de conversa, por ser mais caro por chamada. Uma chamada nova ao motor Presente (P1) deveria decidir explicitamente fail-open vs. fail-closed, já que o endpoint genérico é barato (cache 1 dia compartilhado) mas o personalizado (P8) escala com base de usuários.

### Estimativa de custo existente
`docs/presenca-ia-arquitetura.md:77-88` já tem uma estimativa completa pro piloto (3 terapeutas + 15-20 pacientes): Sonnet 5 conversa ~$25-35/mês (100 msgs/dia), Haiku 4.5 microcopy ~$3-6/mês, Cloudflare Workers AI (Llama Guard 3) ~$0 (free tier), microsserviço Python ~$5-7/mês. **Total ~$35-45/mês.** Essa é a baseline usada no recálculo da seção G1 abaixo.

### Consentimento existente
Não existe hoje nenhuma coluna de consentimento rastreado (`consentiu_*` boolean/timestamp) em `profiles`. O padrão real é: checkbox obrigatório no momento da ação específica, texto de consentimento próprio por contexto (`chegada/CadastroForm.tsx` — consentimento geral do app; `terapia/ConectarForm.tsx` — consentimento específico de conectar com profissional; `convite/[token]/ConfirmarConviteForm.tsx` — confirmação de pré-cadastro) — **gate de submissão do formulário, não registro persistente de "quando/o quê a pessoa consentiu"**. Pra Design Humano especificamente, não há checkbox de consentimento dedicado hoje — preencher `/perfil/nascimento` (`lib/nascimento.ts`) já é, na prática, a ação que consente e dispara o cálculo, sem confirmação separada. Ou seja: **o pedido do doc (seção B/F, "estado de consentimento rastreável pra reuso da data de nascimento na lente do Presente") não tem nenhum precedente técnico direto pra reaproveitar** — teria que ser a primeira coluna de consentimento persistente do projeto, não uma extensão de um mecanismo existente.

---

## B. Impacto

**O que a integração exige criar (nada disso existe hoje):**
- Domínio `PresenceDailyContext` inteiro (tipo, montagem, injeção no prompt) — hoje o chat não recebe nenhum contexto estruturado além do histórico de mensagens.
- ~~`tags_contexto` em `caderno_entradas`~~ — **removido, ver correção em A**: não é pré-requisito desta integração; a citação original veio de um documento diferente (`presenca-organizacoes.md`).
- Cliente HTTP pro motor Presente (Railway) — seguindo o padrão `lib/embed.ts`, dois métodos (genérico sem auth, personalizado com body).
- Mecanismo de cache do endpoint genérico (1 dia, compartilhado) — hoje nenhuma chamada externa do projeto é cacheada dessa forma; todas são fetch-per-request com fallback gracioso.
- Estado de consentimento persistente (P8) — primeira coluna desse tipo no projeto.
- Qualquer instrumentação de métricas (seção 15) — analytics não existe, ponto de partida é zero.
- Migration nova pra armazenar (ou não) o `DailyPresent` do dia — decisão em aberto: cachear no Supabase (nova tabela) vs. só no client/edge cache do endpoint genérico. Ver seção C.

**O que pode ser reaproveitado sem mudança:**
- Padrão de proxy autenticado server-only (`lib/embed.ts`/`lib/humanDesign.ts`) — molde direto pro cliente do motor Presente.
- Padrão de tool estrutural + destino hardcoded no client (`sinalizar_risco`/`sinalizar_encerramento`) — molde direto pro "Conversar sobre isso".
- Mecanismo de memória longitudinal do Diário (`buscar_conexao_caderno`) — já estruturalmente isolado do que seria a "memória do motor Presente" (que continua `memory_used = false`), sem necessidade de refatoração pra respeitar a separação pedida na seção 10.
- Padrão de checkbox de consentimento específico por contexto (UI) — reaproveitável como *padrão visual/UX*, mas o registro persistente (booleano gravado) é novo.
- RLS/`security definer` — padrão a replicar pra qualquer tabela nova.

---

## C. Arquitetura proposta

```
DailyPresent (motor Presente, Railway)
        │
        ├── GET /api/publico/hoje-dreamspell  (sem auth, cache 1 dia, compartilhado)
        │        └── lib/present.ts → buscarLeituraGenerica()
        │              cache: Route Handler próprio em apps/presenca/app/api/dreamspell-hoje/route.ts
        │              (nome sugerido — não expor o termo "dreamspell" na rota pública seria mais
        │              consistente com a seção 2 do doc, "a experiência deve funcionar sem a pessoa
        │              precisar conhecer Dreamspell" — sugiro renomear pra algo como /api/lente-do-dia)
        │
        └── POST /api/presenca/hoje-dreamspell-personalizado (body: data_nascimento)
                 └── lib/present.ts → buscarLeituraPersonalizada(dataNascimento)
                       só chamado se profiles.consentiu_lente_presente = true (P8)
                       cache: por pessoa, 1 dia — candidato a nova coluna
                       profiles.lente_presente_cache jsonb + profiles.lente_presente_cache_em,
                       mesmo padrão que configuracao_hd (calculado e persistido, não refetchado)
                       ao invés de tabela separada — mais simples, sem migration extra de tabela
```

`PresenceDailyContext` como tipo TypeScript (não tabela — é um objeto montado por request, análogo ao que `menuHome.ts` já monta pra decidir a ordem da Home):

```ts
// lib/presenceDailyContext.ts (novo)
type PresenceDailyContext = {
  arrivalState: string | null;        // profiles.presenca_hoje, reaproveitado
  dailyPresent: {
    reflection: string;
    question: string;
    humanExperience: string;
  } | null;                            // null se motor Presente falhar — mesma filosofia de calcularEmbedding
};
```

`qa_status`/`prompt_version`/`derivation_summary` nunca cruzam a fronteira do `lib/present.ts` — ficam só em log (`console.error`/`console.log` server-side), igual ao padrão de erro de `lib/embed.ts`. Nenhum desses três campos entra no tipo `PresenceDailyContext` nem no prompt.

**Onde fica o estado de consentimento (P8):** nova coluna `profiles.consentiu_lente_presente_em timestamptz` (nulo = não consentiu), seguindo o padrão de `lembrete_nascimento_em`/`lembrete_conversao_em` já existente (timestamp nulo como estado binário + data). Distinta de `configuracao_hd` (calibração de Design Humano) — mesma data de nascimento, finalidade diferente, exatamente como o doc pede. Checkbox dedicado no fluxo (provavelmente dentro de "Entender de onde vem", seção E) segue o padrão visual de `ConectarForm.tsx`/`CadastroForm.tsx`.

---

## D. Fluxo de dados

```
Present Engine (Railway)
   → GET /api/publico/hoje-dreamspell  (P1-P7, genérico, cache 1 dia)
   → lib/present.ts (server-only, mesmo padrão de lib/embed.ts)
   → PresenceDailyContext montado em app/home/page.tsx (Server Component,
     mesmo lugar onde hoje profile/streak/destinos já são montados)
   → renderizado como bloco "Uma lente para hoje" na Home (novo)
   → "Conversar sobre isso" → app/conversa/ (precisa aceitar contexto inicial
     — hoje ConversaExperiencia.tsx só recebe histórico vazio; precisaria
     receber PresenceDailyContext serializado e a rota /api/conversa/route.ts
     precisaria injetar isso no system prompt por turno, não só o fixo atual)
   → Practice: nenhuma mudança estrutural — a lente vira "contexto secundário"
     na escolha de prática, mas a escolha em si continua sendo SQL sobre
     biblioteca (seção 8 do doc já deixa isso explícito: não é Kin→prática)
   → Daily Reflection (fechamento leve, seção 9) — novo, análogo à Tela de
     Fechamento da Conversa já existente (Fase 10), mas fora do chat
   → Presence Memory: sem mudança — buscar_conexao_caderno já opera só sobre
     caderno_entradas, nunca sobre o resultado do motor Presente
```

---

## E. UX

- **Home:** bloco "Uma lente para hoje" entra entre o `headline` atual e as 4 pílulas (`home/page.tsx:210-234`), como uma seção nova — não substitui nada existente. Precisa decidir o que acontece quando `dailyPresent === null` (motor Presente fora do ar ou ainda não chamado): a seção inteira some (mesma filosofia de "degradação graciosa" de `calcularEmbedding`/`calcularConfiguracaoHD` — nunca mostrar loading infinito nem erro visível).
- **"Entender de onde vem":** rota nova (`/lente` ou dentro de `/perfil`?) — decisão de produto em aberto, ver seção G.
- **"Conversar sobre isso":** CTA que leva a `/conversa` já carregando o `PresenceDailyContext` (precisa de um mecanismo de handoff — query param assinado, ou salvar em `profiles`/sessão e a rota `/conversa` ler no server antes de montar `ConversaExperiencia`).
- **Fechamento do dia:** nova pergunta leve, provavelmente reaproveitando o padrão visual da Tela de Fechamento da Conversa (Fase 10) mas fora do fluxo de chat — talvez como card na Home no fim do dia, ou gatilho separado. Não detalhado no doc além do conceito.
- **Frente do check-in ("Como você chega hoje?"):** conforme o próprio doc determina, **não desenhar aqui** — é frente própria, com plano de migração dedicado (ver risco de schema/enum abaixo).

---

## F. Plano incremental (revisado com base no código real)

- **P1 — `DailyPresent` no domínio Presença.** Criar `lib/present.ts` (padrão `lib/embed.ts`), variável de ambiente `PRESENTE_SERVICE_URL`, sem UI ainda. Trivial de implementar, zero dependência de `tags_contexto`.
- **P2 — exibir lente/pergunta na Home.** Bloco novo em `home/page.tsx`, fetch do endpoint genérico com fallback gracioso. **Não depende de `tags_contexto`** (o endpoint genérico não usa classificação por sinal — `nivel_relacao = NONE` sempre).
- **P3 — criar `PresenceDailyContext`.** Tipo TS + montagem em `home/page.tsx`. Sem storage novo se P1/P2 já buscam fresco a cada visita (respeitando o cache de 1 dia do lado do Presente).
- **P4 — contexto opcional pro chat.** Requer mudar `app/api/conversa/route.ts` (aceitar contexto inicial no body, injetar no system prompt de forma condicional) e `ConversaExperiencia.tsx` (não lido, mas precisa de handoff da Home). Esta é a etapa de maior risco técnico do plano — é a primeira vez que o prompt da conversa deixa de ser 100% estático.
- **P5 — integração com práticas.** Menor risco — "lente como contexto secundário" não muda a query SQL de práticas, só pode influenciar copy/ordem de sugestão dentro da conversa (que já é território do P4).
- **P6 — fechamento do dia.** UI nova, sem dependência técnica dos passos anteriores além de existir *algum* PresenceDailyContext pra perguntar sobre.
- **P7 — memória longitudinal Presença.** Já existe estruturalmente (`buscar_conexao_caderno`) — este passo é mais sobre decidir se/como o fechamento do dia (P6) vira uma entrada no Caderno, reaproveitando `criarEntrada`/`processarConexaoEntrada` como estão.
- **P8 — personalização por Selo natal.** Endpoint personalizado + consentimento novo (`profiles.consentiu_lente_presente_em`, seção C). Depende de P1-P3 já estarem estáveis. **Bloqueador de produto, não técnico:** precisa decidir onde o opt-in é pedido (seção E, "Entender de onde vem" é o candidato natural) antes de codar.

Nenhum dos P1-P8 exige `tags_contexto` — **correção**: diferente do que esta seção afirmava antes da revisão em A, o documento de integração nunca menciona `tags_contexto`; era uma citação equivocada de `presenca-organizacoes.md`. Sem essa falsa dependência, não há decisão de produto pendente aqui.

**Migração do check-in — não incluída em P1-P8, conforme o próprio doc determina.** Nota técnica pra quando essa frente for auditada separadamente: `profiles.presenca_hoje` é `text` livre (sem `check` constraint visível na migration lida), então trocar o vocabulário de "humor" pra "como você chega" é migration de dados (`update`/mapeamento de valores antigos) + mudar `OPCOES` em `app/hoje/page.tsx` + revisar `ordemPorMood`/`tagDoMomento` (que hoje dependem dos 5 valores atuais por nome de string, não por enum tipado) — todos os 3 pontos de acoplamento por string precisam ser levantados na auditoria própria dessa frente.

---

## G. Riscos

- **Lente dominando a conversa:** mitigado estruturalmente pela hierarquia epistemológica (seção 3 do doc) se ela virar instrução explícita no system prompt do P4 — mas hoje não há guardrail determinístico nenhum além de prompt, ver G2.
- **Contexto excessivo no prompt:** `PresenceDailyContext` proposto (seção C) é pequeno (3 strings curtas) — risco baixo desde que não vire histórico completo acumulado.
- **Duplicação de lógica Presente/Presença:** mitigada por design — o doc já proíbe um segundo "Interpretation Engine" (seção 13), e a arquitetura proposta (lib/present.ts fina, sem cálculo local) respeita isso.
- **Privacidade:** endpoint genérico não carrega dado pessoal — baixo risco. Endpoint personalizado (P8) envia `data_nascimento` pro Railway do Presente a cada chamada (ou só na primeira, se cacheado) — vale decidir se isso é logado do lado do Presente e se está coberto pela política de privacidade atual (`/privacidade`, que hoje só documenta Supabase + profissional conectado, **não** um serviço externo novo recebendo data de nascimento — precisa atualização de texto antes do P8 valer para pacientes reais).
- **Memória/viés de confirmação/dependência/previsão:** cobertos pelas regras de produto da seção 6 do doc (proibições explícitas pro agente) — dependem inteiramente de prompt engineering + avaliação (G2), não têm mitigação estrutural própria.
- **Custo/latência:** ver G1.
- **Segurança linguística:** mesmo tom/vocabulário banido já em vigor (`systemPromptConversa.ts:167-178`) — a lente entra como dado, não como instrução de linguagem nova, risco baixo de vazamento de vocabulário técnico se `qa_status`/`prompt_version` forem mesmo mantidos fora do prompt (seção C).

### G1. Recálculo de custo

Baseline (`docs/presenca-ia-arquitetura.md:77-88`, piloto 3 terapeutas + 15-20 pacientes): **~$35-45/mês total**, dos quais Sonnet 5 (conversa) é ~$25-35/mês a ~100 msgs/dia.

**Cenário com integração — P1-P7 (endpoint genérico):**
- Chamada ao motor Presente: 1x/dia, compartilhada — custo do lado do Presente é fixo e não escala com usuários do Presença (o doc já afirma isso explicitamente). Do lado do Presença, é só uma chamada HTTP diária cacheada — custo de infra desprezível (~$0, sem novo custo de LLM neste lado).
- Custo adicional real está no **P4** (contexto no chat): `PresenceDailyContext` (~3 strings, estimando reflection+question+human_experience ~150-250 tokens somados) injetado no system prompt **a cada turno** da conversa (o `system` do Anthropic SDK é enviado inteiro em toda chamada de `messages.stream`, `api/conversa/route.ts:64-70` — não há prompt caching configurado hoje nesse endpoint). Com a mesma premissa de ~100 msgs/dia usada na baseline: +150-250 tokens de entrada por mensagem × 100/dia × 30 dias ≈ 450.000-750.000 tokens/mês de entrada adicionais. A preço promocional Sonnet 5 ($2/milhão entrada): **+$0.90-$1.50/mês** — marginal. Ativar prompt caching (mencionado como otimização futura no doc de arquitetura, ainda não implementado no route.ts atual) reduziria ainda mais, mas o contexto do dia muda 1x/dia por pessoa, então o cache teria hit rate menor que o system prompt fixo atual (que nunca muda).
- **Conclusão P1-P7:** custo adicional desprezível (~$1-2/mês no piloto), não é decisão bloqueada por custo.

**Cenário P8 (endpoint personalizado):** escala com número de pessoas que consentiram, 1 leitura/dia/pessoa. No universo do piloto (15-20 pacientes), mesmo que 100% consentissem, é o mesmo padrão de carga que o endpoint genérico hoje tem (1x/dia) só que multiplicado por pessoa do lado do motor Presente — **esse custo é do lado do Presente (Railway dele), não do Anthropic do lado do Presença**, e não foi orçado aqui porque foge do escopo desta auditoria (motor é repositório separado). Recomendo pedir esse número separadamente antes de decidir P8.

**Total revisado (P1-P7): ~$36-47/mês** (baseline + $1-2 de overhead de contexto). Não bloqueador.

### G2. Guardrail do agente conversacional

Hoje a única camada de verificação é o próprio Sonnet 5 seguindo instruções de prompt — não existe uma segunda chamada de auditoria por turno (nem pro risco: `sinalizar_risco` é o próprio Sonnet reconhecendo e chamando a tool, sem verificação cruzada dentro deste route.ts — o Llama Guard 3 mencionado em `docs/presenca-ia-arquitetura.md:24,95` como "camada de segurança em paralelo" **não aparece implementado em `api/conversa/route.ts`**, que só chama `anthropic.messages.stream` — vale registrar como gap adicional descoberto nesta auditoria, independente da integração do Presente).

**Proposta de avaliação por amostragem (conforme pedido, sem auditoria online):**
- Bateria inicial: os 9 cenários já listados na seção G2 do doc de integração, ~5-8 variações de abertura por cenário (variando o `PresenceDailyContext` simulado e a mensagem inicial da pessoa) → ~45-70 conversas simuladas.
- Critério de aprovação: revisão manual (Guilherme) contra a hierarquia epistemológica (seção 3) — checklist binário por conversa (a lente nunca foi usada como causa; realidade relatada sempre prevaleceu quando havia conflito; nenhum vocabulário técnico vazou).
- Frequência de rerun: a cada mudança no `PresenceDailyContext`/system prompt que toque a seção de lente — mesmo gatilho que already existe pra revalidação do system prompt de conversa (`systemPromptConversa.ts:14-17`, comentário existente já exige revalidação em mudança).
- Armazenamento de regressões: pasta nova `docs/testes-modelo/integracao-presente/`, mesmo padrão de `docs/testes-modelo/comparacao-modelos-2026-07-15.md` já usado pro comparativo de modelos.
- Casos que exigiriam guardrail determinístico adicional (não só prompt): "usuário pede previsão" e "usuário pergunta se o Kin causou algo" são os dois cenários de maior risco de a instrução de prompt falhar sob pressão — se a bateria mostrar qualquer falha recorrente nesses dois, considerar um guardrail estrutural (ex: um segundo tool-call obrigatório de "verificação de causalidade" antes de responder, análogo em espírito ao `sinalizar_risco`) em vez de só reforçar o texto do prompt.

---

## Decisões de produto necessárias antes de qualquer código

Todas as 6 decisões abaixo foram respondidas em `integracao-presente-presenca-decisoes.md` (2026-08-30). Resumo do que foi decidido, mantendo a numeração original pra rastreabilidade:

1. ~~`tags_contexto` é pré-requisito de qual etapa exatamente, ou fica fora do escopo P1-P8?~~ **Falso positivo, corrigido em A/B/F acima** — o doc de integração nunca mencionou `tags_contexto`; era citação equivocada de `presenca-organizacoes.md`. Nada a decidir.
2. Nome da rota pública genérica — **decidido: renomear**, `/api/publico/hoje-dreamspell` → `/api/lente-do-dia` (já refletido em `integracao-presente-presenca.md` e implementado em `lib/present.ts`).
3. Onde fica "Entender de onde vem" — **decidido: inline (accordion na Home), sem rota nova**, ao menos nesta etapa.
4. Atualizar `/privacidade` antes do P8 — **decidido: confirmado, não negociável**, bloqueia P8 junto com a coluna de consentimento.
5. Gap do Llama Guard 3 — **decidido: pré-requisito do P4**, não dívida aceita. Implementar antes de iniciar P4.
6. Fail-open vs. fail-closed pra chamada ao motor Presente — **decidido: fail-open**, mesma filosofia de `calcularEmbedding`/`calcularConfiguracaoHD`.
