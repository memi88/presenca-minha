# Presente Alpha V1 — Handoff para análise técnica

**Status:** pronto para revisão técnica; **não implementar ainda**.  
**Objetivo desta rodada:** confrontar este pacote com o repositório atual, identificar conflitos com os documentos existentes e devolver um plano de implementação incremental.

## 1. Contexto

O projeto Presente já possui motores determinísticos de Numerologia, Dreamspell e Design Humano, além de documentos de produto, experiência, validação de motores, direção visual e plano de implementação.

Depois de um ciclo de estudo e de um primeiro teste manual da experiência diária, surgiu uma hipótese de produto mais específica:

> O Presente não precisa explicar o dia nem prever acontecimentos. Ele oferece uma lente curta para aumentar a qualidade da percepção da pessoa durante o dia.

O Alpha deve testar essa hipótese com quatro participantes: Guilherme, Carlos, Dani e Julie.

## 2. Escopo desta rodada

A V1/Alpha descrita neste pacote deve começar **somente com Dreamspell/Tzolkin na camada diária interpretativa**.

Os motores existentes de Numerologia e Design Humano **não devem ser removidos**. Eles continuam preservados no projeto e nos documentos existentes, mas não precisam entrar na primeira experiência diária do Alpha.

Não adicionar ainda:
- síntese entre Dreamspell + Design Humano + Cabala;
- Cabala;
- leitura de relacionamento;
- biblioteca completa de práticas tradicionais;
- app nativo;
- notificações;
- gamificação;
- navegação livre por passado/futuro;
- previsões;
- score de compatibilidade ou "acerto".

## 3. Arquivos deste pacote

1. `01_ALPHA_PRODUCT_SPEC.md` — comportamento do Alpha.
2. `02_INTERPRETATION_PIPELINE.md` — cálculo → relevância → reflexão → QA.
3. `03_DAILY_EXPERIENCE.md` — experiência da manhã, "Entender" e fechamento do dia.
4. `04_PILOT_PROTOCOL.md` — protocolo de 4 participantes e perguntas de validação.
5. `05_KNOWLEDGE_AND_PRACTICES.md` — biblioteca de conhecimento/práticas e proveniência.
6. `06_DATA_MODEL_AND_API.md` — modelo de dados e contratos sugeridos.
7. `07_IMPLEMENTATION_DELTA.md` — delta proposto sobre o plano atual.

## 4. Documentos existentes que devem ser tratados como fonte de verdade

Confrontar este pacote com:
- `FOUNDATION.md`
- `EXPERIMENT_SPEC.md`
- `EXPERIENCE_MODEL.md`
- `PRD_v0.1.md`
- `IMPLEMENTATION_PLAN.md`
- `DESIGN_DIRECTION.md`
- `ENGINE_VALIDATION.md`
- `GOLDEN_PROFILE_GUILHERME.md`

Quando houver conflito, **não resolver silenciosamente**. Liste:
1. documento/seção;
2. regra atual;
3. regra nova;
4. impacto;
5. recomendação;
6. decisão que precisa ser tomada.

## 5. Pontos que mudaram desde os documentos anteriores

### 5.1 O Alpha é um teste de experiência, não uma exposição de todos os motores

A primeira versão testável deve priorizar:

`momento diário → reflexão → pergunta → prática opcional → viver → perceber → registrar`

A profundidade técnica fica atrás de `Entender`.

### 5.2 A reflexão não é uma avaliação de "acerto"

O fechamento do dia deve medir:
- se a reflexão ficou presente espontaneamente;
- se mudou a forma de perceber algo;
- se induziu busca por confirmações;
- se pareceu genérica/forçada;
- se a prática ajudou ou virou obrigação.

### 5.3 A memória entra depois da experiência, nunca para reescrever o dia

O registro do usuário:
- não altera uma leitura já gerada;
- não deve ser usado para fabricar correspondências;
- pode ser usado futuramente como contexto longitudinal, somente quando houver relevância explícita e com regras contra confirmação forçada.

### 5.4 Personalização pode ser NONE

O sistema deve ser capaz de concluir que não há relação natal suficientemente relevante naquele dia. Nesse caso, não força um bloco "Para você".

### 5.5 Prática é opcional

A hipótese atual é que a lente/reflexão pode ser valiosa mesmo sem uma tarefa. A prática deve ser curta, opcional e nunca apresentada como obrigação.

## 6. Pedido ao Claude — primeira resposta

Antes de alterar código, devolver:

### A. Diagnóstico
- o que já existe e pode ser reaproveitado;
- o que falta;
- conflitos documentais;
- riscos técnicos/metodológicos;
- dados ainda necessários dos 4 participantes.

### B. Proposta de arquitetura
- módulos/classes;
- persistência;
- contratos entre cálculo, relevância, interpretação e registro;
- estratégia de IA;
- rastreabilidade;
- segurança de dados.

### C. Plano incremental
Preferir passos pequenos, testáveis e reversíveis. Sugerir a menor mudança que coloque **Guilherme usando o Alpha real** e, em seguida, habilite Carlos, Dani e Julie.

### D. Testes
Separar:
- unitários determinísticos;
- golden tests;
- testes do relevance engine;
- testes de segurança linguística;
- testes de API;
- roteiro manual mobile;
- métricas do piloto.

**Não implementar até esta revisão ser aprovada.**
