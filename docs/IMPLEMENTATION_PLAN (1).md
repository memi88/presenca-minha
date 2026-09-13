# IMPLEMENTATION_PLAN.md — Primeira Experiência Funcional

**Status:** Proposta de implementação — pré-primeiro commit. **Sem decisões pendentes.**
**Versão:** 0.4 (consolida três rodadas de decisões sobre a v0.1 original)
**Herda de:** `PRD_v0.1.md`, `ENGINE_VALIDATION.md` v0.3, `EXTERNAL_ENGINE_EVALUATION_humandesign_api.md`, `DESIGN_DIRECTION.md`
**Objetivo desta fase:** provar que a hierarquia Pessoa→Ano→Mês→Semana→Hoje funciona de ponta a ponta para um usuário real (Guilherme), com os três motores entregando dados corretos exatamente nos horizontes onde já têm metodologia validada — numa interface visualmente cuidada, mobile-first, acessível por URL privada e protegida por senha, com suporte aos 4 participantes do laboratório.

Este documento não implementa nada. É o roteiro para o primeiro commit.

---

# 0. Histórico de decisões desta fase

| Item | Estado original (v0.1) | Decisão | Onde fica registrado |
|---|---|---|---|
| Horário de "Hoje" | em aberto | **Fotografia fixa às 03:00 no horário local do participante** | §5 |
| Limites de "Semana" | em aberto | **Semana civil, segunda a domingo, timezone local do participante** | §5 |
| Participantes | só Guilherme | **1 para desenvolvimento; v1 completa suporta os 4**, via cadastro na própria UI | §7, §8 (Etapa 9) |
| Ambiente | localhost aceito | **URL privada, mobile-responsiva. Railway (plano já existente) + Supabase + Cloudflare como DNS/proxy** | §1 |
| Composições agregadas | sem marcação | **`composition_status` (`nativo`/`experimental`) obrigatório** | §2, §4 |
| Design Humano "Mês" | união bruta de 30 dias | **Revisado para fotografia mensal única** | §4.1 |
| Apresentação visual | HTML técnico/bruto | **Segue `DESIGN_DIRECTION.md`** | §1, §7 |
| Proteção de acesso | em aberto | **Senha padrão simples, nível de aplicação** | §1.2 |
| Fuso horário: nascimento vs. residência | em aberto | **Resolvido pelo cadastro — campo próprio de "fuso horário atual"** | §2, §7 |
| Cadastro dos 4 participantes | inserção manual no banco | **Formulário na própria UI, que já dispara os cálculos e personaliza o sistema no mesmo fluxo** | §7, §8 (Etapa 10) |

---

# 1. Arquitetura técnica mínima (atualizada com Cloudflare + Supabase)

```text
┌───────────────────────────────────────────────────────────────┐
│  Cloudflare (borda)                                              │
│  - DNS + proxy HTTPS (CNAME) na frente do domínio do Railway     │
│  - (opcional, upgrade futuro) Cloudflare Access no lugar da      │
│    senha de aplicação — ver §1.1                                 │
└───────────────────────┬───────────────────────────────────────┘
                         │
┌───────────────────────▼───────────────────────────────────────┐
│  Railway — plano já existente da equipe                          │
│  Aplicação Python (FastAPI + Jinja2 + CSS próprio)                │
│  Container Linux padrão — pyswisseph instala sem adaptação        │
│  Middleware de senha compartilhada na frente de todas as rotas    │
│  Segue DESIGN_DIRECTION.md — mobile-first                         │
└───────────────────────┬───────────────────────────────────────┘
                         │ lê/grava
┌───────────────────────▼───────────────────────────────────────┐
│  Supabase (Postgres gerenciado)                                  │
│  Substitui o SQLite da v0.1 — mesmo schema, sem mudança de       │
│  modelagem (ver §2)                                               │
└───────┬───────────────┬───────────────┬────────────────────────┘
        │                │               │
┌───────▼──────┐ ┌───────▼──────┐ ┌──────▼───────┐
│ Numerology   │ │ Dreamspell   │ │ HumanDesign  │   <- Adapters
│ Adapter      │ │ Adapter      │ │ Adapter      │
└───────┬──────┘ └───────┬──────┘ └──────┬───────┘
        │                │               │
┌───────▼──────┐ ┌───────▼──────┐ ┌──────▼───────────────────┐
│numerology_   │ │dreamspell_   │ │human_design_engine.py +   │
│engine.py     │ │engine.py     │ │hd_bodygraph.py+hd_transit │
│(já validado) │ │(já validado) │ │.py (já validados)         │
└──────────────┘ └──────────────┘ └────────────────────────────┘
```

## 1.1 Ambiente de hospedagem — Railway + Cloudflare + Supabase (atualizado: Railway no lugar de Fly.io)

**Railway resolve a parte que faltava.** Diferente dos Cloudflare Workers (que rodam em sandbox WebAssembly via Pyodide — o motivo pelo qual `pyswisseph` não funcionaria lá, seção anterior desta nota), o Railway builda a aplicação em containers Linux padrão (Railpack ou Docker). Isso significa que `pip install -r requirements.txt` instala `pyswisseph` normalmente, do mesmo jeito que já instala neste ambiente de desenvolvimento — **sem nenhuma adaptação de código**. Railway também já entrega domínio HTTPS próprio e suporta domínio customizado diretamente, então a arquitetura fica mais simples do que a proposta original com Fly.io + Cloudflare Tunnel:

```text
Cloudflare (DNS + proxy, CNAME apontando para o domínio do Railway)
        │
        ▼
Railway (app FastAPI, container Linux padrão — plano já existente da equipe)
        │
        ▼
Supabase (Postgres gerenciado)
```

Cloudflare entra só como DNS + proxy (o modo "nuvem laranja" padrão) na frente do domínio do Railway — não é mais necessário rodar um cliente de Tunnel dentro do container, porque o Railway já abstrai e protege a origem por conta própria. Isso ainda entrega URL privada com HTTPS e abre a porta para Cloudflare Access no futuro, se um dia quiserem trocar a senha compartilhada por autenticação por e-mail — sem exigir isso agora.

**Decisão fechada**: usar o plano Railway já existente da equipe no lugar de Fly.io. Nenhuma decisão de hospedagem continua pendente (fecha o item 12.1 da rodada anterior).

## 1.2 Proteção por senha

Duas opções, ambas simples:
- **Senha de aplicação** (adotada como padrão nesta versão): um middleware simples no FastAPI — uma senha compartilhada (não por participante), guardada como variável de ambiente, com cookie de sessão após o login. Poucas linhas de código, sem depender de configuração externa. Isso é literalmente "proteção com senha", como pedido.
- **Cloudflare Access** (upgrade futuro, não necessário agora): permitiria trocar a senha compartilhada por autenticação por e-mail (só os e-mails dos 4 participantes entram, via código de uso único) — mais forte, mas depende de configurar uma conta/política no Cloudflare. Fica registrado como caminho de evolução, não como parte desta versão.

---

# 2. Modelo de dados (Supabase/Postgres — mesmo schema da v0.2, com o campo novo de fuso horário atual)

```sql
participantes
  id, nome, nome_completo_nascimento, data_nascimento, hora_nascimento,
  local_nascimento_texto, latitude, longitude, timezone_nascimento,
  timezone_atual,                 -- NOVO: fuso horário de residência atual,
                                   -- preenchido no cadastro (ver §7). Usado
                                   -- para TODOS os cálculos de "Hoje"/"Semana"
                                   -- em vez de timezone_nascimento — resolve
                                   -- a pendência da rodada anterior (§9 antigo 12.4).
  confiabilidade_hora

perfil_natal_numerologia
  (sem alteração)

perfil_natal_dreamspell
  (sem alteração)

perfil_natal_design_humano
  (sem alteração — nome_cruz/angulo_cruz/variaveis_codigo continuam manuais,
  preservados só para participantes com Golden Profile fechado)

elementos_calculados_horizonte
  id, participante_id, sistema, horizonte, data_referencia,
  chave_periodo, elementos_json, composition_status, calculado_em

base_conhecimento
  (sem alteração)

registro_divergencia
  (sem alteração)
```

**Nota sobre `timezone_atual` vs. `timezone_nascimento`**: os dois campos continuam existindo separadamente — `timezone_nascimento` permanece necessário para o cálculo do mapa natal (Design Humano, em particular, depende do fuso no momento exato do nascimento, que não muda nunca). `timezone_atual` é o que passa a governar "Hoje" e "Semana" dali em diante. Isso é uma segunda razão para o campo existir, além de resolver a ambiguidade da rodada anterior.

---

# 3. Adapters dos três engines (sem alteração — ver `IMPLEMENTATION_PLAN.md` v0.1/v0.2 para o contrato completo)

---

# 4. Geração dos horizontes (sem alteração do conteúdo da v0.2)

## 4.1 Design Humano "Mês" — fotografia mensal, não união bruta de 30 dias
(Mantido da v0.2 — ver tabela abaixo.)

## 4.2 Tabela de geração por horizonte

| Sistema | Horizonte | O que calcula | `composition_status` |
|---|---|---|---|
| Numerologia | Ano | Ano Pessoal vigente | `nativo` |
| Numerologia | Mês | Mês Pessoal vigente | `nativo` |
| Numerologia | Semana | 7 Dias Pessoais da semana civil (seg-dom, `timezone_atual`) | `experimental` |
| Numerologia | Hoje | Dia Pessoal, calculado às 03:00 em `timezone_atual` | `nativo` |
| Dreamspell | Semana | 7 Kins da semana civil (seg-dom, `timezone_atual`) | `experimental` |
| Dreamspell | Hoje | Kin do dia, calculado às 03:00 em `timezone_atual` | `nativo` |
| Design Humano | Mês | Fotografia única do início do mês civil | `experimental` |
| Design Humano | Semana | União dos trânsitos dos 7 dias da semana civil | `experimental` |
| Design Humano | Hoje | Trânsito × Natal às 03:00 em `timezone_atual` | `nativo` |

---

# 5. Estratégia de cache / congelamento (sem alteração de regra — só a fonte do fuso horário mudou)

```text
ao pedir gerar_horizonte(participante, sistema, horizonte, data_referencia):
  1. calcular chave_periodo usando participante.timezone_atual
  2. buscar linha existente com essa chave
  3. se existir -> retornar (fotografia congelada)
  4. se não existir -> chamar adapter.compute_horizonte(), gravar
     (incluindo composition_status), retornar
```

- **Hoje**: fotografia fixa às 03:00 em `timezone_atual`. `chave_periodo` = data civil nesse fuso.
- **Semana**: `chave_periodo` = identificador da semana civil (ex.: `2026-W33`), segunda a domingo, em `timezone_atual`.
- **Mês/Ano de Numerologia**: recalculam só na virada do ciclo pessoal (ancorado no aniversário) — sem alteração.
- **Mês de Design Humano**: `chave_periodo` = `YYYY-MM` do mês civil em `timezone_atual` — uma fotografia por mês.

---

# 6. Estrutura inicial da biblioteca de conhecimento (sem alteração — ver v0.2)

---

# 7. Páginas/telas mínimas (atualizadas — inclui cadastro)

| Rota | Sistemas mostrados | Notas |
|---|---|---|
| `/login` | — | Senha compartilhada (§1.2), sessão via cookie |
| `/cadastro` | — | **NOVA** — formulário de pré-cadastro de participante (ver campos abaixo) |
| `/{participante}/pessoa` | Numerologia, Dreamspell, Design Humano | Tela de identidade/base, visualmente distinta (`DESIGN_DIRECTION.md` §8) |
| `/{participante}/ano` | Numerologia | 1 card |
| `/{participante}/mes` | Numerologia, Design Humano | 2 cards |
| `/{participante}/semana` | Numerologia, Dreamspell, Design Humano | 3 cards, todos rotulados `experimental` |
| `/{participante}/hoje` | Numerologia, Dreamspell, Design Humano | 3 cards + "Entender o porquê" |

## Campos do formulário de `/cadastro`
Nome completo (para os cálculos) · Nome de exibição · Data de nascimento · Hora de nascimento · Local de nascimento (texto) · Latitude e longitude do local de nascimento · **Fuso horário no momento do nascimento** (`timezone_nascimento`) · **Fuso horário de residência atual** (`timezone_atual`) · Confiabilidade da hora informada (alta/média/baixa).

**Sobre latitude/longitude**: para 4 pessoas conhecidas, o formulário pede as coordenadas diretamente (preenchidas uma vez, manualmente, por quem cadastra — ex.: consultando um mapa) em vez de integrar um serviço externo de geocodificação. Isso evita adicionar uma dependência de rede nova só para resolver "nome da cidade → coordenadas" quando o volume é de 4 cadastros únicos, não um fluxo recorrente. Se o laboratório crescer além de 4 pessoas no futuro, geocodificação automática vira uma escolha a reconsiderar — não agora.

## O cadastro dispara o cálculo — não é só armazenamento

Ao submeter `/cadastro` com sucesso, o sistema executa, na mesma operação (não em uma etapa manual separada depois):

```text
1. grava a linha em participantes
2. chama compute_pessoa() dos três adapters (Numerologia, Dreamspell, Design Humano)
   -> grava perfil_natal_numerologia / perfil_natal_dreamspell / perfil_natal_design_humano
3. chama gerar_horizonte() para Ano/Mês/Semana/Hoje, em cada sistema que suporta
   aquele horizonte (tabela da seção 4.2)
   -> grava as primeiras linhas de elementos_calculados_horizonte para esse participante
4. redireciona para /{participante}/pessoa, já com dados reais (não vazio)
```

Isso significa que assim que alguém se cadastra, o sistema já está "personalizado" com os dados daquela pessoa — não existe um estado intermediário de "cadastrado mas sem leituras". A mesma lógica de adapters e geração de horizonte usada para Guilherme nas Etapas 2-9 é reaproveitada aqui sem alteração — cadastrar um novo participante não é trabalho de engenharia novo, é só rodar o pipeline já existente com dados de entrada diferentes.

Esta tela é a única desta versão que **não** precisa seguir `DESIGN_DIRECTION.md` com o mesmo cuidado das telas de experiência — é utilitária, usada uma vez por participante, e pode ser simples/funcional sem comprometer a "sensação" do produto (que vive nas cinco telas de horizonte, não no cadastro).

---

# 8. Ordem exata de implementação (atualizada)

## Etapa 1 — Esqueleto do projeto + modelo de dados (Supabase)
Escopo: projeto Supabase criado; schema da seção 2 aplicado (incluindo `timezone_atual` e `composition_status`); conexão do FastAPI ao Postgres do Supabase.
Teste: app conecta ao banco e consegue ler/escrever uma linha de teste.
Conclusão: schema existe no Supabase; app local conecta com sucesso.

## Etapa 2 — Contrato de adapter + `NumerologyAdapter`
(Sem alteração da v0.1.)

## Etapa 3 — Geração de horizontes + cache (Numerologia)
Escopo: `gerar_horizonte()` com as regras de `chave_periodo` (Hoje=03:00 em `timezone_atual`; Semana=seg-dom civil em `timezone_atual`).
Teste: recalcula corretamente na virada de dia/semana; não recalcula fora da virada.
Conclusão: 5 linhas gravadas para Guilherme, com `chave_periodo` e `composition_status` corretos.

## Etapa 4 — Fundação visual (`DESIGN_DIRECTION.md`)
Escopo: tokens e componentes-base (paleta, tipografia, `AppShell`, `NavHorizontes`, `CardSistema`, símbolos dos três sistemas).
Teste: renderizar com dados fictícios, conferir em viewport mobile.
Conclusão: componentes existem e funcionam isoladamente.

## Etapa 5 — Middleware de senha + deploy inicial (Railway + Cloudflare DNS/proxy)
**Movida para cedo deliberadamente** — para que todo o resto do desenvolvimento já aconteça testando na URL real, não só em localhost.
Escopo: middleware de senha compartilhada; app publicado no Railway (plano já existente da equipe); domínio customizado apontado via Cloudflare (CNAME + proxy).
Teste: acessar a URL pública sem sessão → pede senha; com sessão → passa.
Conclusão: a URL privada existe e está protegida, mesmo que as páginas ainda estejam vazias/incompletas.

## Etapa 6 — Biblioteca de conhecimento (Numerologia) + as 5 páginas (só Numerologia)
Escopo: seed de `base_conhecimento`; as 5 rotas usando os componentes da Etapa 4, publicadas na URL da Etapa 5.
Teste: roteiro manual em celular real, via URL privada; valores conferidos contra `GOLDEN_PROFILE_GUILHERME.md`.
Conclusão — **primeiro marco real do projeto**: as cinco páginas existem, têm identidade visual coerente, abrem em celular via URL privada protegida por senha, e mostram os valores exatos do Golden Profile de Guilherme para Numerologia.

## Etapa 7 — `DreamspellAdapter` + extensão das páginas
(Mesmo conteúdo da v0.2.)

## Etapa 8 — `HumanDesignAdapter` + extensão das páginas
(Mesmo conteúdo da v0.2, incluindo a fotografia mensal em vez de união bruta.)

## Etapa 9 — QA final da primeira versão funcional (Guilherme)
(Mesmo conteúdo da v0.2.)

## Etapa 10 — Suporte aos 4 participantes, via cadastro na UI (atualizada)
Escopo: construir a tela `/cadastro` (seção 7, incluindo o disparo automático de cálculo); cadastrar Carlos, Dani e Julie através dela (não mais inserção manual direta no banco).
**Pré-requisito**: os dados de nascimento de Carlos, Dani e Julie precisam ser fornecidos por eles/pela equipe para preencher o formulário — o formulário resolve *como* cadastrar e ativa o pipeline automaticamente, mas não elimina a necessidade de *ter* os dados antes de digitá-los.
Teste: cadastrar um participante de teste e confirmar que, imediatamente após o envio do formulário, as 5 páginas já mostram dados reais (não vazios, não exigindo um passo manual extra); teste de isolamento de dados entre participantes.
Conclusão: os 4 participantes conseguem se cadastrar e, no mesmo fluxo, já veem suas próprias cinco páginas com dados corretos.

---

# 9. Resumo — testes necessários por etapa

| Etapa | Teste principal |
|---|---|
| 1 | Conexão com Supabase funciona; schema correto |
| 2 | Adapter reproduz golden tests |
| 3 | Cache respeita as regras de Hoje/Semana com `timezone_atual` |
| 4 | Componentes visuais renderizam em viewport mobile |
| 5 | Senha protege a URL; Tunnel funciona |
| 6 | Ponta a ponta (Numerologia), via URL real, em celular |
| 7 | Golden tests de Dreamspell + teste negativo de horizontes não suportados |
| 8 | Golden tests de Design Humano + Mês grava só 1 fotografia |
| 9 | Roteiro de aceite completo, 1 participante |
| 10 | Cadastro funcional + 4 participantes com dados isolados |

---

# 10. Critérios objetivos de conclusão

A primeira experiência funcional está pronta quando, simultaneamente:
1. A URL privada existe, está protegida por senha, e funciona em celular.
2. As cinco rotas existem, respondem sem erro, para os 4 participantes.
3. Cada card reproduz exatamente um valor já certificado em `ENGINE_VALIDATION.md` v0.3.
4. Nenhum card aparece num horizonte não suportado pelo sistema.
5. "Hoje" não muda de resultado dentro do mesmo dia civil (calculado às 03:00 em `timezone_atual`), mesmo chamado várias vezes.
6. "Semana" não muda dentro da mesma semana civil (seg-dom em `timezone_atual`).
7. Todo elemento `experimental` exibe isso visivelmente.
8. Design Humano "Mês" é uma fotografia única, não uma agregação de 30 dias.
9. A interface segue `DESIGN_DIRECTION.md`.
10. Os 4 participantes conseguem se cadastrar via `/cadastro` e têm dados isolados e corretos.

---

# 11. O que fica explicitamente fora deste plano

Autenticação por participante (login individual — a senha é compartilhada, não individual); reflexão posterior; geração de texto por IA; Nome da Cruz/Ângulo/Variáveis além do que já está manualmente preservado; Ano/Mês nativos de Dreamspell; Ano de Design Humano; navegação por data passada/futura; geocodificação automática no cadastro.

---

# 12. Implementation Decisions Needed — ENCERRADA nesta rodada

As três pendências que restavam foram todas resolvidas nesta mensagem:

- **Host do app Python** → Railway (plano já existente da equipe), no lugar de Fly.io. Ver §1.1.
- **Senha compartilhada** → senha padrão simples, definida pela equipe (não uma por participante). Sem mais decisão de mecanismo — o middleware já está especificado em §1.2.
- **Dados de nascimento de Carlos, Dani e Julie** → não é mais uma decisão de "como coletar" (isso o cadastro resolve, §7) — é só um pré-requisito de dado para a Etapa 10 poder rodar. Continua sendo necessário ter esses dados em mãos antes daquela etapa especificamente, mas não bloqueia nada antes disso.

Não há mais decisões de implementação em aberto antes do primeiro commit.
