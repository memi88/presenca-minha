# DREAMSPELL_CALENDAR_CONVENTION.md

**Status:** `VALIDATED` (Gate 0 — 19/08/2026)
**Fonte de verdade:** Sincronário Perpétuo 13 Luas (Instituto Noosfera / Planeta Escola, referência "Foundation for the Law of Time") + decisão explícita do time registrada em 19/08/2026.
**Objetivo:** ser a referência única para qualquer implementação do calendário Dreamspell/13 Luas no Presente. Nenhum código deve implementar essa convenção de memória — deve importar/seguir este documento.

---

## 1. Por que este documento existe

O `ENGINE_VALIDATION.md` (fase de validação de motores) identificou uma ambiguidade real: existem 4 convenções matematicamente distintas para tratar os "dias verdes" do Dreamspell (Dia Fora do Tempo e 29 de fevereiro), e duas delas reproduziam o Kin=169 provisório do Golden Profile por coincidência aritmética — o que mascarava o problema.

Este documento fecha essa ambiguidade com uma decisão explícita, validada contra o Sincronário Perpétuo 13 Luas.

## 2. O ano de 13 Luas

- Começa em **26/07** e termina em **24/07** do ano seguinte.
- 13 luas de 28 dias = 364 dias regulares.
- Cada lua tem 28 dias, numerados 1–28.
- Ordem das 13 luas: Magnética, Lunar, Elétrica, Autoexistente, Harmônica, Rítmica, Ressonante, Galáctica, Solar, Planetária, Espectral, Cristal, **Cósmica** (a última).

## 3. Os dois dias fora da sequência regular — tratados como tipos distintos

### 3.1 Dia Fora do Tempo (25/07) — `DAY_OUT_OF_TIME`
- Ocorre todo ano, sempre em 25/07 (entre o fim da Lua Cósmica em 24/07 e o início da próxima Lua Magnética em 26/07).
- **Fora** das 13 Luas: `moon = null`, `moon_day = null`.
- **O Kin continua avançando normalmente** neste dia — ou seja, o DOOT TEM um Kin regular, calculado normalmente a partir do dia anterior.

### 3.2 Hunab Ku 0.0 (29/02) — `HUNAB_KU_0_0`
- Ocorre apenas em anos bissextos.
- **Fora** das 13 Luas: `moon = null`, `moon_day = null`.
- **Fora** da sequência regular de Kin: não existe Kin regular neste dia (`kin = null`).
- A progressão do Kin **pausa** neste dia — ou seja, o contador de Kin não avança em 29/02. O dia 01/03 recebe o Kin imediatamente seguinte ao Kin de 28/02 (como se 29/02 não tivesse existido, para fins de contagem de Kin).

**Importante:** os dois dias NÃO devem ser tratados genericamente como "green day" com o mesmo comportamento. São dois tipos com efeitos diferentes sobre o contador de Kin.

## 4. Nascimento em 29/02

Regra para resolver a assinatura Dreamspell de alguém nascido em 29/02:
- **Antes de 12:00 (hora local de nascimento)** → usar a assinatura (Kin/Selo/Tom) de **28/02**.
- **Depois de 12:00 (hora local de nascimento)** → usar a assinatura de **01/03**.

Esta regra é responsabilidade da camada que resolve o perfil natal (recebe data + hora), não do motor de cálculo de calendário puro (que opera só sobre datas). O motor de calendário deve continuar retornando `HUNAB_KU_0_0`/`kin=null` para a data 29/02 em si; a resolução por horário acontece uma camada acima, no momento de calcular o perfil natal de uma pessoa nascida nessa data.

## 5. Algoritmo de referência

### 5.1 Kin
```
EPOCH = 26/07/1987, Kin 34 (Mago Galáctico Branco — Harmonic Convergence)

Para calcular o Kin de uma data D:
  se D == 29/02 (qualquer ano) -> Kin = null (HUNAB_KU_0_0)
  senão:
    percorrer dia a dia de EPOCH até D
    para cada dia:
      se o dia é 29/02 -> não incrementa o contador (pula sem avançar)
      senão -> incrementa o contador em 1 (com wraparound 1..260)
    (25/07 incrementa normalmente, como qualquer dia regular)
```

### 5.2 Lua e Dia-da-Lua
```
Para calcular moon/moon_day de uma data D:
  se D == 25/07 ou D == 29/02 -> moon = null, moon_day = null
  senão:
    year_start = 26/07 do ano-de-13-luas ao qual D pertence
                 (26/07 do próprio ano se D >= 26/07, senão 26/07 do ano anterior)
    offset = número de dias entre year_start e D, NÃO contando nenhum 29/02 no caminho
    moon = (offset // 28) + 1
    moon_day = (offset % 28) + 1
```

## 6. Casos validados (Gate 0 — 32/32 PASS)

| Caso | Resultado |
|---|---|
| Época 26/07/1987 | Kin 34, Mago Branco, Galáctico |
| Golden Profile — 25/08/1988 | **Kin 169** (confirma o valor provisório do `GOLDEN_PROFILE_GUILHERME.md`) |
| 27/02/2016 | Kin 70 |
| 28/02/2016 | Kin 71 |
| 29/02/2016 | `HUNAB_KU_0_0`, kin=null |
| 01/03/2016 | Kin 72 |
| 02/03/2016 | Kin 73 |
| 24/07/2016 | Lua Cósmica, dia 28 |
| 25/07/2016 | `DAY_OUT_OF_TIME`, Kin 218 (avança normalmente) |
| 26/07/2016 | Lua Magnética, dia 1, Kin 219 |
| 27/02/2024 | Kin 130 |
| 28/02/2024 | Kin 131 |
| 29/02/2024 | `HUNAB_KU_0_0`, kin=null |
| 01/03/2024 | Kin 132 |
| 02/03/2024 | Kin 133 |
| 24/07/2024 | Lua Cósmica, dia 28 |
| 25/07/2024 | `DAY_OUT_OF_TIME`, Kin 18 |
| 26/07/2024 | Lua Magnética, dia 1, Kin 19 |

Suíte completa: `test_gate0_golden.py`, 32 asserções, 0 falhas.

## 7. O que este documento NÃO resolve (fora do escopo do Gate 0)

- Kin do ano / posição na 13ª Lua como elemento interpretativo — depende desta convenção mas é uma camada separada, ainda não implementada.
- Relações de Oráculo — ainda pendentes de validação própria (`GOLDEN_PROFILE_GUILHERME.md`).
- Heptada/Plasma — calculáveis, mas não interpretados até validação própria.
- Auditoria contra o código real do repositório — este documento e a suíte de testes são a **referência-alvo**; a auditoria de fato do engine em produção só pode acontecer com acesso ao repositório.

## 8. Status final

**Gate 0 = VALIDATED**, no sentido de: a convenção está formalizada, implementada em uma referência testável, e reproduz corretamente todos os casos exigidos (incluindo o bloco completo de 2016 e o bloco equivalente de 2024).

**Ressalva que permanece aberta:** esta validação foi feita contra uma implementação de referência construída para este Gate, não contra o código do motor Dreamspell já existente no repositório (`dreamspell_engine.py` mencionado em conversas anteriores), porque esse código não está acessível nesta sessão. Antes de considerar o Gate 0 encerrado *em produção*, é preciso: (a) obter acesso ao repositório, (b) substituir/ajustar o engine real para seguir exatamente este documento, (c) rodar esta mesma suíte de golden tests contra o código real, não contra a referência.
