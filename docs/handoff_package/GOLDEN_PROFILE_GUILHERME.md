# GOLDEN_PROFILE_GUILHERME.md

**Status:** Golden Profile v0.1  
**Objetivo:** estabelecer entradas e resultados esperados para validar os três motores antes do PRD.

> Este documento não interpreta espiritualmente o perfil. Ele é um contrato de qualidade: mesma entrada deve reproduzir os resultados de referência antes de qualquer interpretação por IA.

## 1. Identidade de teste

- **Nome:** Guilherme Moreira dos Santos
- **Nascimento:** 25/08/1988
- **Hora local:** 00:40
- **Local:** Cachoeirinha, Rio Grande do Sul, Brasil
- **UTC de referência (Human Design):** 03:40

### Regra
1. preservar a entrada;
2. calcular deterministicamente;
3. comparar com a referência;
4. registrar divergências;
5. não corrigir resultados por interpretação;
6. marcar `VALIDATED` apenas quando o cálculo próprio reproduzir a referência.

# 2. Human Design

**Referência:** Maia Mechanics — Powered by Jovian Archive.

## Resultados esperados

| Campo | Esperado |
|---|---|
| Tipo | Gerador Manifestante |
| Estratégia | Responder |
| Autoridade | Plexo Solar |
| Perfil | 3/5 |
| Definição | Bipartida |
| Assinatura | Satisfação |
| Tema do Não-Ser | Frustração |
| Cruz | Ângulo Direito — Cruz da Fênix Adormecida |
| Portas da Cruz | 59/55 \\| 20/34 |
| Variável | PLL DRL |

## Ativações — Design

| Corpo | Gate.Line |
|---|---:|
| Sol | 20.5 |
| Terra | 34.5 |
| Lua | 47.4 |
| Nodo Norte | 22.4 |
| Nodo Sul | 47.4 |
| Mercúrio | 12.3 |
| Vênus | 15.3 |
| Marte | 55.2 |
| Júpiter | 2.5 |
| Saturno | 10.4 |
| Urano | 10.2 |
| Netuno | 38.1 |
| Plutão | 44.4 |

## Ativações — Personalidade

| Corpo | Gate.Line |
|---|---:|
| Sol | 59.3 |
| Terra | 55.3 |
| Lua | 60.4 |
| Nodo Norte | 63.3 |
| Nodo Sul | 64.3 |
| Mercúrio | 47.5 |
| Vênus | 53.2 |
| Marte | 21.3 |
| Júpiter | 20.5 |
| Saturno | 11.4 |
| Urano | 11.5 |
| Netuno | 58.4 |
| Plutão | 44.3 |

**Status:** `REFERENCE_LOCKED / ENGINE_NOT_VALIDATED`

A referência natal está fechada. O motor futuro deverá reproduzir UTC, ativações, centros/canais e propriedades derivadas.

# 3. Dreamspell / Sincronário das 13 Luas

## Metodologia
**Dreamspell / Encantamento do Sonho / Lei do Tempo — José Argüelles.**

**Referência operacional:** Sincronário da Paz.

Não tratar como equivalente ao Tzolk'in maia histórico.

## Golden test natal

**Entrada:** 25/08/1988

Resultado provisório usado durante a investigação:
- Kin 169;
- Lua Cósmica Vermelha;
- Tom 13 — Cósmico;
- Selo 9 — Lua Vermelha;
- Onda Encantada da Terra Vermelha.

**Importante:** estes valores ainda precisam ser congelados diretamente contra a calculadora de referência escolhida antes de serem considerados `VALIDATED`.

Também devem ser congelados:
- Guia;
- Análogo;
- Antípoda;
- Oculto;
- Família;
- Clã;
- Crono-Psi;
- data das 13 Luas;
- Plasma.

## Casos adicionais
Validar também:
1. uma data-âncora documentada;
2. Dia Fora do Tempo;
3. 29 de fevereiro;
4. virada do ano do Sincronário;
5. pelo menos cinco datas aleatórias.

**Status:** `METHODOLOGY_LOCKED / GOLDEN_VALUES_PARTIAL`

# 4. Numerologia

**Referência:** Mapa Numerológico Pessoal fornecido para Guilherme Moreira dos Santos — 25/08/1988.

Não assumir pelo nome “Numerologia Cabalística” qual tabela letra→número foi usada. A regra deverá ser reproduzida pelos resultados.

## Resultados natais esperados

| Campo | Esperado |
|---|---:|
| Dia Natalício | 25 |
| Número Psíquico | 7 |
| Motivação | 1 |
| Impressão | 2 |
| Expressão | 3 |
| Talento Oculto | 4 |
| Destino | 5 |
| Missão | 8 |
| Lições Cármicas | 8, 9 |
| Tendências Ocultas | 1, 3, 4, 5 |
| Resposta Subconsciente | 7 |
| Débitos Cármicos | 14, 19 |
| Ciclos de Vida | 8, 7, 8 |
| Desafios | 1, 1, 0 |
| Momentos Decisivos | 6, 6, 3, 7 |

## Regras temporais já documentadas

### Mês Pessoal
A referência define `Ano Pessoal + número do mês → redução`, preservando 11/22 conforme as regras do método.

Para agosto/2026:
- 01/08 a 24/08 → **Mês Pessoal 5**
- 25/08 ao fim do mês → **Mês Pessoal 6**

Isso confirma que o ciclo anual pessoal transiciona no aniversário.

### Dia Pessoal
A referência possui seção própria de Dia Pessoal. A fórmula completa e suas exceções deverão virar testes antes da implementação.

## Engenharia reversa
Testar:
- Pitagórica;
- Caldeia/NCT;
- eventual tabela explícita da referência;
- acentos e `ç`;
- partículas como `dos`;
- vogais/consoantes;
- 11/22;
- Débitos Cármicos;
- Ciclos;
- Desafios;
- Momentos Decisivos.

Só adotar uma regra quando ela reproduzir o conjunto do mapa, não apenas um número isolado.

**Status:** `REFERENCE_LOCKED / REVERSE_ENGINEERING_PENDING`

# 5. Matriz de prontidão

| Motor | Metodologia | Referência | Golden values | Motor reproduz? |
|---|---|---|---|---|
| Human Design | Fechada | Maia Mechanics / Jovian Archive | Forte | Ainda não |
| Dreamspell | Fechada | Sincronário da Paz | Parcial | Ainda não |
| Numerologia | Referência fechada; regras em investigação | Mapa fornecido | Forte | Ainda não |

# 6. Estados de qualidade

- **REFERENCE_LOCKED:** sabemos qual resultado queremos reproduzir.
- **ENGINE_MATCH:** nossa implementação produz o mesmo resultado.
- **VALIDATED:** além do Golden Profile, passou por casos adicionais e bordas metodológicas.

# 7. Próxima etapa

1. **Numerologia:** engenharia reversa até reproduzir o mapa.
2. **Dreamspell:** congelar resultados completos de 25/08/1988 e casos de borda contra a referência.
3. **Human Design:** usar o PDF Maia Mechanics como expected result e escolher a estratégia de efemérides/implementação capaz de reproduzi-lo.

# 8. Depois dos motores

Somente então fechar o conteúdo de **MÊS / SEMANA / HOJE** para cada sistema.

A interface pode ser comum. As metodologias permanecem independentes.

# 9. Critério para prototipar

O protótipo visual pode começar usando fixtures deste Golden Profile. Antes do experimento real:
- resultados natais precisam estar validados;
- cálculos temporais exibidos precisam estar validados;
- IA só recebe elementos já calculados;
- base interpretativa deve ser própria/curada;
- leituras precisam ser rastreáveis à origem.

# 10. Contrato técnico

> Primeiro sabemos o que calcular.  
> Depois provamos que calculamos corretamente.  
> Depois explicamos o significado.  
> Só então deixamos a IA transformar isso em linguagem humana.
