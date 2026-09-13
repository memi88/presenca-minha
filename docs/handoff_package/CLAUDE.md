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
| A1 | Auditoria real do motor Dreamspell contra Gate 0 | Próximo passo, ver seção 4 |
| A2 | Contrato `DailyMoment` + golden tests, timezone 03:00 | Depende de A1 |
| A3 | Biblioteca Dreamspell mínima (20 Selos, 13 Tons, Onda; Oráculo só se validado) | Depende de A2 |
| A4 | Relationship + Relevance Engine (rule-based; mínimo: `NONE` + `same_seal`) | Depende de A3 |
| A5 | Reflection Engine (GPT-5.6 Sol) + QA (guardrails + auditor isolado) | Depende de A4 |
| A6 | Tela diária Alpha (reflexão, pergunta, prática opcional, `Entender`) | Depende de A5 |
| A7 | Fechamento do dia (registro livre + marcadores + 8 perguntas de laboratório) | Depende de A6 |
| A8 | Guilherme roda ponta a ponta no celular, 1-2 dias, corrige bugs | Depende de A7 |
| A9 | Carlos, Dani, Julie entram, ciclo de 13 dias cada | Depende de A8 estabilizar |
| A10 | Debrief, exportar métricas do piloto | Depende de A9 |

A menor mudança que coloca Guilherme usando o Alpha real: **A1→A2→A3→A4(mínimo)→A5→A6→A7→A8**. Relações de Oráculo e contexto anual podem esperar uma segunda iteração.

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
