# Decisões de produto — Experiências Guiadas

> Em resposta a `docs/Presenca_Experiencias_Guiadas_Direcao_Produto.docx` (direção de produto, etapa 1 — ver documento pra objetivo/princípios/tipos completos). Este documento é a etapa 2 ("Claude / análise do projeto e código"): auditoria do estado real antes de qualquer PRD. Nenhuma implementação ainda.

---

## Achado prévio, crítico pro desenho do PRD: migração Supabase → Cloudflare D1/Drizzle/Better Auth em andamento

Descoberto no meio desta auditoria (arquivos mudando no disco durante a sessão). Estágio real, com evidência (2026-09-05):

- **~60 de ~62 arquivos de app já usam `@presenca/db`** (D1/Drizzle) — só 2 restantes em `@presenca/supabase`, e são só uma entrada de `transpilePackages`, não dependência funcional.
- **Auth completo migrou**, não só dados — `lib/auth.ts` já usa Better Auth (`createAuth`, binding `DB`, Google OAuth reconfigurado).
- **Testado localmente de verdade** — `packages/db/.wrangler/state/v3/d1/` tem `.sqlite`/`.sqlite-wal` reais, miniflare já rodou queries.
- **Trabalho ativo, não histórico** — segunda migration gerada às 22:07 do dia desta auditoria; dois arquivos do P5 (`buscarPratica.ts`, `conexaoCaderno.ts`) foram reescritos pra D1 durante esta própria sessão, sem pedido.
- **Não confirmado:** nenhuma evidência de `db:migrate:remote` rodado contra o D1 real; `wrangler.jsonc` com o binding `d1_databases` ainda uncommitted; último deploy real de produção (P5, `0432f0bd`) não tinha esse binding. **Produção hoje ainda é 100% Supabase.**

**Conclusão prática:** código quase completo, só falta o corte de produção — não é tradução mecânica distante. Decisão sobre desenhar o schema de Experiências Guiadas direto em Drizzle/D1 (em vez de Postgres/RLS interino) depende de confirmação do Guilherme sobre o timing real do corte — pendente nesta conversa.

---

## Auditoria — mapa do que existe hoje (antes do PRD)

### A. Portal Cuida

Rotas reais: `/pacientes` (lista), `/pacientes/[id]` (detalhe), `/pacientes/novo` (pré-cadastro), `/perfil` + `/perfil/completar`, `/biblioteca/nova`, `/cadastro`.

`/pacientes` é lista plana, sem fila nem ordenação por "precisa de ação" — único sinal é badge "atenção" de `alertas_risco` (risco, não pergunta pendente). `/pacientes/[id]` não tem conceito de pergunta em aberto do lado do profissional nem contagem de itens não vistos. **Não existe hoje nenhuma base pra fila de revisão/resposta** — precisa ser construído do zero.

### B. Schema de `vinculos`

```
vinculos: id, profissional_id, paciente_id, ativo, created_at,
          compartilhar_praticas, compartilhar_livro_vivo
unique(profissional_id, paciente_id)
```

Vínculo 1:1 genérico, sem conceito de "qual experiência". `unique(profissional_id, paciente_id)` impediria até duas linhas pra dois fins diferentes com o mesmo par. **Não serve de base** — precisa de tabela nova de instância de experiência.

### C. Schema de `biblioteca`

Nenhum campo distingue "ação pontual" de "percurso com etapas e estado" — confirmado. `conteudo` é uma coluna `text` única, sem estrutura de etapas, sem relação com progresso da pessoa, sem conceito de "próximo passo" ou responsável por decidi-lo. Extensão real necessária: tabela separada de instância/progresso.

### D. Notificações

Zero infraestrutura funcional hoje. Push: só um service worker vazio (existia só pra critério de instalabilidade PWA, sendo removido agora). Email: hooks do Better Auth fazem só `console.log`, nenhum provedor conectado.

Viabilidade real de push: Web Push em iOS Safari só funciona se o PWA foi "Adicionado à Tela de Início" (suporte desde iOS 16.4) — aba normal não recebe. Android/Chrome funciona sempre. Presença já tem casca nativa via Capacitor (modo remoto, comentário no próprio `capacitor.config.ts` já cita "push" como papel do app nativo) — push nativo (APNs/FCM) não depende de instalação PWA, é a rota mais confiável aqui. `@capacitor/push-notifications` **não está instalado**.

### E. Padrão de consentimento

UI real (`ConectarForm.tsx`, `ConfirmarConviteForm.tsx`): checkbox client-side, texto explícito, submit desabilitado até marcar — sem registro persistido separado (o próprio ato é o consentimento). Padrão de schema mais robusto vem da extensão de Organizações (design-only, `docs/presenca-organizacoes.md`):
```sql
consentiu_x boolean default false,
consentiu_x_em timestamptz,
consentiu_x_revogado_em timestamptz -- nulo enquanto ativo
```
Nunca herdado de outro consentimento — cada opt-in é separado e revogável.

### F. Estado/continuidade

Não existe máquina de estados explícita reutilizável hoje. `pacientes_pre_cadastro` (`status: pendente|confirmado`) é binário, resumível via token, sem etapas intermediárias. `/chegada` tem 2 "etapas" mas o estado é **inferido** da presença de dados (`profiles.nome` preenchido), não um contador explícito. Nenhum precedente direto de estado multi-etapa persistido pra reaproveitar.

---

## Decisões de arquitetura confirmadas (2026-09-05), independentes do alvo Postgres/D1

1. **Tabela de instância/progresso separada** (especialista, pessoa, estado, histórico de troca) — nunca extensão de `vinculos` ou `biblioteca`.
2. **Consentimento por instância de experiência**, padrão `consentiu_x`/`_em`/`_revogado_em` (do design de Organizações) — nunca flag global.
3. **Estado explícito**, enum de status por instância (`aguardando_pessoa`, `aguardando_especialista`, `concluida`, etc.) — nunca inferido.
4. **Notificação via push nativo** (Capacitor/APNs/FCM), não Web Push — `@capacitor/push-notifications` a instalar e implementar.

**Pendente antes do PRD completo:** confirmação do Guilherme sobre o estágio/timing real do corte D1, pra decidir se o schema é desenhado direto em Drizzle ou como interino Postgres/RLS.
