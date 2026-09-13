# ENGINE_VALIDATION.md — Validação dos Três Motores

**Status:** Fase de validação técnica ENCERRADA — decisões finais registradas (seção 7)
**Versão:** 0.3
**Entrada:** `GOLDEN_PROFILE_GUILHERME.md` + print do Human Design App (14/08/2026, 10:48) + `EXTERNAL_ENGINE_EVALUATION_humandesign_api.md` + decisões finais da equipe
**Saída de código:** `engine_validation/` (5 motores + 1 suíte de testes, **59 PASS / 0 FAIL / 9 PENDENTE**)

Esta versão reporta apenas o que mudou desde a v0.2. Para o histórico completo de decisões (Numerologia, Dreamspell, Tipo/Autoridade/Definição de Design Humano), ver a v0.2 preservada no histórico do projeto.

---

# 0. O que mudou nesta rodada

| Item | Estava (v0.2) | Está agora (v0.3) |
|---|---|---|
| Design Humano: Trânsito × Natal | `IMPLEMENTED / VALIDATION_PENDING` — mecânica implementada, sem fonte externa para comparar | **`ENGINE_MATCH`** — confirmado por duas fontes independentes: print do Human Design App (fornecido pela equipe) e a API de terceiros `humandesign_api` (usada só como QA) |
| `humandesign_api` | não avaliado | Avaliado em documento separado (`EXTERNAL_ENGINE_EVALUATION_humandesign_api.md`) — **não substitui** nosso motor; registrado como fonte independente de QA |

Com isso, **as três pendências mais críticas identificadas na v0.1** (convenção de Kin do Dreamspell, Dia Pessoal da Numerologia, e agora Trânsito × Natal do Design Humano) estão todas fechadas. O que resta pendente (seção 6) não bloqueia mais nenhum horizonte da hierarquia Pessoa→Ano→Mês→Semana→Hoje para nenhum dos três sistemas.

---

# 1. Design Humano — Trânsito × Natal: ENGINE_MATCH

## Evidência 1: print do Human Design App (fornecido pela equipe)

**Momento**: Guilherme Moreira Dos Santos, 14/08/2026, 10:48 (horário local = 13:48 UTC).

| Elemento | App (print) | Nosso motor (`hd_transit.py`, recalculado para o mesmo instante exato) | Status |
|---|---|---|---|
| Gates de trânsito (conjunto de 12 gates únicos: Sol, Terra, Lua, Nodos, Mercúrio, Vênus, Marte, Júpiter, Saturno, Urano, Netuno, Plutão — Mercúrio e Júpiter compartilham o gate 33) | 4, 15, 17, 18, 20, 21, 29, 30, 33, 41, 49, 64 | idênticos | ✅ **13/13 MATCH** (nível de gate) |
| Linhas dos 13 corpos | — | 12/13 idênticas; a Lua diverge por 1 linha (app mostra linha 6, nosso motor calcula linha 5 no instante exato 13:48:00 UTC) | ⚠️ **12/13** — ver nota abaixo |
| Centros temporariamente definidos | Baço, Raiz | Baço (`spleen`), Raiz (`root`) | ✅ **MATCH** |
| Canais novos formados (trânsito × natal) | 63/4 (Lógica), 18/58 (Julgamento), 30/41 (Reconhecimento) — visíveis na lista de eventos do dia do app | (4,63) Lógica, (18,58) Julgamento, (30,41) Reconhecimento | ✅ **MATCH exato**, inclusive na identificação dos 3 canais certos entre os 36 possíveis |

### Nota sobre a única divergência (linha da Lua)
A Lua é o corpo mais rápido do sistema — muda de linha a cada ~1h42min (ao contrário do Sol, que leva ~1 dia por linha). O print mostra o horário arredondado ao minuto ("10:48"); uma diferença de poucos minutos entre esse instante exibido e o instante internamente usado pelo app para o cálculo é suficiente para explicar uma divergência de exatamente 1 linha na Lua, sem indicar nenhum problema estrutural no motor — os outros 12 corpos, incluindo corpos que também se movem rápido o suficiente para importar (Mercúrio, por exemplo), bateram exatamente no mesmo instante. Registrado como nota de precisão, não como falha do motor.

## Evidência 2: `humandesign_api` (fonte independente de QA, não substitui nosso motor)

Rodando o mesmo perfil e data via `/transits/daily` (self-hosted, ver `EXTERNAL_ENGINE_EVALUATION_humandesign_api.md` para a metodologia completa):
- 13/13 ativações de trânsito idênticas às nossas.
- Os mesmos 3 canais novos: 63-4, 58-18, 30-41.
- Os mesmos 2 centros recém-definidos: Spleen, Root.

Essa segunda fonte não é totalmente independente do ponto de vista metodológico (também usa Swiss Ephemeris), mas é uma implementação de código diferente da nossa, o que já reduz o risco de um bug específico da nossa implementação estar "se confirmando sozinho".

## Por que isso fecha para ENGINE_MATCH agora
A v0.2 já tinha confiança razoável na mecânica (reaproveita cálculo de gate/linha já validado 26/26, e a mesma regra estrutural de canais já cross-checada contra o pacote MIT `free-human-design`), mas faltava explicitamente uma fonte externa para comparar resultado a resultado, como o próprio `ENGINE_VALIDATION.md` v0.1/v0.2 exigia antes de marcar algo como validado. Agora há duas fontes independentes concordando, uma delas sendo a referência que a equipe usa na prática (o Human Design App). Isso satisfaz o critério.

## Status
`ENGINE_MATCH` para gates de trânsito, canais novos formados e centros temporariamente definidos. A linha exata da Lua em instantes específicos permanece sujeita a uma margem de poucos minutos — não é tratada como bloqueio, mas registrada como uma característica conhecida de qualquer corpo de movimento rápido, não específica do nosso motor.

---

# 2. `humandesign_api` — papel oficial no laboratório

Conforme `EXTERNAL_ENGINE_EVALUATION_humandesign_api.md`: **não é o motor de produção do laboratório.** É mantida documentada como **fonte independente de QA** — útil para:
- Validar cruzamentos futuros (ex.: perfis de Carlos/Dani/Julie) sem depender exclusivamente de prints manuais do Human Design App.
- Confirmar campos que nosso motor ainda não implementa (Nome da Cruz de Encarnação, Variáveis PLL DRL) — úteis como alvo de validação, não como fonte a copiar diretamente por causa da nota de IP já registrada no `TECH_RESEARCH.md`.

Uma divergência real permanece registrada e **não resolvida**: a lista de canais da API omite o canal 10-20 no perfil de Guilherme, apesar dos gates 10 e 20 estarem ativos nos próprios dados que ela retorna. Isso não afetou nenhum dos testes desta rodada (nem o natal, nem o trânsito de hoje, que não envolve esse canal específico), mas fica sinalizado para quando um segundo perfil for testado.

---

# 3. Estado atual dos três motores (substitui a tabela da v0.2)

| Motor | Pessoa | Ano | Mês | Semana | Hoje |
|---|---|---|---|---|---|
| Numerologia | ✅ | ✅ | ✅ | ✅ (composição) | ✅ |
| Dreamspell | ✅ | ✅ | ✅ | ✅ (composição) | ✅ |
| Design Humano | ✅ (Tipo/Autoridade/Definição fechados; falta só Nome da Cruz/Ângulo, não bloqueante) | ⚠️ sem metodologia própria decidida (ver seção 5) | ✅ (mecânica de trânsito validada) | ✅ (mecânica de trânsito validada) | ✅ |

**Pela primeira vez, a tabela não tem nenhum ⛔.** A cena central do Foundation — abrir o dia e ver as três leituras de "Hoje" — está tecnicamente sustentável pelos três motores agora. O único ⚠️ remanescente (Ano de Design Humano) não é uma falha de cálculo, é a ausência de uma decisão metodológica própria — ver seção 5.

---

# 4. Testes automatizados

`engine_validation/test_golden_profile.py` — **59 PASS / 0 FAIL / 9 PENDENTE** (era 55/0/9 na v0.2). Os testes de trânsito passaram a comparar contra os valores reais do print (não mais "roda sem erro" — ver seção 1). As 9 pendências continuam as mesmas da v0.2 (Talento Oculto, Débitos Cármicos, Dia Pessoal sem número de referência, as 3 convenções de Dreamspell rejeitadas mantidas como documentação, Nome da Cruz + Ângulo, Variáveis PLL DRL, e um teste informativo de "trânsito no momento agora" que é não-determinístico por natureza e não deveria mesmo virar PASS/FAIL fixo).

---

# 5. O que continua pendente (nenhum item bloqueia mais um horizonte inteiro)

| Item | Sistema | Bloqueia o quê | Urgência |
|---|---|---|---|
| Talento Oculto (hipótese, 1 ponto de dado) | Numerologia | nada — campo individual | Baixa |
| Débitos Cármicos (não resolvido) | Numerologia | nada — campo individual | Baixa |
| Dia Pessoal sem número de referência para teste automatizado | Numerologia | nada — metodologia já confirmada, falta só o teste | Baixa |
| Nome da Cruz + Ângulo (IP) | Design Humano | nada — campo individual, mas depende de decisão de conteúdo (ver `PRD_v0.1.md` atualizado) | Média |
| Variáveis PLL DRL | Design Humano | nada — campo individual | Baixa |
| **Metodologia de "Ano" para Design Humano** | Design Humano | a experiência "Ano" de Design Humano não tem uma definição própria fechada ainda | **Média-alta** — é o único horizonte sem cálculo nem decisão |
| Divergência do canal 10-20 na `humandesign_api` | QA externo | nada diretamente — sinal de alerta para quando testarmos um segundo perfil | Baixa, mas monitorar |
| Segundo perfil de validação (Carlos/Dani/Julie) | Numerologia + Design Humano | nada — já registrado como não-bloqueante | Baixa |

---

# 7. Decisões finais de fechamento desta fase de validação (registradas pela equipe)

Com o laboratório considerando encerrada a fase de validação técnica, seis decisões finais fecham o que ainda estava em aberto nas seções 5 e 6:

1. **Retorno Solar não será adotado como metodologia de "Ano" para Design Humano nesta versão.** O horizonte Ano fica **sem leitura de Design Humano** até uma metodologia ser conscientemente adotada — não é um bloqueio a resolver, é uma ausência deliberada de conteúdo.
2. **Nome da Cruz, Ângulo e Variáveis não bloqueiam o laboratório.** Os valores já conhecidos (ex.: "Cruz da Fênix Adormecida", Ângulo Direito, PLL DRL para Guilherme, confirmados via `humandesign_api` e o Golden Profile) podem ser **preservados manualmente** por participante já validado. A tabela de ~192 combinações **não será implementada agora**.
3. **`humandesign_api` permanece só como fonte de QA independente.** O motor de produção continua sendo o nosso (`hd_bodygraph.py` + `human_design_engine.py` + `hd_transit.py`).
4. **"Hoje" será uma fotografia diária congelada.** A definição exata do horário de referência do congelamento é uma decisão técnica, tratada no `IMPLEMENTATION_PLAN.md`, não neste documento.
5. **Segundo perfil de teste não bloqueia implementação** — será usado como QA adicional assim que a primeira versão funcional estiver disponível, não antes.
6. **A hierarquia Pessoa→Ano→Mês→Semana→Hoje é uma arquitetura de experiência, não uma obrigação de conteúdo.** Nenhum sistema deve ser forçado a oferecer leitura em um horizonte para o qual não haja metodologia validada — o "Ano" sem Design Humano (decisão 1) é o primeiro caso concreto disso, mas o princípio vale para qualquer lacuna futura.

## Correção encontrada ao aplicar a decisão 6 de forma simétrica: Dreamspell "Ano" e "Mês" nativos

Ao revisar os três motores sob o princípio da decisão 6, uma inconsistência ficou visível: a tabela de prontidão da v0.2/v0.3 (seção 3) marcava Dreamspell como ✅ em **todos** os horizontes assim que a convenção de Kin foi fechada — mas isso estava correto apenas para o que depende diretamente do Kin (Selo, Tom, Onda Encantada, e por extensão Hoje e uma Semana composta por 7 Kins consecutivos). **A estrutura própria de Ano e Mês do Sincronário das 13 Luas — em qual Lua de 13 e em qual dia dentro da Lua uma data cai, e o Ano Portador — nunca foi implementada nem validada.** O `GOLDEN_PROFILE_GUILHERME.md` já listava isso ("também devem ser congelados: [...] data das 13 Luas") como pendente desde o início, e nenhuma rodada de validação chegou a fechar esse ponto especificamente — ele ficou native mente ofuscado pela urgência maior da ambiguidade do Kin.

**Correção de status**: Dreamspell "Ano" e "Mês" (na acepção nativa do Sincronário, não a contagem de Kin) passam de ✅ para `NOT_IMPLEMENTED`, pelo mesmo motivo e com o mesmo tratamento que "Ano" de Design Humano — sem leitura nesse horizonte até a metodologia ser implementada e validada, não um bloqueio do laboratório como um todo.

## Estado final desta fase de validação

| Motor | Pessoa | Ano | Mês | Semana | Hoje |
|---|---|---|---|---|---|
| Numerologia | ✅ | ✅ | ✅ | ✅ (composição) | ✅ |
| Dreamspell | ✅ | **não implementado** (decisão desta rodada) | **não implementado** (decisão desta rodada) | ✅ (composição de 7 Kins) | ✅ |
| Design Humano | ✅ | **sem leitura** (decisão 1) | ✅ | ✅ | ✅ |

Esta tabela substitui a da seção 3 como o estado final da fase de validação técnica. A fase de validação técnica está encerrada — o que resta é trabalho de produto/implementação, tratado em `IMPLEMENTATION_PLAN.md`.

---

# 8. Gate 0 — Auditoria do motor Dreamspell real (Etapa A1, 19/08/2026)

Numa sessão de chat separada (sem acesso a este repositório), o time formalizou por escrito a convenção de dias verdes do Dreamspell — Dia Fora do Tempo (25/07) avança o Kin, Hunab Ku 0.0 (29/02) pausa o Kin — contra o Sincronário Perpétuo 13 Luas, e construiu uma implementação de referência (`docs/handoff_package/dreamspell_engine.py`) com 32 golden tests (`docs/handoff_package/test_gate0_golden.py`, 32/32 PASS). Essa decisão está documentada por extenso em `docs/handoff_package/DREAMSPELL_CALENDAR_CONVENTION.md`.

**A1 auditou essa convenção contra o motor real do repositório** (`app/engines/dreamspell_engine.py`, usado em produção via `DreamspellAdapter`) — não apenas contra a implementação de referência. Resultado: **o motor real já implementava exatamente essa convenção antes desta auditoria** (`OFFICIAL_CONVENTION = dict(skip_dft=False, skip_leap=True)`, com o mesmo raciocínio documentado no próprio docstring do arquivo, validado contra o Sincronário da Paz). Isso confirma, por uma segunda via independente, o fechamento já registrado nas seções 0/3 desta versão ("convenção de Kin do Dreamspell" fechada).

**Suíte de regressão adicionada:** `tests/test_gate0_dreamspell.py` — adaptação dos 32 casos do Gate 0 para a interface real (`kin_today_or_for`/`full_reading`, sem `compute_moment`). **16/16 PASS** nos casos aplicáveis à contagem de Kin (época, Golden Profile, blocos 2016 e 2024 completos incluindo Hunab Ku e virada do ano de 13 luas). Roda com `PYTHONPATH=. python3 tests/test_gate0_dreamspell.py`.

**3 GAPs identificados nesta rodada (não são falhas de cálculo — são escopo ausente, sinalizados explicitamente):**
1. ~~O motor real não expõe um `day_type`...~~ **RESOLVIDO em 19/08/2026 — ver subseção "Resolvido" abaixo.** (A caracterização original deste item ficou incompleta — ver a correção logo adiante.)
2. O calendário de 13 Luas (Lua/dia-da-Lua, `moon`/`moon_day`) não é calculado pelo motor real — já registrado como `NOT_IMPLEMENTED` na seção 7 desta versão (Dreamspell "Ano"/"Mês" nativos), reconfirmado aqui pela mesma leitura do código.
3. ~~A regra de assinatura para nascimento em 29/02...~~ **RESOLVIDO em 19/08/2026 — ver subseção "Resolvido em 19/08/2026 (mesmo dia, follow-up imediato)" mais abaixo** (`_data_nascimento_efetiva()` em `app/adapters/dreamspell_adapter.py`).

**Gate 0 considerado `VALIDATED` em produção** para o que o motor real de fato calcula: contagem de Kin e derivação de Selo/Tom/Onda.

---

## Resolvido em 19/08/2026 — `kin_today_or_for` e `momento_dreamspell` não podiam divergir (item 1 acima)

**Correção do relato original:** o item 1 desta seção, como escrito em 19/08/2026 pela manhã, subestimou o problema ao descrevê-lo como só "motor não expõe `day_type`" e "não bloqueia nada hoje". Investigação de acompanhamento no mesmo dia mostrou que era mais sério: **`kin_today_or_for()` — a função usada em produção por `DreamspellAdapter.compute_pessoa()` e `compute_horizonte()` (horizontes Hoje e Semana, fora do escopo do Alpha) — devolvia silenciosamente um Kin numérico errado em Hunab Ku 0.0 (29/02)**, igual ao do dia anterior, em vez de refletir que esse dia não tem Kin próprio. `momento_dreamspell()` (camada A2) já tratava isso corretamente via `tipo_dia_for()`, então as duas funções podiam divergir — e divergiam, de fato, nesse caso.

**Risco real, não só teórico:** os horizontes Hoje/Semana rodam com a data civil corrente para todo participante, todo dia — isso dispara sozinho no próximo 29/02 (2028), sem precisar de nenhuma mudança de código, afetando a tela "Hoje" (e a "Semana" que contiver esse dia) de qualquer participante cadastrado até lá. O caso de nascimento em 29/02 (item 3 acima) continua teórico (nenhum participante atual), mas os horizontes Hoje/Semana não são teóricos.

**Correção aplicada (causa raiz, não um patch local):** `kin_today_or_for()` agora delega para a mesma checagem `is_hunab_ku()` que `momento_dreamspell()` já usava, e passou a retornar `None` (em vez de `Optional[int]` sempre preenchido) em Hunab Ku — a mesma semântica do Gate 0. `momento_dreamspell()` foi simplificada para obter seu Kin chamando `kin_today_or_for()` diretamente, em vez de duplicar a checagem — as duas funções agora compartilham fisicamente o mesmo núcleo de decisão e não podem mais divergir nesse ponto. Teste de regressão adicionado em `tests/test_gate0_dreamspell.py` (seção 6): compara `kin_today_or_for(d)` contra `momento_dreamspell(d).kin` para datas regulares e Hunab Ku — **22/22 PASS** no arquivo completo depois da correção.

Suíte completa (153 checks, 7 arquivos de teste) rodada após a correção — **0 FAIL** em todos, confirmando zero regressão em dias regulares.

## Resolvido em 19/08/2026 (mesmo dia, follow-up imediato) — os 3 call sites do DreamspellAdapter

A consequência que a correção acima deixou em aberto — `compute_pessoa()`/`compute_horizonte()` passando `None` direto para `full_reading()`, que não aceita `None` — foi tratada por call site, não com um patch genérico:

- **`compute_pessoa`** (Kin natal): 29/02 é uma data de *nascimento*, não um dia de calendário sendo consultado — precisa de uma assinatura própria, não de um "sem Kin" permanente. Implementada a regra já registrada em `DREAMSPELL_CALENDAR_CONVENTION.md`/`CLAUDE.md`: nascimento antes de 12:00 local usa a assinatura de 28/02, depois (ou sem hora confiável) usa a de 01/03 — resolvida em `_data_nascimento_efetiva()` antes de calcular o Kin. Nunca produz `kin=None`.
- **`compute_horizonte` "hoje"/"semana"**: aqui 29/02 *é* o dia consultado — não há assinatura para resolver, a leitura correta é refletir que aquele dia específico não tem Kin (`kin=None`, `tipo_dia="HUNAB_KU_0_0"`), como já fazia `momento_dreamspell()`. Extraído um helper `_leitura_dia()` compartilhado pelos dois horizontes.
- **`_card_dreamspell`** (`app/routes_experiencia.py`) tinha o mesmo problema um nível abaixo: `SELO_COR_EXIBICAO[selo]`/`TOM_EXIBICAO[tom]` estourariam `KeyError` com `selo=None`/`tom=None`. Corrigido para mostrar um card "Hunab Ku 0.0" explicando a ausência de Kin, em vez de tentar montar a leitura normal.

**Teste de stack completa:** `tests/test_hunab_ku_call_sites.py` — adapter → `gerar_horizonte()` (persistência real em Postgres) → `_card_dreamspell()` (mesma função usada pelas rotas HTTP). Cobre nascimento em 29/02 antes/depois de 12:00, "Hoje" pousando em Hunab Ku, "Semana" contendo Hunab Ku, e Dia Fora do Tempo (para confirmar que esse caso continua no caminho normal, não no de Hunab Ku). **18/18 PASS.** Suíte inteira (171 checks, 8 arquivos) rodada de novo depois — **0 FAIL**.

Com isso, não há mais nenhuma pendência de produção aberta relacionada ao Gate 0/Hunab Ku — só os GAPs 2 e 3 já registrados acima (calendário de 13 Luas e regra de nascimento em 29/02, que já está implementada desde este item, então o GAP 3 acima também deve ser lido como resolvido por este mesmo commit).
