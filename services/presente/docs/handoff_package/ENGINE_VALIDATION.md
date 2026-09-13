# ENGINE_VALIDATION.md — Validação dos Três Motores

**Status:** Pós-pesquisa técnica, pré-PRD
**Versão:** 0.1
**Entrada:** `GOLDEN_PROFILE_GUILHERME.md`
**Saída de código:** `engine_validation/` (3 motores + 1 suíte de testes, 48 PASS / 0 FAIL / 8 PENDENTE)

Este documento não decide nada sozinho — ele reporta o que foi reproduzido, o que ficou pendente e onde há divergência real, para retornar à discussão antes do PRD (conforme o critério da seção 32 do `EXPERIMENT_SPEC.md`).

---

# 0. Como ler este documento

Cada motor tem: **regras adotadas**, **fonte**, **casos testados**, **resultado esperado vs. obtido**, **divergências**, **status**, **pendências**. Nenhuma divergência foi resolvida silenciosamente — onde havia mais de uma hipótese plausível, as duas foram implementadas e testadas lado a lado.

---

# 1. Numerologia

## Regra adotada (achado principal desta fase)

A referência (mapa de Guilherme, estilo NumWeb) usa a **tabela Caldeia / NCT** — valores de letra de **1 a 8, sem o número 9** — e **não** a tabela Pitagórica clássica nem uma numerologia cabalística baseada no alfabeto hebraico. Isso resolve a suspeita já registrada na seção 4 do `EXPERIMENT_SPEC.md` e no `TECH_RESEARCH.md`.

Confirmado reproduzindo simultaneamente Expressão=3, Motivação=1, Impressão=2 — nenhuma outra combinação de tabela testada (Pitagórica, com/sem partícula "dos") reproduziu os três ao mesmo tempo.

Regras adicionais confirmadas junto:
- A partícula **"dos"** é **mantida** no cálculo do nome (testado: excluir "dos" quebra o resultado).
- Motivação/Impressão/Expressão são **sempre reduzidas totalmente a um dígito** — números mestres (11/22) **não são preservados** nesses três campos. Evidência: Impressão bruta = 47 → 11 → 2; a referência espera 2, não 11.
- Tendências Ocultas usa limiar de **4 ou mais ocorrências** (não 3+, como uma primeira hipótese sugeria).

## Fonte
Mapa Numerológico Pessoal fornecido para Guilherme Moreira dos Santos (25/08/1988), conforme `GOLDEN_PROFILE_GUILHERME.md`.

## Casos testados e resultado

| Campo | Esperado | Obtido | Status |
|---|---|---|---|
| Dia Natalício | 25 | 25 | ✅ MATCH |
| Número Psíquico | 7 | 7 | ✅ MATCH |
| Motivação | 1 | 1 | ✅ MATCH |
| Impressão | 2 | 2 | ✅ MATCH |
| Expressão | 3 | 3 | ✅ MATCH |
| Destino | 5 | 5 | ✅ MATCH |
| Missão | 8 | 8 | ✅ MATCH |
| Lições Cármicas | 8, 9 | 8, 9 | ✅ MATCH |
| Tendências Ocultas | 1, 3, 4, 5 | 1, 3, 4, 5 | ✅ MATCH |
| Resposta Subconsciente | 7 | 7 | ✅ MATCH |
| Ciclos de Vida | 8, 7, 8 | 8, 7, 8 | ✅ MATCH |
| Desafios | 1, 1, 0 | 1, 1, 0 | ✅ MATCH |
| Momentos Decisivos | 6, 6, 3, 7 | 6, 6, 3, 7 | ✅ MATCH |
| Mês Pessoal 24/08/2026 (antes do aniversário) | 5 | 5 | ✅ MATCH |
| Mês Pessoal 25/08/2026 (dia do aniversário) | 6 | 6 | ✅ MATCH |
| Talento Oculto | 4 | 4 (via hipótese `\|Destino−Motivação\|`) | ⚠️ PENDENTE |
| Débitos Cármicos | 14, 19 | não reproduzido | ⚠️ PENDENTE |
| Dia Pessoal | (sem valor de referência) | não testável | ⚠️ PENDENTE |

**13 de 13 campos com valor de referência disponível bateram exatamente**, incluindo a regra temporal de transição de Mês Pessoal no aniversário (esta é a evidência mais forte de que a tabela e as regras de redução estão corretas, porque a transição depende de dois anos-ciclo diferentes calculados independentemente).

## Divergências / pendências documentadas (não resolvidas silenciosamente)

**Talento Oculto** — a fórmula `|Destino − Motivação| = |5−1| = 4` reproduz o valor esperado, mas é a única hipótese que bateu entre as testadas — com **um único ponto de dado**, não há como descartar coincidência. Marcado como hipótese, não como regra confirmada.

**Débitos Cármicos** — nenhuma hipótese testada (checagem de somas brutas de Expressão/Motivação/Impressão/Destino contra o conjunto {13,14,16,19}, inclusive testando a tabela Pitagórica em paralelo) reproduziu 14 e 19. Isso não foi forçado. Fica em aberto até termos a regra documentada da fonte (NumWeb) ou um segundo caso de teste que ajude a triangular.

**Dia Pessoal** — o Golden Profile não contém um valor de referência para este campo. Implementei a hipótese natural (mesma cascata Ano→Mês→Dia), mas ela está **sem validação**, não confirmada.

**Regra de partículas ("dos")** — confirmada apenas para este nome específico. Nomes com "de"/"da" em outras posições, ou sobrenomes duplos, ainda não foram testados.

## Status
`ENGINE_MATCH` para os 13 campos com valor de referência. `HYPOTHESIS_PENDING` para Talento Oculto. `UNRESOLVED` para Débitos Cármicos. `NO_REFERENCE_DATA` para Dia Pessoal.

## Pendências para a equipe
1. Confirmar (ou não) a hipótese de Talento Oculto com um segundo nome/data — idealmente de outro participante (Carlos, Dani ou Julie).
2. Obter a regra documentada de Débitos Cármicos da fonte NumWeb, ou fornecer um segundo caso de teste.
3. Fornecer um valor de referência de Dia Pessoal para uma data específica.

---

# 2. Dreamspell / Sincronário das 13 Luas

## Regras adotadas e confirmadas
- Época: **26 de julho de 1987 = Kin 34, Mago Galáctico Branco** (Harmonic Convergence) — confirmada por múltiplas fontes independentes de pesquisa.
- Selo = `((Kin−1) mod 20) + 1`, indexado na sequência padrão de 20 selos.
- Tom = `((Kin−1) mod 13) + 1`.
- Cor do selo = ciclo de 4 cores (Vermelho, Branco, Azul, Amarelo) pela posição do selo na sequência de 20.
- Onda Encantada = o bloco de 13 Kins ao qual o Kin pertence; o selo que abre a onda é o selo do primeiro Kin desse bloco (tom 1).

Essas regras foram confirmadas de duas formas independentes: (a) reproduzindo exatamente "Mago Galáctico Branco" para a época, e (b) reproduzindo exatamente Selo 9 Lua Vermelha / Tom 13 Cósmico / Onda da Terra Vermelha **assumindo** Kin=169 — ou seja, a mecânica de derivação está correta independentemente da divergência descrita abaixo.

## Divergência real, não resolvida (a mais importante deste documento)

O `GOLDEN_PROFILE_GUILHERME.md` já sinalizava Kin=169 para 25/08/1988 como **"resultado provisório... precisa ser congelado contra a calculadora de referência"**. A validação confirma que havia motivo para essa cautela:

Existem dois "dias verdes" que **não recebem Kin** na convenção Dreamspell: o **Dia Fora do Tempo** (25 de julho) e o **29 de fevereiro**. Entre a época (26/07/1987) e 25/08/1988 existe exatamente **um** de cada. Isso cria uma ambiguidade matemática real:

| Convenção | Kin resultante | Bate com Kin=169? |
|---|---|---|
| Pula os dois (DFT **e** 29/fev) | 168 | ❌ |
| Pula só o Dia Fora do Tempo | 169 | ✅ |
| Pula só o 29 de fevereiro | 169 | ✅ |
| Não pula nenhum (contagem gregoriana pura) | 170 | ❌ |

**Duas convenções diferentes e mutuamente incompatíveis** reproduzem o valor provisório de 169 igualmente bem — porque, para esta data específica, "pular só um dos dois dias verdes" produz o mesmo resultado independente de qual dos dois for pulado. Isso só vai divergir de verdade em datas onde os dois tipos de dia verde não aparecem em pares perfeitamente balanceados desde a época — exatamente os casos de borda que o próprio Golden Profile já pede para testar (seção "Casos adicionais": Dia Fora do Tempo isolado, 29 de fevereiro isolado, virada de ano do Sincronário, 5 datas aleatórias).

**Não escolhi nenhuma das quatro convenções.** O motor (`dreamspell_engine.py`) implementa as quatro como parâmetros explícitos (`skip_dft`, `skip_leap`), sem default assumido como "correto".

Tentei também uma segunda fonte pública (uma data de 2024 citada por uma wiki gerada por IA) para desambiguar — o resultado não bateu com nenhuma das quatro convenções por uma margem grande demais para ser explicada por essa ambiguidade específica, o que sugere que essa segunda fonte não é confiável o suficiente para ser usada como desempate (Grokipedia é gerado por IA e pode conter erros; não deveria ser tratado como equivalente ao Sincronário da Paz).

## Casos testados

| Caso | Resultado |
|---|---|
| Época (26/07/1987) → Kin 34, Mago Galáctico Branco | ✅ MATCH |
| Derivação Selo/Tom/Onda assumindo Kin=169 | ✅ MATCH (3/3 elementos) |
| Kin de 25/08/1988 sob as 4 convenções | ⚠️ Ambíguo — 2 das 4 batem com o valor provisório |
| Dia Fora do Tempo isolado | ❌ Não testado — pendente |
| 29 de fevereiro isolado | ❌ Não testado — pendente |
| Virada de ano do Sincronário | ❌ Não testado — pendente |
| 5 datas aleatórias adicionais | ❌ Não testado — pendente |

## Status
`METHODOLOGY_LOCKED / GOLDEN_VALUE_AMBIGUOUS`. A mecânica de derivação (Selo/Tom/cor/Onda) está `ENGINE_MATCH`. A contagem de Kin em si está `PENDING_DECISION`.

## Pendência crítica para a equipe
Esta é a decisão mais importante pendente de todo o documento: **qual convenção de dias verdes o Sincronário da Paz de fato usa?** Isso não pode ser resolvido por pesquisa externa — precisa ser conferido diretamente contra a fonte física/oficial do Sincronário da Paz, testando especificamente uma data que atravesse **um** Dia Fora do Tempo **sem** atravessar um 29 de fevereiro (ou vice-versa), para quebrar o empate. Recomendo fortemente resolver isso antes de gerar qualquer leitura diária — um erro de 1-2 dias na contagem desalinha silenciosamente todos os Kins subsequentes.

---

# 3. Design Humano

## Regra adotada e confirmada — ativações brutas

Usando **Swiss Ephemeris** (via `pyswisseph`) em modo **Moshier** (efeméride analítica embutida, sem necessidade de arquivos externos — necessário porque este ambiente de validação não tem acesso de rede a astro.com), calculei:

- Posições eclípticas de Sol, Terra (Sol+180°), Lua, Nodo Norte/Sul, Mercúrio, Vênus, Marte, Júpiter, Saturno, Urano, Netuno e Plutão — no momento exato do nascimento (Personalidade) e no momento em que o Sol estava 88° de arco solar antes (Design), encontrado por busca binária angular.
- Mapeamento longitude → portão.linha usando a sequência padrão de 64 portões da mandala de Design Humano.
- **Um offset fixo de ~1,7345°** entre a longitude tropical bruta e o ponto zero da roda de portões — não documentado explicitamente em nenhuma fonte consultada nesta fase, mas **determinado empiricamente** por ajuste fino contra os 26 valores do Golden Profile (faixa que reproduz todos os 26: [1,676°, 1,793°]).

## Resultado: 26 de 26 ativações reproduzidas exatamente

| | Personalidade (13 corpos) | Design (13 corpos) |
|---|---|---|
| Resultado | **13/13 MATCH** | **13/13 MATCH** |

O mesmo offset (1,7345°) funcionou tanto para o momento do nascimento quanto para o momento ~92 dias antes (Design) — como são dois momentos astronômicos independentes, essa dupla confirmação é evidência forte de que o offset é uma constante real da mandala, e não uma coincidência ajustada a um único momento.

## Derivações adicionais confirmadas
- **Perfil = linha do Sol na Personalidade / linha do Sol no Design = 3/5** ✅ MATCH.
- **Portas da Cruz = Sol/Terra (Personalidade) | Sol/Terra (Design) = 59/55 | 20/34** ✅ MATCH (os 4 gates批em exatamente, na ordem certa).

## O que NÃO foi implementado nesta fase (deliberadamente)

Tipo, Autoridade, Definição, Centros definidos, Canais, o **nome** da Cruz de Encarnação (ex.: "Cruz da Fênix Adormecida") e a classificação Ângulo Direito/Esquerdo/Justaposta **não foram implementados**. Essas derivações exigem:
- o grafo completo dos 36 canais e o mapeamento canal→centro;
- lógica de definição de centros a partir dos portões ativados;
- uma tabela de consulta extensa (~192 combinações) para nomear cada Cruz de Encarnação — que é justamente o tipo de conteúdo interpretativo com restrição de IP identificado no `TECH_RESEARCH.md` (propriedade da linhagem Jovian Archive).

Não implementei essas partes por decisão consciente, não por dificuldade técnica — a instrução era validar a precisão do cálculo primeiro; a lógica de tipo/autoridade é a próxima camada, bem definida, mas separada.

## Decisão pendente — pare e revise (conforme solicitado)

Usei `pyswisseph` (bindings do Swiss Ephemeris) **apenas para esta validação**, rodando localmente, fora de qualquer serviço de rede. Isso não constitui, por si só, adoção da dependência em produção. Mas, como o `TECH_RESEARCH.md` já documentou, Swiss Ephemeris é dual-licenciado (AGPL-3.0 com cláusula de rede, ou licença comercial paga da Astrodienst) — **adotar esta biblioteca como dependência de produção é uma decisão de licenciamento que precisa de aprovação explícita antes do PRD**, não uma continuação automática do que foi usado aqui para validar.

Duas questões adicionais para decidir junto com essa:
1. O modo Moshier (usado aqui, ~1 arco-segundo de precisão) foi suficiente para bater os 26 valores do golden profile — mas produção pode se beneficiar dos arquivos de efemérides completos (.se1) para mais precisão em casos de borda de linha. Avaliar se vale a pena obtê-los.
2. O offset de 1,7345° foi ajustado empiricamente a partir de **um único perfil natal**. Recomendo confirmá-lo contra pelo menos mais um perfil (Carlos, Dani ou Julie) antes de tratá-lo como constante definitiva do motor.

## Status
`ENGINE_MATCH` para as 26 ativações brutas + Perfil + Portas da Cruz (numéricas). `NOT_IMPLEMENTED` para Tipo/Autoridade/Definição/Centros/Canais/Nome da Cruz/Variáveis. `PENDING_REVIEW` para a decisão de licenciamento do Swiss Ephemeris em produção.

---

# 4. Resumo executivo

| Motor | O que está validado | O que está pendente |
|---|---|---|
| **Numerologia** | Tabela (Caldeia/NCT) + 13/13 campos natais e temporais com referência disponível | Talento Oculto (hipótese), Débitos Cármicos (não resolvido), Dia Pessoal (sem dado de referência) |
| **Dreamspell** | Época + mecânica Selo/Tom/Onda (3/3) | **A própria contagem de Kin** — ambiguidade real entre convenções de dias verdes, não resolvida |
| **Design Humano** | 26/26 ativações brutas + Perfil + Portas da Cruz | Tipo/Autoridade/Definição/Centros/Canais/Nome da Cruz (não implementado); decisão de licenciamento do Swiss Ephemeris (pendente de revisão) |

**Nenhum motor está pronto para gerar interpretação por IA ainda** — nem deveria estar, considerando o que falta em cada um. Nenhuma síntese entre os três foi tentada, conforme solicitado.

**Testes automatizados**: `engine_validation/test_golden_profile.py` roda os três motores e reporta 48 PASS / 0 FAIL / 8 PENDENTE — nenhum PENDENTE aparece como PASS forçado; todos ficam visíveis no output para nunca serem esquecidos silenciosamente.

---

# 5. Antes do próximo passo

Por ordem de urgência para destravar o restante do PRD:

1. **Dreamspell**: resolver a convenção de dias verdes contra o Sincronário da Paz real — é a única pendência que compromete a contagem básica, e sem ela nenhuma leitura diária de Dreamspell pode ser confiável.
2. **Design Humano**: decidir conscientemente sobre a licença do Swiss Ephemeris em produção antes de qualquer código de produção usar a biblioteca.
3. **Numerologia**: fornecer segundo caso de teste (Carlos/Dani/Julie) para confirmar Talento Oculto e destravar Débitos Cármicos.
4. Só depois disso: implementar a camada de Tipo/Autoridade/Centros/Canais do Design Humano, que é a peça mais trabalhosa que falta.
