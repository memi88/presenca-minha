# Integração Presente → Presença

> **Decisões de produto já tomadas em resposta à auditoria: ver `integracao-presente-presenca-decisoes.md`.** Auditoria original (estado do código antes de qualquer implementação): `integracao-presente-presenca-auditoria.md`. Este documento foi atualizado (endpoints renomeados, de `hoje-dreamspell` pra `lente-do-dia`) pra refletir essas decisões — não é mais o texto original enviado pro Claude Code. **Nota de correção:** a auditoria apontou uma suposta menção a `tags_contexto` na "seção 0, item 1" deste documento — isso não existe aqui; é um trecho de `presenca-organizacoes.md` (extensão separada, não relacionada), que a auditoria confundiu com este doc. Ver `integracao-presente-presenca-decisoes.md`, item 1, pra o registro completo do engano.
>
> **Contexto que falta no repositório do Presença — leia antes de auditar.**
>
> Esta integração consome o motor do Presente (repositório separado, já validado, Alpha em produção). O contrato de dado relevante, hoje, é:
>
> ```
> DailyPresent {
>   reflection: string
>   question: string
>   tension / relation_mode: string
>   human_experience: string
>   qa_status: enum (APPROVED_FIRST_TRY, APPROVED_AFTER_REWRITE, FALLBACK_CURATED, FIXED_HUNAB_KU)
>   derivation_summary: jsonb   // usado pelo "Entender de onde vem"
>   prompt_version: string      // hoje: reflection-human-experience-1.1.1
> }
> ```
>
> `qa_status` e `prompt_version` são campos de auditoria interna do Presente — **nunca** devem vazar para a UI do Presença nem para o prompt do agente conversacional, só para logging/debug.
>
> **Transporte: endpoint HTTP no Presente (Railway), decidido.** Não migrar o motor para Cloudflare Worker nesta etapa — o ganho de custo é pequeno frente ao trabalho de portar e revalidar toda a suíte de golden tests num ambiente novo. Fica registrado como otimização futura, não pré-requisito.
>
> **Importante: a leitura do Presente já é personalizada por Selo natal, hoje, para os 4 participantes do Alpha** (o Relevance Engine compara o Selo do dia com o Selo natal de cada pessoa e produz `nivel_relacao` — `SAME_SEAL` ou `NONE` — que influencia o `relation_mode` da reflexão). Não existe, no motor real, uma "leitura genérica sem personalização" — isso é uma simplificação que estamos introduzindo deliberadamente só para esta integração, num primeiro momento, para os usuários do Presença que ainda não têm data de nascimento capturada.
>
> **Arquitetura de dois níveis, para refletir isso corretamente:**
>
> ```
> GET /api/lente-do-dia
>   → sem parâmetros, sem autenticação
>   → leitura genérica, nivel_relacao = NONE sempre
>   → cacheável por 1 dia inteiro, compartilhada entre todos os usuários do Presença
>   → usada quando a pessoa ainda não informou data de nascimento no Presença
>
> POST /api/presenca/lente-do-dia-personalizada
>   body: { data_nascimento: "AAAA-MM-DD" }
>   → calcula Selo natal, compara com Selo do dia, nivel_relacao real (SAME_SEAL/NONE)
>   → cacheável por 1 dia por pessoa (não compartilhável entre pessoas)
>   → só deve ser chamado se a pessoa já deu consentimento explícito para
>     esse uso específico do dado — mesmo que a data de nascimento já
>     exista no perfil do Presença por outro motivo (ex: calibrar Design
>     Humano), reusá-la aqui é uma finalidade nova e exige opt-in próprio.
> ```
>
> Os dois endpoints retornam o mesmo formato de payload (ver contrato abaixo), variando só o conteúdo. Nenhum dos dois deve expor `qa_status` ou `prompt_version` fora de logging interno.

---

> Presente oferece uma lente. Presença oferece espaço. A pessoa oferece a vida.

Quero estruturar uma nova etapa do Presença integrando o motor do Presente, que já está funcional e validado no Alpha.

A intenção não é transformar o Presença em um app de Dreamspell.

O Presente será uma camada de contexto/reflexão dentro do Presença.

## 1. Conceito central

Queremos trabalhar com três camadas distintas:

**Como a pessoa chega**
É a realidade relatada pelo próprio usuário.

**Uma lente para hoje**
É uma possibilidade de observação produzida pelo motor validado do Presente.

**A vida da pessoa**
É o que realmente acontece e deve sempre ter prioridade sobre qualquer leitura simbólica.

O ciclo desejado é:

```
Chegar → Perceber → Conversar → Praticar → Viver → Registrar → Reencontrar
```

## 2. Uma lente para hoje

O motor do Presente já produz:

- momento calculado;
- Relationship Detector;
- Relevance Engine;
- human_experience;
- narrative_arc;
- reflexão;
- pergunta;
- QA;
- fallback seguro;
- rastreabilidade.

Quero utilizar o resultado validado desse motor dentro do Presença.

Na Home, conceitualmente:

> **Uma lente para hoje**
>
> [reflexão produzida pelo Presente]
>
> **Uma pergunta**
>
> [pergunta produzida pelo Presente]

A experiência deve funcionar sem a pessoa precisar conhecer Dreamspell.

Dreamspell/Kin/Tom/origem ficam em:

> `Entender de onde vem essa lente →`

## 3. Hierarquia epistemológica

Essa regra precisa existir tanto no produto quanto nos prompts:

1. EXPERIÊNCIA RELATADA PELA PESSOA
2. ESTADO "COMO VOCÊ CHEGA"
3. CONTEÚDO DA CONVERSA
4. HISTÓRICO REAL REGISTRADO
5. LENTE DO PRESENTE
6. CONHECIMENTO SIMBÓLICO SUBJACENTE

Nunca inverter essa ordem.

Se a realidade relatada pelo usuário divergir da lente, prevalece a realidade relatada.

A lente é contexto opcional, não diagnóstico nem explicação causal.

## 4. Presence Daily Context

Não quero acoplar arquiteturalmente o Presença ao Dreamspell.

Pensar em um domínio intermediário: `PresenceDailyContext`.

Hoje:
```
PresenceDailyContext
├── arrival_state
└── daily_present
```

Futuramente pode conter:
```
PresenceDailyContext
├── arrival_state
├── daily_present
├── recent_relevant_context
└── authorized_care_context
```

O Presente é uma das fontes do contexto diário, não o contexto inteiro.

## 5. Ponte Presente → Conversa

Na Home quero uma ação próxima da lente:

> `Conversar sobre isso`

Ao entrar na conversa do Presença, o agente recebe algo conceitualmente como:

```json
{
  "arrival_state": "...",
  "present_lens": {
    "reflection": "...",
    "question": "...",
    "human_experience": "...",
    "authorized_relationships": []
  },
  "recent_user_context": [],
  "instructions": {
    "lens_is_optional": true
  }
}
```

O agente não começa falando de Dreamspell.

Não deve dizer:
> "Hoje o Mago Ressonante indica que..."

ou:
> "Você está sentindo isso por causa do seu Kin."

Começa pela experiência relatada pela pessoa.

Exemplo:
> "Você marcou que chegou sobrecarregado. O que está ocupando mais espaço agora?"

A lente pode ser usada posteriormente somente se fizer sentido organicamente.

## 6. Regra para uso da lente pela IA

A IA pode usar a lente para:
- oferecer uma pergunta;
- sugerir outro ângulo;
- aprofundar algo que a pessoa já trouxe;
- conectar uma reflexão à experiência explicitamente relatada.

Não pode:
- encaixar forçadamente o relato na lente;
- explicar acontecimentos pelo Dreamspell;
- usar Kin como diagnóstico;
- prever;
- tratar coincidências como sinais objetivos;
- ignorar o que a pessoa relata porque a lente aponta outra coisa.

Se a lente não ajudar: **não usar.** Essa é uma saída correta.

## 7. Presença como continuação, não interpretação

```
PRESENTE
"uma possibilidade para perceber"
        ↓
VIDA DA PESSOA
"o que realmente está acontecendo?"
        ↓
PRESENÇA
"vamos olhar para isso"
```

O Presente não explica a vida. Ele oferece uma lente. O Presença trabalha principalmente com aquilo que a pessoa efetivamente vive.

## 8. Práticas

A escolha de prática deve considerar, nesta ordem:

```
experiência/conversa
      ↓
estado informado
      ↓
necessidade identificada
      ↓
lente como contexto secundário
      ↓
biblioteca de práticas
```

Não fazer: `Kin X → prática Y`. A prática deve responder à experiência atual.

Preservar origem:
```
TRADITIONAL_MAYA
LAW_OF_TIME
HUMAN_DESIGN
KABBALAH
PRESENTE
PRESENCA
```

Prática criada/adaptada pela IA nunca pode ser apresentada como tradicional sem fonte.

## 9. Fechamento do dia

Quero incorporar uma versão leve do fechamento validado no Alpha.

Pergunta principal possível: "Como foi seu dia?" ou "O que você percebeu hoje?"

Não perguntar: "A leitura acertou?"

Possíveis respostas rápidas: algo encontrou eco; percebi algo de outra maneira; nada em especial.

Campo livre opcional.

O fechamento alimenta memória do Presença.

## 10. Memória longitudinal

Aqui é fundamental distinguir duas coisas.

**Memória do Presença:** é o mecanismo longitudinal já existente pelo qual experiências e registros reais da pessoa podem ser relacionados ao longo do tempo.

Exemplo: "Esse assunto apareceu algumas vezes nos últimos dias. Quer olhar para ele?" — sempre sem diagnóstico.

**Memória do motor Presente:** continua desligada. A integração não altera a decisão atual do Presente: `memory_used = false`. O motor que gera a lente diária não deve usar histórico longitudinal para fabricar ou personalizar a leitura.

A memória descrita nesta integração pertence inteiramente ao lado Presença, depois que a lente já foi produzida. Essa separação deve existir também no código e na documentação.

## 11. Ciclo completo

```
COMO VOCÊ CHEGA?
        ↓
UMA LENTE PARA HOJE
        ↓
UMA PERGUNTA
        ↓
VIDA
        ↓
CONVERSAR
        ↓
PRESENÇA
        ↓
PRÁTICA, SE FIZER SENTIDO
        ↓
VIVER
        ↓
COMO FOI SEU DIA?
        ↓
REGISTRO
        ↓
MEMÓRIA DO PRESENÇA
        ↓
AMANHÃ
```

## 12. Home — hipótese inicial

Não implementar esta UI literalmente sem auditar o design atual. Conceitualmente:

```
Bom dia, Guilherme

[check-in atual / futura frente de migração]

────────────────

Uma lente para hoje

[reflexão]

Uma pergunta
[pergunta]

[ Conversar sobre isso ]

Entender de onde vem →

────────────────

Conversar
Práticas
Livro Vivo
...
```

Quero evitar uma Home longa ou carregada.

## 13. Fonte única

O motor Presente continua independente. O Presença consome seu resultado.

```
Present Engine
       ↓
DailyPresent
       ↓
PresenceDailyContext
       ↓
Agent Presença
```

Não criar outro Interpretation Engine dentro do Presença.

## 14. Futuro: Design Humano e Cabala

Não implementar agora. A arquitetura deve permitir futuramente:

```
Dreamspell
Human Design
Cabala
        ↓
Relevance
        ↓
lentes autorizadas
        ↓
Presente
        ↓
PresenceDailyContext
```

O agente do Presença não deve receber três mapas completos e tentar sintetizá-los livremente.

## 15. Métricas

Quero saber:
- lente foi exibida?
- abriu Entender?
- iniciou conversa a partir da lente?
- lente foi realmente utilizada pelo agente?
- prática foi sugerida?
- prática foi aceita/ignorada?
- houve fechamento do dia?
- tema retornou espontaneamente posteriormente?

Sem streak ou obrigação.

## Frente paralela independente — Migração do check-in

A mudança "Como está seu humor?" → "Como você chega hoje?" **não faz parte do plano incremental P1–P7 abaixo.**

Hoje o check-in já alimenta o mecanismo de recomendação do Presença e altera inclusive a estrutura da experiência seguinte. Portanto deve ser tratado como uma migração de mecanismo de produção já validado, com risco próprio.

Na auditoria, quero análise específica de:
- schema atual;
- enums;
- dados históricos;
- analytics;
- regras/recomendações dependentes;
- impacto nas telas subsequentes;
- retrocompatibilidade;
- necessidade de migration;
- possibilidade de manter o campo interno atual e alterar apenas a experiência primeiro;
- plano próprio e independente de migração.

Não alterar esse mecanismo como efeito colateral da integração do Presente.

## 16. O que quero do Claude Code agora

**Não implemente ainda.**

Primeiro audite o repositório real do Presença e devolva:

### A. Estado atual
Onde estão hoje: Home; check-in/humor; mecanismo de recomendação; chat; prompt/contexto do agente; práticas; Livro Vivo; memória/Caderno; registros; banco; APIs; analytics; infraestrutura de IA.

### B. Impacto
O que a integração exige alterar e o que pode ser reaproveitado.

### C. Arquitetura proposta
Especialmente: `DailyPresent`; `PresenceDailyContext`; contexto enviado ao chat; fronteiras Presente/Presença; práticas; fechamento; memória. **Considerar os dois endpoints (genérico vs. personalizado) descritos no preâmbulo — como o Presença decide qual chamar, onde fica o estado de "esta pessoa já consentiu o uso da data de nascimento para a lente do Presente", e como isso se relaciona com o consentimento já existente para calibrar Design Humano (são finalidades diferentes, mesmo dado).**

### D. Fluxo de dados
Quero algo próximo de:
```
Present Engine
→ DailyPresent
→ Home
→ PresenceDailyContext
→ Chat
→ Practice
→ Daily Reflection
→ Presence Memory
```

### E. UX
Proposta de onde entram: lente; pergunta; conversar sobre isso; Entender; fechamento. E avaliar como a frente paralela de check-in se relacionaria futuramente, sem implementá-la agora.

### F. Plano incremental
Algo próximo de:
```
P1 — disponibilizar DailyPresent no domínio Presença
P2 — exibir lente/pergunta na Home
P3 — criar PresenceDailyContext
P4 — contexto opcional para o chat
P5 — integração com práticas
P6 — fechamento do dia
P7 — memória longitudinal Presença
P8 — personalização por Selo natal (endpoint personalizado + consentimento de reuso de data de nascimento)
```
Revise a ordem com base no código real. **A migração "Como você chega hoje?" é uma frente independente e não deve ser incluída nesses P1–P7.**

**P1–P7 usam só o endpoint genérico** (`GET /api/lente-do-dia`, `nivel_relacao = NONE` sempre). **P8 introduz o endpoint personalizado e o fluxo de consentimento** — é intencionalmente a última etapa, depois que o resto da integração já estiver validado com a versão mais simples.

### G. Riscos
Avaliar explicitamente: lente dominando a conversa; contexto excessivo no prompt; duplicação de lógica Presente/Presença; privacidade; memória; viés de confirmação; dependência; custo; latência; segurança linguística.

#### G1. Recalcular custo
A arquitetura atual de IA possui uma estimativa existente de custo mensal. Recalcule essa estimativa incluindo o novo `PresenceDailyContext` no payload da conversa principal.

Importante:
- esse contexto entra no modelo conversacional principal, não apenas em microcopy;
- considerar modelo, tokens médios adicionais por turno/conversa, cache se existir, quantidade de usuários/conversas e impacto mensal;
- mostrar cenário atual vs. com integração;
- **calcular os dois cenários de custo do lado do Presente também:** o endpoint genérico (P1–P7) gera uma leitura por dia, custo fixo e baixo, independente do número de usuários do Presença; o endpoint personalizado (P8) gera potencialmente uma leitura por pessoa por dia — esse custo cresce com a base de usuários que já tiver consentido o uso da data de nascimento, e deve ser projetado separadamente;
- custo não é bloqueador automático, mas quero o número atualizado antes da decisão.

#### G2. Guardrail do agente conversacional
Registrar explicitamente que a proteção do agente do Presença é estruturalmente diferente da do motor Presente.

No Presente, o conteúdo diário passa por: guardrails determinísticos → auditor isolado → rewrite → fallback, antes de ser publicado.

Na conversa do Presença, a proposta atual depende principalmente de instruções no prompt em cada turno. Não quero adicionar automaticamente uma segunda chamada de auditoria por turno, porque isso impacta custo e latência.

Portanto proponha uma estratégia de avaliação por amostragem, não auditoria online obrigatória.

Quero um plano de testes com conversas simuladas que cubra pelo menos:
- usuário relata algo incompatível com a lente;
- usuário pergunta se o Kin causou um acontecimento;
- usuário trata coincidência como sinal;
- usuário pede previsão;
- agente tenta encaixar relato na lente;
- lente não é útil e deveria ser ignorada;
- prática é sugerida por causa da experiência, não diretamente pelo Kin;
- histórico real conflita com lente simbólica;
- conversa em que a lente nunca precisa ser usada.

Essas conversas devem ser revisadas manualmente e/ou por benchmark offline, semelhante ao que fizemos com a bateria do Interpretation Engine.

Quero proposta de: tamanho inicial da bateria; cenários; critérios de aprovação; frequência de rerun; como armazenar regressões; quais casos exigiriam guardrail determinístico adicional.

## 17. Resultado esperado da auditoria

Antes de qualquer código, devolver:
- mapa da implementação atual;
- delta necessário;
- arquitetura proposta;
- fluxo de dados;
- UX sugerida;
- plano P1–P7 revisado;
- plano separado da migração de check-in;
- nova estimativa de custo;
- proposta de avaliação do agente conversacional;
- riscos/bloqueadores;
- decisões de produto que precisam ser tomadas antes da implementação.
