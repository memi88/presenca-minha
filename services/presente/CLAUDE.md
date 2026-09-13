# CLAUDE.md — Contexto do projeto Presente

Este arquivo é o ponto de entrada de contexto para qualquer sessão do Claude Code neste repositório. Leia isto antes de tocar em qualquer código.

---

## 1. O que é o Presente

Ferramenta privada e experimental que traduz três sistemas de autoconhecimento — Design Humano, Dreamspell e Numerologia — para o dia a dia de 4 participantes: Guilherme, Carlos, Dani, Julie.

**Não é** horóscopo, não é previsão, não é ferramenta terapêutica. É um instrumento de observação simbólica.

**Princípios inegociáveis** (de `FOUNDATION.md`, não renegociar sem discussão explícita com o time):
1. Consciência antes de previsão — nunca afirmar que algo vai acontecer, nunca dar conselho prescritivo.
2. Possibilidade antes de regra — leitura oferece possibilidades de observação, não determina comportamento.
3. Três sistemas, três vozes — não sintetizar Design Humano + Dreamspell + Numerologia num veredito único.
4. Profundidade disponível, simplicidade na superfície.
5. A origem deve ser acessível — toda interpretação rastreável até os elementos que a originaram (`Entender o porquê`).
6. **Cálculo é diferente de interpretação** — regras determinísticas permanecem determinísticas; a IA nunca inventa cálculo, só traduz para linguagem.
7. A tecnologia traduz, não é a protagonista.
8. Não sabemos onde isso vai chegar — é experimento, não produto comercial (ainda).

---

## 2. Estado atual do projeto (antes desta sessão)

### Motores determinísticos
- **Numerologia**: 13/13 campos natais/temporais validados contra o Golden Profile de Guilherme. Tabela confirmada: Caldeia/NCT (1-8, sem o 9). Pendências: Talento Oculto (hipótese não confirmada), Débitos Cármicos (não resolvido), Dia Pessoal (sem dado de referência).
- **Design Humano**: 26/26 ativações brutas (Personalidade+Design) validadas via `pyswisseph` (Swiss Ephemeris, modo Moshier) + offset empírico de 1,7345°. Perfil e Portas da Cruz confirmados. **Não implementado ainda**: Tipo/Autoridade/Definição/Centros/Canais/nome da Cruz de Encarnação. **Pendência de licenciamento**: Swiss Ephemeris é AGPL-3.0 (cláusula de rede) ou comercial — decisão de produção ainda não aprovada explicitamente.
- **Dreamspell**: mecânica Selo/Tom/Onda validada. A contagem de Kin tinha uma ambiguidade real (Dia Fora do Tempo vs. 29/02) — **RESOLVIDA nesta sessão, ver seção 4 abaixo (Gate 0)**.

### Golden Profile de referência
Guilherme Moreira dos Santos, 25/08/1988, 00:40, Cachoeirinha/RS. Ver `GOLDEN_PROFILE_GUILHERME.md` para os valores completos esperados dos três sistemas — é o contrato de qualidade usado em todos os testes.

### Arquitetura decidida
- Hosting: **Railway** (plano do time já existente), Cloudflare só como DNS/proxy.
- Banco: **Supabase (Postgres)**.
- Motivo Railway > Cloudflare Workers: `pyswisseph` precisa de wheels nativas Linux, incompatível com Pyodide/WASM.
- "Hoje": snapshot fixo às 03:00 no `timezone_atual` do participante (campo separado de `timezone_nascimento`).
- "Semana": semana civil segunda–domingo no timezone local.
- Hierarquia de experiência original: **Pessoa → Ano → Mês → Semana → Hoje** (patrimônio do projeto, ver seção 5 sobre exceção do Alpha).

---

## 3. Decisão de escopo: Presente Alpha V1

Depois da fase de validação de motores, o time decidiu testar uma hipótese de produto mais específica com um pacote de handoff (`00_CLAUDE_HANDOFF.md` a `07_IMPLEMENTATION_DELTA.md`, incluídos neste repositório/contexto).

### Hipótese do Alpha
> Uma lente simbólica curta, metodologicamente controlada e acompanhada ao longo do tempo pode aumentar a qualidade da percepção da pessoa sobre sua experiência cotidiana, sem induzi-la a procurar sinais ou tratar a leitura como previsão.

### Escopo travado
- **V1 usa SOMENTE Dreamspell/Tzolkin** na camada diária interpretativa. Numerologia e Design Humano continuam existindo no projeto mas **fora** da experiência diária do Alpha.
- Fora do Alpha (não implementar agora): síntese entre tradições, Cabala, relacionamento/sinastria, práticas tradicionais sem curadoria, notificações, streaks, previsão, score de "acerto", app nativo.
- Piloto: **4 participantes, 13 dias consecutivos cada** (não precisa começar simultâneo — `pilot_day_number` é individual).

### Decisões técnicas travadas para o Alpha (confirmadas pelo time em 19/08/2026)
| Item | Decisão |
|---|---|
| Gate 0 | Validar 100% a convenção Dreamspell/13 Luas antes de liberar o Alpha — **feito, ver seção 4** |
| Relevance Engine | Determinístico/rule-based na V1 (não é IA) |
| Interpretation Engine | **GPT-5.6 Sol** (OpenAI) |
| QA | Guardrails determinísticos (checklist/regex) + 2ª chamada isolada ao GPT-5.6 Sol como auditor |
| Política de falha | 1ª falha de QA → reescrita; 2ª falha → fallback curado pré-aprovado (nunca publicar nada gerado sem QA aprovado) |
| Memória longitudinal | Desligada na V1 (`memory_used = false` sempre) |
| Piloto | 4 usuários, 13 dias, leituras congeladas (imutáveis após publicação), métricas de QA + experiência |

**Nota sobre a auditoria QA:** usar o mesmo modelo (GPT-5.6 Sol) para gerar e para auditar, mesmo em chamada isolada, não é uma auditoria por modelo verdadeiramente independente — os dois pontos de falha compartilham a mesma família de vieses. Aceito como decisão de V1, mas não tratar como garantia forte de qualidade.

### Exceção deliberada à hierarquia de navegação
O `EXPERIENCE_MODEL.md` lista "mudar a ordem Pessoa → Ano → Mês → Semana → Hoje" como algo que não deve mudar silenciosamente. O Alpha abre direto em "Hoje" por decisão de produto explícita (não um detalhe técnico) — a hierarquia completa continua existindo e acessível, só não é mais a porta de entrada. **Isso está registrado aqui para não ser lido no futuro como mudança silenciosa.**

---

## 4. Gate 0 — Convenção Dreamspell/13 Luas (FECHADO nesta sessão, 19/08/2026)

**Status: `VALIDATED` como especificação e implementação de referência.** Ver `DREAMSPELL_CALENDAR_CONVENTION.md` (incluído) para o documento completo — é a fonte de verdade e não deve ser reimplementada de memória.

Resumo da convenção:
- Ano de 13 luas: 26/07 a 24/07 do ano seguinte (364 dias regulares).
- **Dia Fora do Tempo (25/07)** = `DAY_OUT_OF_TIME`: fora do calendário de luas (`moon=null`), mas **o Kin avança normalmente**.
- **Hunab Ku 0.0 (29/02)** = `HUNAB_KU_0_0`: fora do calendário de luas E fora da sequência de Kin — **o Kin não avança nesse dia e não tem valor próprio**; 01/03 recebe o Kin seguinte ao de 28/02.
- Nascimento em 29/02: antes de 12:00 local → assinatura de 28/02; depois de 12:00 → assinatura de 01/03 (regra na camada de perfil natal, não no motor de calendário puro).

**Entregáveis desta sessão, incluídos no pacote:**
- `dreamspell_engine.py` — implementação de referência (Kin/Selo/Tom/Lua/Dia-da-Lua).
- `test_gate0_golden.py` — 32 golden tests, **32/32 PASS** (época, Golden Profile, bloco 2016 completo incluindo Hunab Ku e virada de ano, bloco equivalente 2024).
- `ENGINE_VALIDATION_ADDENDUM_GATE0.md` — conteúdo pronto para inserir na seção 2 do `ENGINE_VALIDATION.md` real.

**⚠️ AÇÃO OBRIGATÓRIA como primeira tarefa real do Claude Code (A1):**
Esta validação foi feita contra uma **implementação de referência construída para o Gate 0**, não contra o `dreamspell_engine.py` real do repositório (que não estava acessível na sessão de chat). Primeira coisa a fazer:
1. Localizar o motor Dreamspell real no repo.
2. Rodar `test_gate0_golden.py` contra ele (ajustando imports conforme necessário).
3. Se divergir: o motor real está implementando uma das outras convenções antigas (provavelmente uma das 4 listadas no `ENGINE_VALIDATION.md` original) — substituir pela lógica de `dreamspell_engine.py` ou ajustar o código real para bater 32/32.
4. Só depois disso, atualizar `ENGINE_VALIDATION.md` de fato com o conteúdo do addendum, e considerar o Gate 0 encerrado **em produção** (não só como especificação).

---

## 5. Plano de implementação (A0 → A10)

| Etapa | O que é | Status |
|---|---|---|
| A0 | Acesso ao repositório | **Sendo resolvido agora — você está aqui** |
| A1 | Auditoria real do motor Dreamspell contra Gate 0 | **Feito — ver `docs/ENGINE_VALIDATION (1).md` seção 8 e `tests/test_gate0_dreamspell.py`. Divergência `kin_today_or_for`/`momento_dreamspell` em Hunab Ku resolvida em 19/08/2026 (causa raiz). Os 3 call sites em `app/adapters/dreamspell_adapter.py` (Pessoa/Hoje/Semana) e o card de exibição em `app/routes_experiencia.py` também tratados no mesmo dia — Pessoa aplica a assinatura 28/02↔01/03, Hoje/Semana mostram "Hunab Ku 0.0" em vez de crashar. `tests/test_hunab_ku_call_sites.py` (18/18 PASS) cobre a stack completa. Nada pendente aqui** |
| A2 | Contrato `DailyMoment` + golden tests, timezone 03:00 | **Feito — `app/db/models.py` (`MomentoDiario`), `app/alpha/daily_moment.py`, `tests/test_a2_daily_moment.py` (27/27 PASS)** |
| A3 | Biblioteca Dreamspell mínima (20 Selos, 13 Tons, Onda; Oráculo só se validado) | **Feito — já existia (20 Selos + 13 Tons seedados desde a Etapa 7). Onda Encantada não precisa de conteúdo próprio: seu Selo-de-abertura é sempre um dos mesmos 20 Selos (provado para os 260 Kins em `tests/test_a3_biblioteca_dreamspell.py`, 5/5 PASS). Oráculo deliberadamente ausente — pendência de validação própria, não parte da A3** |
| A4 | Relationship + Relevance Engine (rule-based; mínimo: `NONE` + `same_seal`) | **Feito — `ResultadoRelevancia` em `app/db/models.py`, `app/alpha/relevance.py`, `tests/test_a4_relevance.py` (30/30 PASS). Imutabilidade por versão de ruleset testada explicitamente; Hunab Ku tratado como regressão direta do bug da A1/A2** |
| A5 | Reflection Engine (GPT-5.6 Sol) + QA (guardrails + auditor isolado) | **Feito — `LeituraDiaria` em `app/db/models.py`, pipeline completo em `app/alpha/interpretation.py`, `tests/test_a5_interpretation.py` (27/27 PASS, 100% contra cliente mockado). Cliente real em `app/alpha/modelo_gpt56sol.py` — testado contra a API de verdade em 19/08/2026 (chave + billing do projeto "presente" na OpenAI): guardrail passou, auditor isolado reprovou por causalidade implícita sutil, comportamento correto. Idempotência protegida por `pg_advisory_xact_lock` ANTES da chamada ao modelo (testado com threads reais). Pegadinha registrada: `OPENAI_API_KEY` global no shell mascara o `.env` do projeto — usar `env -u OPENAI_API_KEY` ao testar localmente** |
| A6 | Tela diária Alpha (reflexão, pergunta, prática opcional, `Entender`) | **Feito — rota `/{participante}/presente` (`app/routes_experiencia.py`), templates `presente.html`/`presente_carregando.html`, CSS proprio reaproveitando os tokens da Variação D. `/` agora redireciona pra `/presente` (nova porta de entrada, hierarquia Pessoa→Ano→Mês→Semana→Hoje continua acessível pelo nav). Geração roda em `BackgroundTasks`, tela de carregamento com auto-refresh. `tests/test_a6_presente.py` (20/20 PASS via TestClient, incluindo reload real concorrente durante a geração) + verificado visualmente no navegador contra a API real. Mensagem de Hunab Ku reusa a mesma constante de `_card_dreamspell` (`HUNAB_KU_MENSAGEM`), fonte única. **Revisão pós-A6 (19/08/2026): confirmado por teste que `pg_advisory_xact_lock` protege reload-no-meio-da-geração, não só as 2 primeiras visitas simultâneas — 3 reloads concorrentes via rota real, 1 só chamada ao modelo.** **Isolamento corrigido em 19/08/2026 (mesmo dia, follow-up):** login agora tem 2 passos — senha compartilhada (`COOKIE_SENHA_OK`, 10 min) → escolha de identidade entre os participantes cadastrados (`/identidade`, novo) → sessão completa (`COOKIE_NAME`, contém `{"ok": true, "participante": "<nome>"}`). Middleware (`app/auth.py`) bloqueia qualquer rota `/{participante}/...` cujo segmento não bata com a identidade da sessão, redirecionando pra própria tela. `/cadastro` continua acessível só com `COOKIE_SENHA_OK` (bootstrap: zero participantes → `/identidade` manda pra `/cadastro`). Testado com 26 checks dedicados (`tests/test_auth_identidade.py`) + verificado ao vivo no navegador (login completo, e tentativa de acessar `/carlos/presente` logado como guilherme, bounce confirmado). Opção maior (conta por email/senha) registrada mas não escolhida agora. **Confirmado 19/08/2026 (revisão): `/cadastro` fica acessível a qualquer participante autenticado (não só durante o bootstrap) — não existe conceito de admin no modelo (`Participante` não tem papel/permissão). Decisão consciente do time: manter assim para os 4 participantes de confiança total, sem construir um conceito de admin só pra isso agora — revisitar se o laboratório crescer além do círculo de confiança inicial.** |
| A7 | Fechamento do dia (registro livre + marcadores + 8 perguntas de laboratório) | **Feito — `ReflexaoDiaria` em `app/db/models.py`, lógica em `app/alpha/reflexao.py`, rota `/{participante}/fechamento` (GET+POST) em `app/routes_experiencia.py`, template utilitário `fechamento.html`. Imutabilidade por janela de tempo (editável até virar o dia, diferente do write-once de `LeituraDiaria`) — `ReflexaoJaCongelada` levantada, não silenciosa. `practice_experience` sem `practice_done=='sim'` é REJEITADO (`RespostasLaboratorioInvalidas`), decisão documentada. Escritas desacopladas de `LeituraDiaria` confirmadas por teste. `tests/test_a7_reflexao.py` (19/19 PASS) + verificado ao vivo no navegador (preencheu, salvou, valores persistiram e re-renderizaram)** |
| A8 | Guilherme roda ponta a ponta no celular, 1-2 dias, corrige bugs | **Depende de A7 (feito) — todo o trabalho de backend que bloqueava (Gate 1, Gate 1.5, Interpretation Engine v1.1.1) está feito e em produção desde 20/08/2026 (ver seção "Gate 1, Gate 1.5 e Interpretation Engine v1.1.1" abaixo). A8 em si (uso real no app pelo celular, não via script) ainda não começou — PRONTO PRA COMEÇAR.** |
| A9 | Carlos, Dani, Julie entram, ciclo de 13 dias cada | Depende de A8 estabilizar |
| A10 | Debrief, exportar métricas do piloto | Depende de A9 |

A menor mudança que coloca Guilherme usando o Alpha real: **A1→A2→A3→A4(mínimo)→A5→A6→A7→A8**. Relações de Oráculo e contexto anual podem esperar uma segunda iteração.

### Deploy A1-A7 em produção (19/08/2026)

Até este ponto, A1-A7 existiam só localmente — nunca tinham sido commitados nem enviados ao GitHub (produção ainda rodava a Etapa 10). Corrigido:
- Commit único (`A1-A7: Gate 0 audit, pipeline diario do Alpha, tela /presente, fechamento do dia`) + push via `memi88` → deploy automático do Railway.
- Migração (`python3 -m scripts.init_db`) rodada via Console do serviço em produção — `momentos_diarios`, `resultados_relevancia`, `leituras_diarias`, `reflexoes_diarias` confirmadas.
- `OPENAI_API_KEY` **não estava configurada em produção** — adicionada (mesma chave do projeto "presente" na OpenAI, já com billing). Colada via clipboard, nunca digitada/exposta em parâmetro de ferramenta.
- `SESSION_SECRET` (variável compartilhada do projeto) **já era forte** (64 caracteres hex, `secrets.token_hex(32)`) e diferente do `.env` local — confirmado sem necessidade de trocar.
- **Não existe domínio customizado nem Cloudflare configurado** — só o domínio automático `presente-production-8859.up.railway.app`. Esse item da checklist não se aplicava; rotas testadas direto nessa URL (`/healthz`, `/login`, `/identidade` — sem 404).
- Smoke test completo em produção real: login com a senha real → `/identidade` → escolheu "guilherme" → `/guilherme/presente` gerou a leitura de hoje de verdade contra a API real (custo real, esperado). Funcionou ponta a ponta.

### Domínio customizado (19/08/2026, mesmo dia)

`alpha.presenca.app` configurado como domínio público do serviço `presente`, substituindo o `*.up.railway.app` como URL principal pro laboratório (mais fácil de lembrar/digitar pra Carlos/Dani/Julie).
- Adicionado em Railway → Networking → Custom Domain (porta 8080, auto-detectada).
- Registros DNS criados manualmente na zona `presenca.app` (Cloudflare): `CNAME alpha → mf38wggm.up.railway.app` e `TXT _railway-verify.alpha` (verificação de propriedade) — **deliberadamente "Somente DNS" (nuvem cinza), não proxied** pelo Cloudflare, pra não travar a emissão automática do certificado TLS do Railway. Não usada a integração "One-click DNS Setup" (OAuth Railway↔Cloudflare) — configuração manual, mais controlada.
- Validado: domínio com checkmark verde no Railway, certificado TLS válido, `/healthz`/`/login`/`/identidade` respondendo certo na URL nova.
- Nota operacional: durante a configuração, um clique/scroll perdido no canvas do Railway quase criou um serviço novo (`function-bun`, um template de IA) por engano — descartado a tempo, nada chegou a ser deployado. Zero impacto real, registrado aqui só como lição de ir com mais cuidado ao clicar no canvas do projeto.

### UI pós-A7: entrada em /hoje, card do Presente, rótulo Tzolkin (19/08/2026)

- Porta de entrada (`/`, pós-login, todo redirect de sessão incompatível) revertida de `/presente` pra `/hoje` — decisão explícita do usuário ("a primeira tela deveria ser /pessoa ou /hoje"), desfazendo a exceção registrada na seção 3. `/presente` continua existindo e acessível via nav e via card de destaque em "Hoje".
- Card de destaque ("Novo — ◌ Presente") adicionado só na tela "Hoje" (`horizonte.html`, `.promo-presente` em `app.css`), convidando pro `/presente`.
- Rótulo exibido do card Dreamspell trocado pra "Tzolkin" (Pessoa/Hoje/Semana, `app/routes_experiencia.py`) — só o texto visível; nomes internos de módulo/adapter/chaves de conhecimento continuam "dreamspell".
- Prompt de tensão (`PROMPT_VERSION_TENSAO_CANDIDATO`, ver seção do Interpretation Engine) promovido a default de produção — `PROMPT_VERSION = PROMPT_VERSION_TENSAO_CANDIDATO`, com `PROMPT_VERSION_ANTERIOR` guardando a versão anterior pra reversão trivial de 1 linha.
- Login em si não mudou — confirmado com o usuário que o fluxo de 2 passos (senha compartilhada → `/identidade`) já é o "login básico por usuário" pedido.

### Bug real de produção: cadastro de participante nascido antes de 1987 (19/08/2026)

**Sintoma:** `POST /cadastro` retornava 500 puro ao cadastrar alguém nascido antes de 26/07/1987 (EPOCH do motor Dreamspell).

**Causa raiz:** `kin_for_date()` (`app/engines/dreamspell_engine.py`) só sabia caminhar PRA FRENTE a partir de EPOCH; qualquer `target < EPOCH` levantava `NotImplementedError` sem tratamento, propagando até `cadastro_submit()` sem nenhum catch no meio (`app/pessoa.py:gerar_ou_obter_perfil_dreamspell` → `app/adapters/dreamspell_adapter.py:compute_pessoa`). Encontrado lendo o traceback real nos logs de produção do Railway (deploy `ff4d138f`, 2026-08-19 22:45 BRT) — não reproduzia localmente com dados "normais", só com data de nascimento pré-1987.

**Correção:** `kin_for_date()` agora também caminha PRA TRÁS a partir de EPOCH quando `target < EPOCH`, usando a fórmula inversa do passo de avanço (`kin % 260 + 1` ↔ `(kin - 2) % 260 + 1`). Comportamento para datas `>= EPOCH` inalterado byte a byte (mesmo loop de antes). `tests/test_kin_pre_epoca.py` (17/17 PASS): fórmula unitária, oracle independente (bruteforce que reimplementa o passo sem reusar `kin_for_date`), Hunab Ku pré-época, e o caminho ponta a ponta real (`POST /cadastro` com nascimento em 1975 via `TestClient`) que reproduz o bug original.

**Impacto:** qualquer um dos 4 participantes (Carlos/Dani/Julie) nascido antes de 26/07/1987 não conseguia ser cadastrado até esta correção. **Ainda não deployado em produção** — só corrigido e testado localmente até a próxima decisão de deploy.

### Autocomplete de cidade no cadastro (19/08/2026, feito)

Campo "Local de nascimento" agora busca cidades enquanto digita e preenche latitude/longitude/fuso automaticamente — escolha confirmada com o usuário: **Nominatim** (OpenStreetMap, geocoding gratuito sem chave) pra busca de texto → lat/lon, + **timezonefinder** (biblioteca Python offline, sem API) pra derivar o fuso a partir das coordenadas, evitando uma segunda chamada de rede.
- `app/geocoding.py` (`buscar_cidades`), rota `GET /api/geocode` em `app/routes_cadastro.py`, JS vanilla em `cadastro.html` (debounce 450ms + mínimo 3 caracteres — exigido pela política de uso do Nominatim contra autocomplete "a cada tecla").
- `/api/geocode` adicionado a `ROTAS_SO_SENHA` (`app/auth.py`) — mesmo nível de acesso de `/cadastro`.
- Falha de rede/parsing em `buscar_cidades` retorna lista vazia sem exceção — autocomplete é conveniência, nunca trava o cadastro; os campos continuam editáveis manualmente.
- `tests/test_geocoding.py` (14/14 PASS) roda 100% contra `httpx.get` monkeypatched (mesmo padrão de `GPT56SolClient` em `test_a6_presente.py`) — nunca bate no Nominatim de verdade na suíte automatizada.
- Testado ao vivo no navegador contra o Nominatim real (busca "Cachoeirinha" → 3 resultados reais → escolha preencheu lat/lon/fuso corretamente).
- **Pegadinha de ambiente local (Netskope), resolvida definitivamente:** o domínio do Nominatim é interceptado pelo Netskope, e mesmo apontando `SSL_CERT_FILE` pro bundle exportado (`/Users/guilhermemoreira/Documents/netskope-bundle.pem`) a verificação falhava de forma intermitente (bundle estático incompleto/desatualizado — funcionou pra "Cachoeirinha", falhou pra "Lisboa" na mesma sessão). Resolvido adicionando `truststore` (usa o keychain nativo do SO em vez do bundle da certifi, mesmo comportamento robusto que o curl já tinha) — `truststore.inject_into_ssl()` chamado no import de `app/geocoding.py`. Com isso, testar localmente não precisa mais de nenhuma variável `SSL_CERT_FILE` especial pra essa chamada. Em produção (Railway/Linux, sem Netskope) o comportamento é idêntico ao antes, só usando o trust store do container.
- Também adicionado autocomplete de cidade na seção "Residência atual" (`cidade_atual_busca`, campo só de UI, sem `name=` — não é submetido ao backend) preenchendo `timezone_atual`. JS refatorado pra uma função genérica `configurarAutocompleteCidade()` instanciada 2x (nascimento preenche lat/lon/fuso natal; atual preenche só o fuso). Mesmo endpoint `/api/geocode`, nenhuma mudança de backend.

### Deploy do bug fix + autocomplete + entrada em /hoje (19/08/2026, mesmo dia)

Commit `955b5b0` — bug do cadastro pré-1987, autocomplete de cidade (nascimento + residência atual), porta de entrada revertida pra `/hoje`, rótulo Tzolkin, prompt de tensão como default. Push via `memi88` → deploy automático do Railway. **Nenhuma migração de banco necessária** (nenhum schema novo nesta leva — só lógica/UI).

Smoke test real em produção (`alpha.presenca.app`), pós-deploy `ACTIVE`/"Deployment successful":
- Login com a senha real → `/identidade` (já existia um "carlos" cadastrado, além do guilherme) → escolheu guilherme → caiu direto em `/guilherme/hoje` (não mais `/presente`), card "Novo — ◌ Presente" visível, rótulo "Tzolkin" correto.
- `/cadastro`: autocomplete de cidade testado com "Salvador" → escolheu "Salvador, Bahia" → preencheu latitude/longitude/**`America/Bahia`** (confirma que o fuso varia por cidade, não fica hardcoded em São Paulo).
- Correção do bug de pré-1987 **não** foi re-testada em produção com um cadastro real (evitar sujar o banco de produção com um participante descartável) — confiança vem do teste E2E local (`tests/test_kin_pre_epoca.py`, 17/17, via `TestClient` contra Postgres real) rodando o código byte-idêntico ao deployado.

**Pronto para os testes de amanhã (A8)** — sem pendência bloqueante conhecida.

### Gate 1, Gate 1.5 e evolução do Interpretation Engine — v1.1.1 (20/08/2026)

**Gate 1 — Dreamspell Structural Relationships: `VALIDATED`.**
Motivado por uma auditoria trazida pelo time: o app mostrava `NONE` (nenhuma relação estrutural) para Guilherme (Kin 169, Lua Cósmica Vermelha) e Julie (Kin 239, Tormenta Harmônica Azul) contra o momento do dia (Kin 254, Mago Ressonante Branco) — apesar de Lua/Tormenta/Mago (junto com Semente) pertencerem à mesma Família Terrestre (Gateway/Portal) segundo a Foundation for the Law of Time. A auditoria confirmou: o `NONE` estava correto em relação ao código existente até então (só `same_seal` era verificado); a camada de Oráculo nunca tinha sido implementada — as colunas `guia`/`analogo`/`antipoda`/`oculto`/`familia_terrestre` já existiam no schema de `PerfilNatalDreamspell` desde a Etapa 7, mas nunca eram populadas (documentado como pendência deliberada desde então).

Fórmulas de Família Terrestre e do "Fifth Force Oracle" (Guia/Análogo/Antípoda/Oculto) implementadas em `app/engines/dreamspell_engine.py` (fonte determinística única, mesmo padrão de rigor do Gate 0) — cross-validadas ANTES de qualquer código ser escrito contra 8 assinaturas galácticas publicadas (lawoftime.org + tortuga1320.com, que republica o Synchronotron do Law of Time), cobrindo os 5 grupos de deslocamento do Selo Guia. As 5 Famílias Terrestres (Polar/Cardinal/Core/Signal/Gateway) confirmadas contra 3 fontes independentes — Gateway = Semente/Lua/Mago/Tormenta bateu exatamente com a hipótese original do time. Golden tests: `tests/test_gate1_dreamspell_relationships.py` (210/210 PASS — os 20 Selos, as 5 Famílias, Análogo/Antípoda/Oculto dos 20 Selos, Guia nos 13 Tons, e os casos reais de Guilherme/Julie).

**Separação Relationship Detector / Relevance Engine** (pedido explícito do time — "detectar ≠ usar", princípio que se tornou um padrão recorrente nesta sessão):
- `app/alpha/relationship_detector.py` (novo) — Detector puro, sem sessão de banco, sem decisão de relevância nenhuma. Responde só "que relações estruturais existem hoje?": `same_seal`, `same_tone`, `same_wavespell`, `same_earth_family`, e as 4 posições do Oráculo natal (`natal_guide_match`/`natal_analog_match`/`natal_antipode_match`/`natal_occult_match`, cada uma com o Selo da posição natal correspondente).
- `app/alpha/relevance.py` — continua sendo só o Relevance Engine ("essa relação é forte o suficiente pra entrar no Presente de hoje?"). Não decide interpretação nenhuma.

**Gate 1.5 — ruleset de relevância aprovado pelo time** (`RULESET_VERSION = "relevance-1.1.0-same_seal-and-oracle"`, `app/alpha/relevance.py`):
- **Autorizam personalização** (cada uma identificada individualmente no payload/no banco — nunca colapsadas num `ORACLE_MATCH` genérico que apague qual posição ocorreu): `SAME_SEAL`, `GUIDE_MATCH`, `ANALOG_MATCH`, `ANTIPODE_MATCH`, `OCCULT_MATCH`. Lista completa sempre em `ResultadoRelevancia.detalhe["relacoes_autorizadas"]`.
- **Detectadas mas NÃO autorizam** (calculadas, persistidas, visíveis no modo debug — nunca autorizam sozinhas, nem combinadas entre si): `same_earth_family`, `same_tone`, `same_wavespell`. Regra explícita e testada (`tests/test_gate1_5_relevance_ruleset.py`, 20/20 PASS): relações fracas nunca se somam pra fabricar uma relação forte (ex.: `same_earth_family` + `same_tone` juntas continuam sem autorizar nada — não há nenhuma lógica de combinação no código).
- Modo debug: `GET /{participante}/presente/debug` (protegido pela mesma sessão de `/{participante}/...`, sem link nenhum na UI pública) expõe `relationships_checked` completo + `nivel_relacao` + (desde a promoção da v1.1.1) `leitura_versao_prompt`/`leitura_status_qa`/`leitura_modelo` — só leitura, nunca gera uma `LeituraDiaria` nova sozinho.

**Interpretation Engine — `reflection-human-experience-1.1.1`: `VALIDATED`, VERSÃO ATIVA em produção** (`PROMPT_VERSION` em `app/alpha/interpretation.py`). Histórico completo preservado, nenhuma versão anterior apagada: `reflection-1.0.0` → `reflection-tension-1.0.0` → `reflection-human-experience-1.1.0` (candidata, nunca foi produção) → **`reflection-human-experience-1.1.1` (ativa desde 20/08/2026)**.

Pipeline conceitual (substitui a etapa "buscar tensão" da v1.0-tensão): elementos autorizados → relação simbólica → modo da relação (`TENSION`/`CONTRAST`/`COMPLEMENTARITY`/`ENCOUNTER`/`SIMPLE_LENS`, escolhido por evidência semântica real entre os elementos, nunca forçado nem escolhido pela "profundidade" que renderia) → experiência humana (uma experiência humana reconhecível — nunca biografia inventada, nunca só o arquétipo com sinônimos trocados) → arco narrativo (2-4 parágrafos curtos: situação humana → nuance/contraste → abertura; nunca só "uma lente possível é observar X e Y") → reflexão → pergunta (nasce da experiência humana declarada, não das palavras-chave cruas do Selo/Tom).

`v1.1.1` é um ajuste pontual sobre a `v1.1` original, não uma reescrita completa: a bateria de 12 pares da v1.1 convergiu 11/12 em `relation_mode=COMPLEMENTARITY` (trocou o viés antigo "tudo vira TENSION" da v1.0-tensão por um viés novo "tudo vira COMPLEMENTARITY", não uma escolha genuína por evidência). `v1.1.1` mudou SÓ a etapa do modo da relação — escala explícita de força interpretativa (`SIMPLE_LENS < ENCOUNTER < CONTRAST/COMPLEMENTARITY < TENSION`, evidência exigida proporcional à força do modo, regra de desempate sempre pro modo mais fraco quando duas opções parecem igualmente plausíveis, proibição explícita de escolher um modo pela "profundidade" da narrativa). `v1.1` (1.1.0) fica congelada — não foi reescrita nem apagada, só substituída como default.

QA: guardrail determinístico de sempre (regex, aplicado também aos campos novos) + auditor isolado com 8 campos estruturados (`human_experience_supported_by_inputs`, `invented_user_context`, `forced_opposition`, `narrative_adds_meaning_not_facts`, `question_derives_from_human_experience`, `personalization_supported_by_relevance`, `relation_mode_supported_by_inputs`, `stronger_mode_used_without_need`) — 4 são bloqueantes com override determinístico no CÓDIGO (não confia só no `aprovado` que o próprio modelo se autorreporta, mesmo princípio de defesa em profundidade do guardrail regex): `invented_user_context=true`, `forced_opposition=true`, `stronger_mode_used_without_need=true`, ou `personalization_supported_by_relevance=false`. **Máximo de 1 reescrita; 2ª reprovação → fallback curado seguro, nunca publica texto não aprovado** — essa regra nunca mudou em nenhuma versão, incluindo a v1.1.1.

**Baseline do benchmark v1.1.1** (bateria real de 42 casos contra o GPT-5.6 Sol de verdade, `scripts/testar_prompt_v1_1_1_relation_mode.py` — **NÃO re-rodar nem tentar otimizar estes números sem decisão explícita do time**):

| Métrica | Valor |
|---|---|
| Casos na bateria | 42 |
| Aprovados (total) | 40/42 |
| Aprovados na 1ª tentativa | 22/42 |
| Recuperados por reescrita | 18/42 |
| Fallback (2ª reprovação) | 2/42 |
| Texto reprovado publicado por engano | 0 |
| `relation_mode_collapse_detected` | `false` |
| `SIMPLE_LENS` escolhido | 0/40 — **observação aberta, registrada, NÃO bloqueadora** |

Os 2 casos de fallback foram investigados individualmente (`scripts/investigar_fallback_v1_1_1.py`, trace completo salvo): **Mago+Elétrico = `EXPECTED_SAFETY_FALLBACK`** (duas violações reais e distintas surgiram em 2 tentativas — o QA funcionou exatamente como desenhado, não foi excessivamente restritivo; a 2ª violação, pergunta fechada personalizando sem autorização, é o mesmo tipo de problema recorrente em todas as versões testadas, não algo causado pelo ajuste do `relation_mode`). **Noite+Planetário = inconclusivo/não reproduzido** (na reinvestigação dedicada, a mesma dupla de tentativas corrigiu na reescrita e foi aprovada — não dá pra confirmar com certeza o motivo do fallback original da bateria de 42, porque o gap de observabilidade da época não tinha gravado os motivos; corrigido daqui pra frente, ver próximo parágrafo).

**Logging/observabilidade** (`app/alpha/interpretation.py::_rodar_pipeline_qa`): toda `LeituraDiaria.resumo_derivacao` publicada — aprovada de primeira, aprovada após reescrita, ou fallback — agora registra `tentativas` (lista com 1 ou 2 entradas, uma por chamada real ao modelo; cada uma com `relation_mode`/`symbolic_relation`/`human_experience`/`narrative_arc`/`question`/`guardrail_motivos`/`auditoria` completa incluindo os 8 campos estruturados do QA), `relationships_checked` (dump completo do Detector, inclusive as relações que não autorizam nada), `authorized_relations`, `versao_prompt`, `modelo` (`gpt-5.6-sol`, exposto via `GPT56SolClient.model_id` e lido por `getattr()` pra não criar import circular), `motivo_reescrita`, e (no fallback) `motivo_reprovacao_1`/`motivo_reprovacao_2`/`motivo_fallback`. Antes desta sessão, um fallback só gravava `{"tentativa": "fallback"}` — sem motivo nenhum, impossível investigar depois do fato (foi exatamente essa lacuna que impediu confirmar o caso de Noite+Planetário acima).

**Escopo desta sessão, deliberadamente não tocado dali em diante**: Interpretation Prompt, Relation Mode, Human Experience, Narrative Arc, Relevance e QA não sofrem mais nenhum ajuste metodológico até o piloto rodar de verdade — qualquer mudança futura nesses pontos precisa de nova decisão explícita do time, com bateria própria antes de promover.

**Deploy desta sessão**: commit único, push via `memi88` → deploy automático do Railway. Nenhuma migração de banco necessária (toda a persistência nova usa colunas JSONB já existentes — `ResultadoRelevancia.detalhe`, `LeituraDiaria.resumo_derivacao`). Smoke test pós-deploy planejado contra produção pra confirmar `alpha.presenca.app` publicando com `versao_prompt == reflection-human-experience-1.1.1` e o logging completo ativo, mesmo padrão dos smoke tests pós-deploy anteriores (19/08/2026).

**Próxima etapa: A8** (Guilherme roda ponta a ponta no celular, 1-2 dias, corrige bugs reais de uso) — todo o trabalho de backend/API que bloqueava A8 está feito e em produção; A8 em si (uso real no app, pelo celular, não via script) ainda não começou.

---

## 6. Modelo de dados (delta sobre o que já existe — ver `06_DATA_MODEL_AND_API.md` completo no pacote)

Novas entidades: `daily_moment`, `relevance_result`, `daily_present` (imutável após publicação — constraint de unicidade em `participant_id + reference_date`), `daily_reflection`, `pilot_feedback`, `knowledge_item`, `practice`.

Endpoints sugeridos: `GET /api/presente/today`, `GET /api/presente/today/explain`, `POST /api/presente/today/reflection`, `POST /api/presente/today/feedback`, `GET /api/presente/pilot/status`.

**Cuidado de implementação já identificado:** `GET /today` precisa ser idempotente sob concorrência — dois requests simultâneos no primeiro acesso do dia não podem gerar dois `daily_present` diferentes. Constraint de unicidade sozinha no `daily_moment` não basta; `daily_present` também precisa da mesma garantia.

---

## 7. Guardrails de linguagem (QA da interpretação — não negociar)

Proibido em qualquer texto gerado:
- afirmar que algo vai acontecer;
- causalidade ("por causa do Kin X, Y aconteceu");
- diagnóstico ou "você é [característica]";
- "o universo está dizendo/querendo";
- prática tradicional sem `origin`/fonte declarada;
- personalização inventada sem relação estrutural real por trás;
- pergunta que não permita "não faz sentido" como resposta válida.

Preferir: "talvez", "uma lente possível", "pode valer observar", perguntas abertas, linguagem que permita discordância.

---

## 8. Arquivos incluídos neste handoff

**Documentos de produto/fundação:**
- `FOUNDATION.md`
- `GOLDEN_PROFILE_GUILHERME.md`
- `ENGINE_VALIDATION.md` (aplicar o addendum abaixo nele)
- `EXPERIENCE_MODEL.md`
- `PRESENTE_apresentacao.md`

**Pacote de handoff do Alpha V1** (`00` a `07`):
- `00_CLAUDE_HANDOFF.md`
- `01_ALPHA_PRODUCT_SPEC.md`
- `02_INTERPRETATION_PIPELINE.md`
- `03_DAILY_EXPERIENCE.md`
- `04_PILOT_PROTOCOL.md`
- `05_KNOWLEDGE_AND_PRACTICES.md`
- `06_DATA_MODEL_AND_API.md`
- `07_IMPLEMENTATION_DELTA.md`

**Entregáveis do Gate 0 (desta sessão):**
- `DREAMSPELL_CALENDAR_CONVENTION.md` — fonte de verdade da convenção temporal
- `ENGINE_VALIDATION_ADDENDUM_GATE0.md` — inserir na seção 2 do `ENGINE_VALIDATION.md`
- `dreamspell_engine.py` — implementação de referência
- `test_gate0_golden.py` — 32 golden tests (32/32 PASS)

**Referências originais usadas para o Gate 0** (fontes primárias, não redistribuir sem necessidade):
- Sincronário Perpétuo 13 Luas (Instituto Noosfera/Planeta Escola)
- Módulo Harmônico / Tzolkin de 260 dias

---

## 9. O que NÃO fazer sem decisão explícita do time

- Não sintetizar os três sistemas.
- Não criar previsão determinística.
- Não adicionar humor/check-in antes da leitura.
- Não permitir navegação livre para o futuro.
- Não inventar conceitos tradicionais inexistentes (ex.: "Semana do Human Design").
- Não entregar cálculo a um LLM — cálculo é sempre determinístico, IA só traduz.
- Não copiar textos interpretativos de fontes externas sem curadoria/atribuição.
- Não usar Kin do ano, 13 Luas anual, Heptada, Plasma ou Oráculo na interpretação enquanto não estiverem no mesmo padrão de validação do Gate 0.
- Não pular A1 (auditoria real) só porque a especificação já está pronta — a especificação não é o código.
- Não implementar o endpoint personalizado da Ponte Presença (`POST /api/ponte-presenca/hoje-dreamspell-personalizado`) sem decisão explícita do time — ver seção 10, ainda é só documentação (P8 do lado do Presença).

---

## 10. Ponte de leitura para o Presença (produto externo) — 29/08/2026

**Isto NÃO é parte da experiência dos 4 participantes do Alpha.** É uma superfície nova, isolada, que expõe a leitura Dreamspell/Tzolkin do dia pra um produto externo chamado Presença (integração já especificada do lado deles). Escopo desta etapa (pedido explícito do time): **só o endpoint genérico** — o personalizado fica pra depois (P8 do lado do Presença, documentado abaixo, sem código ainda).

### Endpoint genérico (implementado)

`GET /api/publico/hoje-dreamspell` — público, **sem autenticação nenhuma** (nem a senha compartilhada do laboratório — está em `ROTAS_PUBLICAS`, `app/auth.py`).

- Reaproveita o **núcleo puro** do pipeline do Alpha (`montar_payload_minimo` + `_rodar_pipeline_qa`, `app/alpha/interpretation.py` — esta última já era extraída de propósito pra ser reutilizável fora de `obter_ou_publicar_leitura_diaria`, ver docstring dela): mesmo QA/guardrail/reescrita/fallback curado, mesma `PROMPT_VERSION` em produção. **Não** reaproveita `obter_ou_publicar_leitura_diaria` em si — ela é fundida com `Participante` (chave do lock, FK obrigatória), e esta leitura não pertence a nenhum participante.
- Leitura **sem dono**: `nivel_relacao` é sempre `NONE` (não há Selo natal pra comparar — nenhum perfil natal existe aqui). `montar_payload_minimo` recebe um objeto leve (`SimpleNamespace`, não uma linha de banco) satisfazendo o mesmo contrato de atributos de `ResultadoRelevancia`.
- **Tabela própria, desacoplada de `participante_id`**: `LeituraDiariaGenerica` (`app/db/models.py`) — sem FK pra `participantes`/`momentos_diarios`/`resultados_relevancia`. Kin/Selo/Tom/tipo_dia são calculados e gravados na própria linha (não há necessidade de uma segunda tabela tipo `MomentoDiario` só pra guardar o momento do dia sem dono). Cache/idempotência: **1 linha por dia civil** (`UniqueConstraint(data_referencia)`), não por (participante, dia).
- **Timezone fixo e explícito**: `TIMEZONE_PONTE_PRESENCA = "America/Sao_Paulo"` (`app/ponte_presenca/pipeline.py`) — **não herdado** de nenhum `participante.timezone_atual` (essa leitura não tem dono). Mesmo corte de 03:00 de `snapshot_date_hoje()`.
- **Concorrência**: mesmo padrão de `obter_ou_publicar_leitura_diaria` — `pg_advisory_xact_lock` ANTES de qualquer chamada ao modelo, chave por **dia** (não por participante+dia). Testado com 2 threads reais (`tests/test_ponte_presenca.py`).
- **Hunab Ku 0.0**: reusa a mesma mensagem fixa de tela do resto do produto (`HUNAB_KU_MENSAGEM`, `app/routes_experiencia.py` — fonte única, nunca uma segunda versão). `reflexao`/`pergunta` ficam `None` no banco (mesmo padrão de `LeituraDiaria`); a mensagem é montada em `_resposta_json()` (`app/ponte_presenca/routes.py`), não gravada.
- **Resposta pública** (`{"reflection": ..., "question": ..., "derivation_summary": {...}}`) — `qa_status`/`prompt_version`/`modelo` **NUNCA** saem nessa resposta (denylist em `_resumo_derivacao_publico()`, mesmo princípio já estabelecido em `_contexto_entender_presente()` pra Alpha: essas chaves são auditoria interna, ficam só em log/DB).
- **Namespace isolado**: `app/ponte_presenca/` (`pipeline.py` + `routes.py`) — sem sessão/auth de participante, sem template Jinja2. Única dependência cruzada deliberada: importa `HUNAB_KU_MENSAGEM` de `app/routes_experiencia.py` (reusar a fonte única existente, não inventar uma segunda mensagem — pedido explícito do time).
- Golden tests: `tests/test_ponte_presenca.py` (27/27 PASS) — idempotência por dia, concorrência real (2 threads), Hunab Ku reusando a mensagem fixa, e a resposta pública nunca vazando `qa_status`/`prompt_version`/`modelo` (nível HTTP real via `TestClient`, cliente do modelo mockado, mesmo padrão de `test_a5_interpretation.py`/`test_a6_presente.py`).
- Migração: nenhuma ferramenta de migration no projeto (`Base.metadata.create_all`, `scripts/init_db.py`) — rodar esse script de novo (local e em produção, via Console do Railway) cria a tabela `leituras_diarias_genericas` nova sem tocar nas existentes. **Ainda não rodado em produção** — pendente do próximo deploy desta superfície.

### Endpoint personalizado — P8 do lado do Presença (documentado, NÃO implementado)

`POST /api/ponte-presenca/hoje-dreamspell-personalizado` — recebe `data_nascimento`, exige **API key servidor-a-servidor** (autenticação de serviço, não de usuário/participante — diferente do cookie de sessão do Alpha). Fica só como próximo passo registrado aqui; nenhum código foi escrito ainda. Antes de implementar: decidir onde/como a API key é gerada e rotacionada, se esse endpoint calcula um perfil natal Dreamspell completo (Selo/Tom natal) pra então autorizar `SAME_SEAL`/Oráculo contra o momento do dia (o que aproximaria essa leitura da lógica do Alpha, ainda que sem `Participante`), e se cabe cache por `data_nascimento` (mais de uma pessoa pode compartilhar Selo natal, mas não necessariamente a mesma leitura personalizada).
