# ENGINE_VALIDATION.md — Adendo: Gate 0 (Dreamspell) fechado

**Este conteúdo deve ser inserido na seção 2 ("Dreamspell / Sincronário das 13 Luas") do `ENGINE_VALIDATION.md` existente, substituindo o status `METHODOLOGY_LOCKED / GOLDEN_VALUE_AMBIGUOUS`.**

---

## 2.x Gate 0 — Convenção de dias verdes RESOLVIDA (19/08/2026)

A ambiguidade descrita originalmente nesta seção (4 convenções candidatas para tratamento de Dia Fora do Tempo e 29 de fevereiro) foi resolvida por decisão explícita do time, validada contra o Sincronário Perpétuo 13 Luas (Instituto Noosfera/Planeta Escola, referência Foundation for the Law of Time).

**Convenção adotada, documentada integralmente em `DREAMSPELL_CALENDAR_CONVENTION.md`:**
- Dia Fora do Tempo (25/07): fora do calendário de luas, mas o Kin avança normalmente.
- Hunab Ku 0.0 (29/02): fora do calendário de luas E fora da sequência de Kin — o contador de Kin pausa nesse dia.

Isso corresponde à convenção que a tabela original da seção 2 chamava de "pula só o 29 de fevereiro" — uma das duas que já reproduziam Kin=169 para 25/08/1988 por coincidência aritmética. A diferença é que agora isso é uma decisão documentada e testada, não mais uma coincidência não resolvida.

**Validação:** suíte de 32 golden tests (`test_gate0_golden.py`), incluindo os 5 casos obrigatórios de 2016 (27/02, 28/02, 29/02, 01/03, 02/03), a virada do ano de 13 luas de 2016 (24→25→26/07), e o conjunto equivalente completo para 2024 (ano bissexto recente). **32/32 PASS.**

**Casos de borda antes marcados como "não testado" na tabela original desta seção — status atualizado:**

| Caso | Status anterior | Status atual |
|---|---|---|
| Dia Fora do Tempo isolado | ❌ Não testado | ✅ Testado (2016 e 2024) |
| 29 de fevereiro isolado | ❌ Não testado | ✅ Testado (2016 e 2024) |
| Virada de ano do Sincronário | ❌ Não testado | ✅ Testado (2016 e 2024) |
| 5 datas aleatórias adicionais | ❌ Não testado | ⚠️ Ainda pendente — os 32 testes cobrem os casos estruturais obrigatórios, não datas aleatórias adicionais |

**Ressalva registrada (não resolvida silenciosamente):** esta validação foi feita contra uma implementação de referência construída especificamente para fechar este Gate, já que o código do motor Dreamspell em produção não estava acessível no momento da validação. O Gate 0 está `VALIDATED` como especificação e como referência testável — mas o motor real do repositório ainda precisa ser auditado/ajustado contra esta mesma convenção e re-testado com esta mesma suíte antes de ser considerado `VALIDATED` em produção.

## Novo status da seção 2

**Antes:** `METHODOLOGY_LOCKED / GOLDEN_VALUE_AMBIGUOUS`

**Agora:** `METHODOLOGY_LOCKED / CONVENTION_VALIDATED / PENDING_PRODUCTION_ENGINE_AUDIT`

A mecânica de derivação (Selo/Tom/cor/Onda) permanece `ENGINE_MATCH`, como já estava. O que muda é que a contagem de Kin, antes `PENDING_DECISION`, agora tem convenção fechada e testada — falta apenas aplicar essa convenção ao código real.
