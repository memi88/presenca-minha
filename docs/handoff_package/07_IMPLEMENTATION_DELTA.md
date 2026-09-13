# Presente Alpha — Delta sobre o plano de implementação atual

## 1. Decisão proposta

Antes de concluir a experiência completa dos três sistemas, inserir uma trilha curta:

# Etapa 5A/Alpha — Presente Diário Dreamspell

O número exato da etapa deve ser ajustado pelo Claude conforme o estado real do repositório. Não renumerar documentos silenciosamente.

## 2. Objetivo

Colocar uma versão real do experimento diário nas mãos de Guilherme e depois dos outros três participantes, reaproveitando:
- engine Dreamspell existente;
- Supabase;
- FastAPI;
- UI Variação D;
- autenticação/URL privada quando disponível.

## 3. Ordem sugerida

### A1 — Auditoria
- confrontar engine atual com `ENGINE_VALIDATION`;
- verificar suporte real a Kin do ano, 13 Luas, Heptada, Plasma, Onda, Oráculo;
- não assumir que o que foi discutido conceitualmente já está implementado.

### A2 — Contrato `DailyMoment`
- implementar payload determinístico;
- golden tests;
- timezone de corte às 03:00 conforme decisão existente.

### A3 — Biblioteca Dreamspell mínima
Curar apenas conceitos necessários ao Alpha:
- 20 Selos;
- 13 Tons;
- Onda;
- relações de Oráculo;
- contexto anual/Lua somente se validado.

Clã/Plasma e outras camadas podem ser calculadas e exibidas em profundidade, mas não interpretadas até validação.

### A4 — Relationship + Relevance Engine
Primeira versão pode ser majoritariamente rule-based.

Obrigatório:
- `NONE`;
- same seal;
- relações de Oráculo;
- prioridade por escala;
- blacklist de conceitos não validados;
- princípio da menor interpretação suficiente.

### A5 — Reflection Engine + QA
- prompt versionado;
- payload mínimo;
- geração de reflexão/pergunta/prática opcional;
- validator separado;
- persistência imutável.

### A6 — Tela diária Alpha
- reflexão;
- pergunta;
- prática opcional;
- `Entender`;
- sem excesso de símbolos.

### A7 — Fechamento do dia
Adicionar:
- registro livre;
- marcadores rápidos;
- 8 perguntas de laboratório de `03_DAILY_EXPERIENCE.md`.

### A8 — Guilherme
Rodar ponta a ponta em celular por 1–2 dias.

Corrigir:
- bugs;
- linguagem;
- excesso/falta de informação;
- problemas de persistência.

### A9 — Carlos, Dani e Julie
Cadastrar e iniciar ciclo de 13 dias.

### A10 — Debrief
Exportar resultados do piloto sem expor reflexões íntimas desnecessariamente.

## 4. O que não bloquear

O Alpha não deve depender de:
- Cabala;
- Design Humano interpretativo;
- Numerologia interpretativa;
- relacionamento;
- biblioteca tradicional de Nawales;
- app mobile nativo.

## 5. Compatibilidade com arquitetura anterior

A arquitetura antiga `Pessoa → Ano → Mês → Semana → Hoje` deve ser preservada como patrimônio do projeto, mas o Alpha pode ter uma **entrada diária simplificada**.

Proposta:
- Home Alpha abre em `Hoje`;
- `Entender` dá acesso às escalas;
- telas completas existentes continuam disponíveis ou atrás de exploração;
- não apagar trabalho anterior para adaptar o experimento.

## 6. Mudanças documentais que provavelmente serão necessárias

Após aprovação técnica:
- `PRD_v0.1` → nova versão com Alpha diário;
- `EXPERIENCE_MODEL` → incorporar "perceber" e prática opcional;
- `IMPLEMENTATION_PLAN` → inserir trilha Alpha;
- `DESIGN_DIRECTION` → especificar Home diária + fechamento;
- `ENGINE_VALIDATION` → registrar o que foi validado para Ano/Lua/Heptada/Plasma;
- novo documento de metodologia interpretativa baseado em `02_INTERPRETATION_PIPELINE.md`.

## 7. Definition of Done do Alpha técnico

- Guilherme abre URL real no celular;
- recebe leitura diária congelada;
- leitura usa apenas dados validados;
- `Entender` explica origem;
- `personalization_status=none` funciona;
- registro noturno não altera leitura;
- feedback do laboratório persiste;
- nenhum texto faz previsão;
- Carlos, Dani e Julie podem ter dados isolados;
- logs não vazam reflexões;
- existe forma de exportar métricas do piloto.

## 8. Primeira tarefa do Claude

Não codificar.

Responder ao handoff com:
1. estado atual do repositório;
2. diferenças entre este delta e o plano atual;
3. proposta de arquivos que serão alterados;
4. migrations necessárias;
5. endpoints;
6. componentes UI;
7. testes;
8. riscos;
9. ordem de implementação;
10. perguntas que realmente bloqueiam o início.
