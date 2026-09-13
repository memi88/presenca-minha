# PRD_v0.1.md — Calendário Pessoal de Consciência (Laboratório de 4 usuários)

**Status:** Proposta / Pré-implementação — **revisado após fechamento dos três motores** (ver `ENGINE_VALIDATION.md` v0.3 e `EXTERNAL_ENGINE_EVALUATION_humandesign_api.md`)
**Versão:** 0.1 (seções 13, 14 e 16 atualizadas nesta revisão; numeração de versão do arquivo mantida em 0.1 porque a estrutura do documento não mudou, só o estado dos bloqueios)
**Herda de:** `FOUNDATION.md` (intenção), `EXPERIENCE_MODEL.md` (experiência mais atual), `EXPERIMENT_SPEC.md` (decisões de escopo), `TECH_RESEARCH.md` (viabilidade técnica), `GOLDEN_PROFILE_GUILHERME.md` + `ENGINE_VALIDATION.md` v0.3 (contrato de qualidade dos motores, incluindo Trânsito×Natal de Design Humano fechado), `EXTERNAL_ENGINE_EVALUATION_humandesign_api.md` (fonte de QA externa)

Este documento **não reabre** nenhuma decisão já fechada nesses cinco documentos. Onde há algo genuinamente pendente, ele aparece explicitamente na seção 14 (Decisions Needed), não escondido dentro de um requisito.

---

# 1. O que este PRD faz e não faz

Faz: transforma as decisões já tomadas em requisitos implementáveis — arquitetura de informação, modelo de dados, estratégia de geração/cache, papel da IA, rastreabilidade, critérios de aceite, fases.

Não faz: não implementa nada; não decide o que ainda está pendente no `ENGINE_VALIDATION.md`; não introduz arquitetura de escala, autenticação pública, monetização ou funcionalidades fora do laboratório de 4 pessoas.

---

# 2. Herança de decisões — o que este PRD preserva sem discutir de novo

| Decisão | Fonte | Como este PRD a preserva |
|---|---|---|
| Consciência, não previsão | `FOUNDATION.md` §4, §16 | Linguagem de leitura (seção 9), critérios de aceite (seção 13) |
| Três sistemas independentes, sem síntese | `FOUNDATION.md` §8, `EXPERIMENT_SPEC.md` §5-6 | Arquitetura de informação (seção 4), modelo de dados (seção 6) |
| Hierarquia Pessoa → Ano → Mês → Semana → Hoje | `EXPERIENCE_MODEL.md` §2 | Seção 4, obrigatória e não reordenada |
| Sem navegação livre para passado/futuro | `EXPERIMENT_SPEC.md` §11 | Seção 5 (fluxo principal) |
| Sem check-in emocional antes da leitura | `EXPERIMENT_SPEC.md` §12 | Seção 5 |
| Reflexão livre depois, nunca altera a leitura | `EXPERIMENT_SPEC.md` §13-14 | Seção 10 |
| Cálculo ≠ conhecimento ≠ interpretação | `EXPERIMENT_SPEC.md` §16 | Seção 7 (geração/cache), seção 8 (base de conhecimento), seção 9 (papel da IA) — este é o eixo estrutural de todo o PRD |
| IA nunca determina elemento calculável | `EXPERIMENT_SPEC.md` §17 | Seção 9 |
| Rastreabilidade obrigatória ("Entender o porquê") | `EXPERIMENT_SPEC.md` §20 | Seção 11 |
| 4 participantes, sem conta pública/monetização/escala | `EXPERIMENT_SPEC.md` §3, §24 | Seção 3, seção 12 (não-funcionais) |
| Pendências por motor (Numerologia/Dreamspell/Design Humano) | `ENGINE_VALIDATION.md` | Seção 13 — viram bloqueios explícitos, não são resolvidas aqui |

---

# 3. Escopo do laboratório

- 4 participantes nomeados: Guilherme, Carlos, Dani, Julie. Sem cadastro aberto, sem convite público.
- Autenticação: suficiente que cada participante acesse apenas os próprios dados. Não é necessário um sistema de auth sofisticado — login simples por participante pré-cadastrado é suficiente para o laboratório.
- Sem app nativo, sem app stores. Web responsivo é suficiente (`EXPERIMENT_SPEC.md` §24 já exclui app nativo).
- Sem notificações push, sem gamificação, sem streaks — já excluídos explicitamente.
- Duração inicial: ciclo de 30 dias (`EXPERIMENT_SPEC.md` §26). O produto deve ser simples o bastante para não exigir manutenção pesada durante esse ciclo.

---

# 4. Arquitetura de informação

## 4.1 A hierarquia (obrigatória, conforme `EXPERIENCE_MODEL.md` §2)

```text
PESSOA → ANO → MÊS → SEMANA → HOJE
```

Esta é a estrutura de **navegação por "lente"**: aproximação do horizonte, não uma linha do tempo navegável. Ela convive sem conflito com a restrição de `EXPERIMENT_SPEC.md` §11 (sem navegar para datas passadas/futuras): dentro de cada horizonte, o usuário só vê **o período que está vivendo agora** naquele horizonte — o ano pessoal vigente, o mês vigente, a semana vigente, o dia de hoje. Mudar de horizonte não é "navegar no tempo", é "mudar de lente" sobre o presente.

## 4.2 As três vozes, em todos os níveis — sem forçar cobertura onde não há metodologia (decisão registrada em `ENGINE_VALIDATION.md` v0.3, seção 7)

Cada horizonte (exceto Pessoa, que é estrutural) apresenta até três blocos independentes e não sintetizados:

> **Design Humano** | **Dreamspell** | **Numerologia**

Nenhuma tela deve combinar os três em um texto único. Isso é estrutural, não estético — está encoberto pela decisão de "três vozes" de `FOUNDATION.md` §8 e `EXPERIMENT_SPEC.md` §5-6.

**Princípio adicional, agora explícito**: a hierarquia Pessoa→Ano→Mês→Semana→Hoje é uma **arquitetura de experiência**, não uma exigência de que todo sistema produza conteúdo em todo horizonte. Um horizonte pode legitimamente exibir **um, dois ou três blocos**, nunca zero (se nenhum sistema tem leitura para aquele horizonte, o horizonte inteiro não deveria existir na navegação). Onde um sistema não tem metodologia validada para um horizonte específico, a tela mostra os sistemas que têm, e nada mais — não um placeholder pedindo desculpas, não uma leitura forçada. Casos já conhecidos onde isso se aplica: "Ano" sem Design Humano (decisão consciente, não uma lacuna a esconder) e "Ano"/"Mês" sem a estrutura nativa do Sincronário no Dreamspell (achado técnico registrado em `ENGINE_VALIDATION.md` v0.3 — só o Kin e o que deriva dele, incluindo Hoje e uma Semana composta por 7 Kins, estão prontos; a posição na Lua de 13 e o Ano Portador não foram implementados).

## 4.3 Telas mínimas do laboratório

1. **Pessoa** — um card por sistema, com o núcleo natal (`EXPERIENCE_MODEL.md` §5) e link "Explorar meu mapa/Kin/desenho →" para profundidade.
2. **Ano** — três blocos, leitura ampla do ciclo vigente.
3. **Mês** — três blocos, leitura intermediária.
4. **Semana** — três blocos, leitura curta (natureza de composição do produto, não conceito nativo de nenhum sistema — `EXPERIENCE_MODEL.md` §8).
5. **Hoje** — três blocos curtos + "Entender o porquê" em cada um. É o núcleo recorrente da experiência (`EXPERIMENT_SPEC.md` §10).
6. **Reflexão** — aparece depois de Hoje já ter sido visto, nunca antes.

---

# 5. Fluxo principal

```text
1. Participante abre o app.
2. Tela inicial = "Seu momento" (saudação + seletor Ano | Mês | Semana | Hoje).
   Sem pergunta de humor, sem check-in emocional (EXPERIMENT_SPEC §12).
3. Participante escolhe um horizonte (default: Hoje).
4. Vê os três blocos (Design Humano, Dreamspell, Numerologia) para esse horizonte.
5. Pode abrir "Entender o porquê" em qualquer bloco -> ver elementos calculados e a
   regra/fonte que originou a leitura (rastreabilidade, seção 11).
6. Em qualquer momento depois de ter visto a leitura do dia, pode acessar "Reflexão":
   - campo livre: "Como foi seu dia?"
   - escala por sistema: "Quanto essa leitura fez sentido?" (nada/pouco/parcialmente/bastante/muito)
   - a reflexão é armazenada separadamente e NUNCA reescreve a leitura já mostrada.
```

Não existe fluxo de "consultar amanhã" ou "ver o mês passado" no laboratório (`EXPERIMENT_SPEC.md` §11, §24).

---

# 6. Modelo de dados mínimo

Entidades abaixo, propositalmente simples para um laboratório de 4 pessoas (sem otimização para escala):

```text
Participante
  id, nome, nome_completo_nascimento, data_nascimento, hora_nascimento,
  local_nascimento (texto + coordenadas), timezone_historico_no_nascimento,
  confiabilidade_hora_nascimento (alta/media/baixa/desconhecida)

PerfilNatal_DesignHumano   [bloqueado — ver seção 13]
  participante_id, ativacoes_personalidade[13], ativacoes_design[13],
  perfil, portas_da_cruz, tipo, autoridade, definicao, centros_definidos[],
  canais_definidos[], nome_cruz, angulo_cruz, variaveis

PerfilNatal_Dreamspell   [bloqueado — ver seção 13]
  participante_id, kin, selo, tom, onda_encantada, guia, analogo, antipoda,
  oculto, familia_terrestre, plasma, crono_psi

PerfilNatal_Numerologia   [pronto para os campos validados — ver seção 13]
  participante_id, dia_natalicio, numero_psiquico, motivacao, impressao,
  expressao, destino, missao, licoes_carmicas[], tendencias_ocultas[],
  resposta_subconsciente, ciclos_de_vida[3], desafios[3], momentos_decisivos[4],
  talento_oculto (nullable, hipotese), debitos_carmicos[] (nullable, nao resolvido)

ElementoCalculadoDiario
  participante_id, sistema, data_referencia, horizonte (ano|mes|semana|hoje),
  elementos_json (saida bruta e determinística do motor), gerado_em

BaseConhecimento
  sistema, tipo_elemento (ex.: gate, kin, numero), chave_elemento,
  texto_curado (escrito pela equipe, nunca copiado de fonte protegida),
  fonte_de_estudo (referência, não citação literal)

LeituraGerada
  id, participante_id, sistema, horizonte, data_referencia,
  texto_leitura, elementos_calculados_ref[] (-> ElementoCalculadoDiario),
  conhecimento_usado_ref[] (-> BaseConhecimento),
  gerado_em, modelo_ia_usado, imutavel_apos_geracao=true

Reflexao
  id, participante_id, data_referencia, relato_livre_texto,
  ressonancia_design_humano, ressonancia_dreamspell, ressonancia_numerologia,
  registrado_em
  # relacionado a LeituraGerada apenas por data_referencia — nunca escreve nela

RegistroDivergencia
  sistema, campo, entrada, resultado_a, metodologia_a, resultado_b,
  metodologia_b, causa_possivel, decisao_adotada, status
  # implementação direta da EXPERIMENT_SPEC §23
```

Pontos estruturais que o modelo de dados precisa garantir:
- `LeituraGerada` é **imutável** depois de criada (preserva `EXPERIMENT_SPEC.md` §14 — nunca alterar leitura histórica).
- `LeituraGerada` sempre referencia de onde veio (`elementos_calculados_ref`, `conhecimento_usado_ref`) — sem isso, "Entender o porquê" não tem como funcionar.
- `Reflexao` é uma tabela **totalmente separada** de `LeituraGerada`, ligada só por data — nunca uma referência de escrita.

---

# 7. Estratégia de geração e cache das leituras

## 7.1 Separação obrigatória em três passos

```text
1. CÁLCULO (determinístico, sem IA)
   -> grava em ElementoCalculadoDiario

2. COMPOSIÇÃO (IA + BaseConhecimento, nunca inventa elemento)
   -> grava em LeituraGerada

3. EXIBIÇÃO (app lê LeituraGerada já pronta)
```

A IA nunca é chamada sem que o passo 1 já tenha rodado e gravado o resultado. Isso não é só um princípio — é a garantia técnica de que a seção 16-17 do `EXPERIMENT_SPEC.md` é impossível de violar acidentalmente por um bug de prompt.

## 7.2 Quando calcular e gerar

| Horizonte | Quando recalcular | Quando gerar leitura (IA) |
|---|---|---|
| Hoje | 1x/dia, na virada do dia (ou no primeiro acesso do participante naquele dia, o que vier primeiro) | 1x/dia, logo após o cálculo — depois fica em cache pelo resto do dia |
| Semana | 1x por semana vigente, na entrada da semana | 1x por semana, no primeiro acesso |
| Mês | 1x por mês vigente (considerando que Numerologia pode ter transição no meio do mês gregoriano — `EXPERIENCE_MODEL.md` §7) | 1x por período de Mês Pessoal vigente |
| Ano | 1x por ciclo de Ano Pessoal vigente | 1x por ciclo |
| Pessoa | 1x, quando o perfil natal é cadastrado/validado | 1x, com re-geração manual se a base de conhecimento mudar |

**Decisão de design confirmada pela equipe**: "Hoje" é uma fotografia diária congelada — uma vez gerada, a leitura fica travada pelo resto do dia, mesmo que a posição de trânsito mude tecnicamente (ex.: Design Humano — um trânsito pode cruzar de linha durante o dia; sabemos, pelo print do Human Design App, que a Lua faz isso a cada ~1h42min). O **horário exato de referência** desse congelamento (ex.: primeiro acesso do participante vs. um horário fixo de virada) é uma decisão técnica, detalhada no `IMPLEMENTATION_PLAN.md`.

## 7.3 Nenhuma leitura é gerada sob demanda a partir do zero pela IA

A IA nunca recebe "calcule e interprete" numa única chamada. Ela sempre recebe elementos já calculados + trechos já curados da base de conhecimento, e só then compõe a linguagem final.

---

# 8. Base de conhecimento (a camada curada)

Estrutura mínima por sistema, uma entrada por elemento relevante:

```text
Design Humano:    64 gates x 6 linhas (núcleo: significado do gate; linha é
                   profundidade opcional), + significado de cada Tipo/Autoridade
                   quando essa camada estiver validada.
Dreamspell:       20 selos, 13 tons, 20 ondas encantadas (a onda reaproveita
                   o significado do selo que a abre).
Numerologia:      significado de cada número 1-9 (+ 11/22 quando aplicável)
                   nos contextos: Destino, Expressão, Motivação, Impressão,
                   Missão, Ano/Mês/Dia Pessoal.
```

Regras não-negociáveis (de `TECH_RESEARCH.md` §6 e `EXPERIMENT_SPEC.md` §18):
- Todo texto é **escrito pela equipe**, nunca copiado de Jovian Archive, Foundation for the Law of Time, ou do material NumWeb.
- Cada entrada pode citar a fonte de estudo (para rastreabilidade), mas não reproduz o texto da fonte.
- A base de conhecimento é versionada — se um texto mudar, leituras já geradas (`LeituraGerada`) não são retroativamente alteradas (consistente com a imutabilidade da seção 6).

Este é o motor central que faz "Entender o porquê" funcionar sem depender do LLM "lembrar" o significado de um gate ou selo — o significado vem de uma tabela nossa, não da memória do modelo.

---

# 9. Papel da IA

## O que a IA nunca faz
Determinar Kin, Selo, Tom, Gate, Linha, Tipo, Autoridade, Ano/Mês/Dia Pessoal, ou qualquer elemento com regra determinística (`EXPERIMENT_SPEC.md` §17). Todos esses vêm de `ElementoCalculadoDiario`, nunca de geração livre.

## O que a IA faz
Recebe, por chamada, exatamente:
```text
- elementos calculados do dia/período (de ElementoCalculadoDiario)
- os trechos relevantes da base de conhecimento curada (de BaseConhecimento)
- o horizonte (ano/mês/semana/hoje) — que define o nível de linguagem
  (EXPERIENCE_MODEL §4: quanto mais amplo o horizonte, mais estrutural;
  quanto mais próximo do presente, mais simples e observável)
- as regras de linguagem (seção abaixo)
```
E produz: tema curto + explicação breve + convite de observação, no formato de `EXPERIENCE_MODEL.md` §9.

## Regras de linguagem (herdadas de `EXPERIMENT_SPEC.md` §29, não reabertas)
Evitar: "hoje acontecerá", "você deve", "não faça", "esse trânsito significa que você terá".
Preferir: "pode ser interessante observar", "este sistema destaca", "observe como isso se manifesta para você".

## Isolamento entre sistemas
Cada chamada de IA que gera uma leitura recebe dados de **um único sistema**. Não existe (nesta fase) uma chamada que veja Design Humano + Dreamspell + Numerologia juntos — isso preserva "sem síntese" na própria arquitetura, não apenas no prompt.

---

# 10. Reflexão posterior

Implementação direta de `EXPERIMENT_SPEC.md` §12-15:

- Nunca aparece antes da leitura ter sido vista.
- Pergunta aberta: "Como foi seu dia?" (texto livre).
- Pergunta de ressonância **por sistema**, não combinada: "Olhando para o que você viveu, quanto a leitura de [sistema] fez sentido?" — escala nada/pouco/parcialmente/bastante/muito.
- Nunca perguntas direcionadoras que sugerem o conteúdo da leitura.
- Gravada em `Reflexao`, nunca reescreve `LeituraGerada`.
- Opcional: campo de configuração por participante para habilitar o "experimento anti-viés" descrito em `EXPERIMENT_SPEC.md` §15 (ocultar a leitura até depois do relato) — **fica desligado por padrão**, é hipótese futura, não requisito do MVP.

---

# 11. Rastreabilidade ("Entender o porquê")

Cadeia obrigatória, de `EXPERIMENT_SPEC.md` §20:

```text
frase apresentada (LeituraGerada.texto_leitura)
   ↓
conhecimento usado (LeituraGerada.conhecimento_usado_ref -> BaseConhecimento)
   ↓
elemento calculado (LeituraGerada.elementos_calculados_ref -> ElementoCalculadoDiario)
   ↓
regra/fonte (BaseConhecimento.fonte_de_estudo + a lógica do motor que gerou o elemento)
```

Requisito de UI: "Entender o porquê" precisa conseguir mostrar, no mínimo, os elementos calculados brutos (ex.: "Sol em Gate 59, Linha 3") — não precisa (nesta fase) expor o código do motor, só o resultado determinístico e o texto curado que o originou.

---

# 12. Requisitos não-funcionais

- **Sem infraestrutura de escala.** 4 usuários, cálculo diário simples — não há necessidade de fila de processamento, cache distribuído, CDN, etc.
- **Sem monetização, sem planos, sem billing.**
- **Observabilidade mínima, não ausente**: logs suficientes para saber quando um cálculo falhou silenciosamente (crítico dado que os motores têm pendências reais — seção 13) e para popular `RegistroDivergencia` quando aplicável.
- **Privacidade**: dados de nascimento e reflexões são sensíveis; acesso restrito ao próprio participante. Sem necessidade de conformidade regulatória pesada dado o escopo privado, mas sem exposição pública de dados também.
- **Idioma**: português, consistente com todos os documentos do projeto.

---

# 13. Dependências e bloqueios explícitos por motor (atualizado — ver `ENGINE_VALIDATION.md` v0.3)

Esta seção não resolve nada — ela reflete o estado atual dos motores, herdado de `ENGINE_VALIDATION.md` v0.3. **A situação mudou substancialmente desde a v0.1 deste PRD**: as três pendências que bloqueavam horizontes inteiros (convenção de Kin do Dreamspell, Dia Pessoal da Numerologia, Trânsito×Natal do Design Humano) foram todas fechadas.

## 13.1 Numerologia — desbloqueada em todos os horizontes

✅ Todos os campos usados pela hierarquia Pessoa→Ano→Mês→Semana→Hoje estão validados, incluindo Dia Pessoal (metodologia confirmada pela equipe contra o material de referência — ver `ENGINE_VALIDATION.md` v0.2, seção 1).

⚠️ Campos individuais que continuam pendentes, mas **não bloqueiam nenhum horizonte**: Talento Oculto (hipótese, 1 ponto de dado) e Débitos Cármicos (não resolvido). Se esses campos aparecerem em alguma tela, devem ser marcados como "em validação" na UI, ou omitidos até serem confirmados — decisão de conteúdo, não mais de engenharia.

## 13.2 Dreamspell — Pessoa, Semana e Hoje prontos; Ano e Mês nativos não implementados (correção desta rodada)

✅ A convenção de Kin foi decidida e validada diretamente contra o Sincronário da Paz (25/jul avança a contagem, 29/fev não avança). Toda a mecânica que deriva do Kin (Selo, Tom, Onda Encantada) está validada. Isso é suficiente para **Pessoa** (Kin natal), **Hoje** (Kin do dia) e **Semana** (composição de 7 Kins consecutivos, sem inventar um conceito nativo — `EXPERIENCE_MODEL.md` §8 já autoriza essa composição).

⚠️ **Correção de escopo**: a estrutura própria de **Ano** e **Mês** do Sincronário das 13 Luas (em qual Lua de 13 uma data cai, Ano Portador) **não foi implementada nem validada** — isso tinha sido marcado ✅ numa revisão anterior deste PRD por engano, ao assumir que fechar a convenção de Kin fechava o motor inteiro. Não fecha: o Kin resolve Hoje/Semana/Pessoa, não Ano/Mês. Corrigido nesta revisão, seguindo o mesmo princípio da decisão sobre "Ano" de Design Humano (seção 4.2): **os horizontes Ano e Mês de Dreamspell ficam sem leitura até essa estrutura ser implementada e validada** — não bloqueiam o restante do laboratório.

## 13.3 Design Humano — Pessoa, Mês, Semana e Hoje prontos; Ano sem leitura por decisão

✅ **Validado**: as 26 ativações brutas, Perfil, Portas da Cruz, Tipo, Autoridade, Definição, Assinatura, Tema do Não-Ser, Estratégia, e Trânsito × Natal (confirmado por print do Human Design App + `humandesign_api` como QA independente — `ENGINE_VALIDATION.md` v0.3).

**Decisão final registrada**: Retorno Solar não será adotado como metodologia de "Ano" nesta versão. O horizonte Ano de Design Humano **fica sem leitura** — decisão consciente, não uma lacuna técnica a resolver depois. Se uma metodologia mais nativa ao sistema for encontrada no futuro, essa decisão pode ser revisitada; até lá, a tela "Ano" simplesmente não mostra um bloco de Design Humano (ver princípio da seção 4.2).

**Nome da Cruz, Ângulo e Variáveis**: decisão final — não bloqueiam o laboratório. Os valores já confirmados para participantes com Golden Profile fechado (ex.: Guilherme: "Cruz da Fênix Adormecida", Ângulo Direito, PLL DRL) podem ser **preservados manualmente** por participante. A tabela completa de ~192 combinações não será implementada agora.

**Sobre `humandesign_api`**: decisão final — permanece só como fonte de QA independente, usada pontualmente (não como serviço contínuo). O motor de produção continua sendo o nosso.

## 13.4 Resumo do impacto no MVP (corrigido nesta rodada)

| Sistema | Pessoa | Ano | Mês | Semana | Hoje |
|---|---|---|---|---|---|
| Numerologia | ✅ | ✅ | ✅ | ✅ (composição) | ✅ |
| Dreamspell | ✅ | **sem leitura** (não implementado) | **sem leitura** (não implementado) | ✅ (composição de 7 Kins) | ✅ |
| Design Humano | ✅ | **sem leitura** (decisão consciente) | ✅ | ✅ | ✅ |

Nenhuma célula "sem leitura" é um bloqueio do laboratório — são ausências deliberadas, conforme o princípio da seção 4.2. O laboratório está pronto para a primeira experiência funcional com essa cobertura: todos os cinco horizontes existem e têm pelo menos um sistema com leitura válida; nenhum horizonte fica vazio.

---

# 14. Decisions Needed Before Implementation — ENCERRADA nesta rodada

Todas as seis decisões que restavam (metodologia de Ano para Design Humano, Nome da Cruz/conteúdo, uso operacional de `humandesign_api`, congelamento do "Hoje", segundo perfil, e o princípio de não forçar cobertura em todos os horizontes) foram tomadas pela equipe e estão registradas em `ENGINE_VALIDATION.md` v0.3, seção 7, e refletidas na seção 13 acima. A única decisão que passa adiante, por instrução explícita da equipe, é o **horário exato de referência do congelamento de "Hoje"** — tratado como decisão técnica no `IMPLEMENTATION_PLAN.md`, não aqui.

Esta seção fica preservada como registro histórico do que foi decidido; não há mais itens em aberto neste PRD. Decisões de implementação (arquitetura técnica, ordem de construção, testes) passam a ser tratadas em `IMPLEMENTATION_PLAN.md`.

---

# 15. Critérios de aceite

Adaptando `EXPERIMENT_SPEC.md` §22 e §25 para requisitos verificáveis:

1. Para todo elemento calculável exibido no produto, existe um teste automatizado que reproduz o Golden Profile correspondente (já existe para os campos não bloqueados — `engine_validation/test_golden_profile.py`).
2. Nenhuma tela do produto exibe um elemento cujo motor esteja marcado como bloqueado na seção 13, mesmo que tecnicamente calculável.
3. Toda `LeituraGerada` tem rastreabilidade completa até `ElementoCalculadoDiario` e `BaseConhecimento` — testável automaticamente (nenhuma leitura sem referências).
4. Nenhuma leitura contém linguagem de certeza/fatalismo (seção 9) — sujeito a revisão manual periódica das leituras geradas, não apenas ao prompt.
5. A reflexão de um dia nunca altera `LeituraGerada` daquele dia — testável (imutabilidade).
6. Divergências entre metodologias (ex.: convenções Dreamspell) ficam registradas em `RegistroDivergencia`, nunca silenciosamente escolhidas no código.
7. Os quatro participantes conseguem, ao final dos 30 dias, responder às perguntas de `EXPERIMENT_SPEC.md` §25 (recorrência, horizonte mais usado, sistema mais consultado, profundidade, ressonância, aprendizado, utilidade) — o que exige que o produto registre uso mínimo (quais telas foram abertas, quando) sem virar analytics pesado.

---

# 16. Fases de implementação (proposta, revisada — os bloqueios técnicos da v0.1 estão fechados)

## Fase 0 — (encerrada) Decisões de produto/metodologia
Todas as decisões que bloqueavam esta fase foram tomadas (ver seção 14). Não há mais nada a resolver antes de começar a construir — ver `IMPLEMENTATION_PLAN.md` para a ordem exata de implementação.

## Fase 1 — Numerologia (Pessoa, Ano, Mês, Hoje) — completa
Não há mais bloqueio nenhum neste sistema. Inclui: `PerfilNatal_Numerologia`, `ElementoCalculadoDiario`/`LeituraGerada` para Numerologia, base de conhecimento dos números, todas as cinco telas.

## Fase 2 — Reflexão (pode entrar em paralelo com a Fase 1)
Não depende de todos os sistemas estarem prontos — só precisa de pelo menos um sistema com leituras reais para se ancorar.

## Fase 3 — Dreamspell (Pessoa, Semana, Hoje) — pronto para os três; Ano/Mês nativos não implementados
Inclui: `PerfilNatal_Dreamspell`, base de conhecimento de selos/tons, telas Pessoa/Semana/Hoje. Ano e Mês do Sincronário ficam sem leitura (achado desta rodada, seção 13.2) — não fazem parte do escopo desta fase nem de nenhuma fase planejada até uma metodologia própria ser implementada e validada.

## Fase 4 — Design Humano (Pessoa, Mês, Semana, Hoje) — completo para os quatro; Ano sem leitura por decisão
Inclui: grafo de canais/centros já implementado e validado (`hd_bodygraph.py`), lógica de trânsito×natal validada (`hd_transit.py`), base de conhecimento de gates/tipos. A tela "Ano" não inclui bloco de Design Humano (decisão final registrada em `ENGINE_VALIDATION.md` v0.3).

## Fase 5 — Semana (todos os sistemas)
Continua deliberadamente por último — é a camada de composição autoral do produto (`EXPERIENCE_MODEL.md` §8, §18), a que menos tem uma resposta óbvia, e a que menos compromete o experimento se chegar depois. Tecnicamente já não há bloqueio de motor para nenhum dos três sistemas neste horizonte — a ordem aqui é por prioridade de produto, não por prontidão técnica.

---

# 17. O que este PRD deliberadamente não inclui

Reafirmando `EXPERIMENT_SPEC.md` §24 — nada disso está neste PRD nem deveria: calendário navegável completo, navegação livre por datas, síntese entre sistemas, chatbot espiritual, gamificação, notificações, rede social, monetização, app nativo, sistema genérico para público externo.
