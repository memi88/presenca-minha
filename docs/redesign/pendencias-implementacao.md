# Redesign — pendências pra fechar o fluxo completo

> Lista viva, atualizada durante a implementação (branch
> `redesign/visual-contemplative-warmth`). Cada item é algo que ficou de
> fora de uma fase já feita, ou uma decisão ainda em aberto — não é uma
> lista de tarefas da fase corrente, é o que falta pro pacote fechar de
> verdade. Ver `presenca-handoff-claude-code.md` e
> `presenca-redesign-sistema-visual-status.md` pro plano original.

## Imagens reais (upload)

- [ ] **Bloqueado por uma decisão maior**: vamos migrar o banco inteiro de
      Supabase pra Cloudflare, do zero (sem usuários ativos ainda — só 2
      parceiros) — tarefa separada, ver memória `project_migracao_supabase_cloudflare`.
      Não vale montar upload de imagem em cima do Supabase Storage sabendo
      que o banco vai trocar de lugar. `biblioteca` (Livro Vivo + Práticas)
      e `profissionais` não têm coluna de imagem — os 3 blocos novos da
      Home (Do seu terapeuta, Prática sugerida, carrossel do Livro Vivo)
      usam placeholders SVG próprios (`public/images/placeholders/`) até
      lá. Retomar depois que a decisão de banco andar.

## Telas novas sem rota hoje (não são reskin, são construção nova)

- [x] **Página do Autor** — `app/autor/[id]/page.tsx`, só pra profissionais
      com conta (`profissional_autor_id`, não o `biblioteca.autor` texto
      livre do Guilherme — decisão explícita, ver pergunta ao usuário).
      Achado no caminho: `AutoriaBiblioteca` (rodapé "escrito por X") só
      aparecia pra quem já tinha vínculo com aquele profissional — RLS de
      `profissionais` não cobria leitor sem vínculo lendo autor de
      conteúdo *público*. Migration nova
      `20260902123000_profissionais_leitura_publica.sql` libera leitura
      pra quem tem conteúdo público publicado (**precisa ser aplicada**).
      Novo link "ver perfil de X" no cartão expandido de `AutoriaBiblioteca`.
      Placeholders de imagem consolidados em `lib/placeholders.ts`
      (Home, grade de Práticas e Página do Autor agora importam do mesmo
      lugar, sem cópias divergentes do caminho).
- [x] **"Pergunta do terapeuta" como tela própria** — `app/diario/pergunta/page.tsx`
      novo: pergunta em destaque (itálico grande) + textarea com efeito de
      papel pautado + "responder no diário". Reaproveita a mesma action
      `criarEntrada` do Diário normal (não existe, nem foi criado, vínculo
      estruturado pergunta→resposta no schema — é ordem cronológica, como
      sempre foi). A pílula "escrever algo" na Home aponta pra cá em vez
      do Diário completo quando há pergunta em aberto (mesmo sinal que já
      decidia o headline).
- [x] **Cadastro de Prática (admin)** — não existe mockup pra essa tela
      específica em nenhum pacote (confirmado). Em vez disso, `docs/redesign-cuida`
      trouxe os mockups reais das 5 telas novas da Fase 11 (self-signup
      terapeuta, pré-cadastro paciente, confirmação pública, biblioteca
      colaborativa — submissão, painel de aprovação), que juntas cobrem a
      mesma necessidade (conteúdo novo entrando na `biblioteca`) pela
      arquitetura que já foi decidida (proposta + moderação, não
      cadastro direto por admin). Implementadas: `/pacientes/novo` e
      `/biblioteca/nova` (Cuida, cards + toggles em pílula), `/admin/biblioteca`
      e `/convite/[token]` (Presença, troca de fonte). `/cadastro` e
      `/perfil/completar` (Cuida) já estavam maduros, sem mudança
      necessária.

## Estrutura pendente (não é troca de fonte, é mudança de rota)

- [x] **`/folego` dobrado dentro de `praticas/[id]`** — rota removida.
      Virou `FolegoInline.tsx` (client component novo em `app/praticas/`),
      estado local: cartão "começar →" enquanto não iniciada, tela cheia
      fixa (sempre escura, cor fixa em vez de `var(--text)` etc — não pode
      clarear junto com o resto de Práticas, que agora é ambiente claro)
      depois de tocar. `rotaDePratica()` simplificada (sempre
      `/praticas/{id}`), `ehPraticaInterativa()` novo export detecta o
      slug `respiracao-4-7-8` pra decidir o que renderizar.
- [x] **Biblioteca de práticas (listagem com filtros)** — implementada com
      taxonomia real (decisão: não fabricar categoria). Migration
      `20260902120000_biblioteca_categoria_pratica.sql` adiciona
      `biblioteca.categoria` (respiracao/meditacao/movimento/sono, só pra
      tipo=pratica) — **precisa ser aplicada** (mesmo fluxo manual de
      sempre). `CATEGORIAS_PRATICA` espelhada em `apps/cuida/lib/` (seletor
      em pílula no formulário de proposta) e `apps/presenca/lib/` (filtro
      em `/praticas`). `TelaSelecao` em `PainelPratica.tsx` virou grade de
      cards de foto (placeholder) + pílulas de filtro por query string.
- [x] **Privacidade + Limites de Cuidado unificadas** — `/privacidade`
      agora tem os dois documentos, com índice no topo (`#privacidade`,
      `#limites-de-cuidado`). `/limites-de-cuidado` virou `redirect()` com
      âncora — mantida como rota só pra não quebrar link antigo. Os 2
      consentimentos que linkavam pra `/limites-de-cuidado` diretamente
      (Chegada, Convite) atualizados pra apontar direto pra âncora.

## Tipografia — cantos que a Fase 1-4 não cobriu

- [x] `AutoriaBiblioteca.module.css` e `AcessoBloqueado.module.css`
      migradas. **`apps/presenca` inteiro está em Fraunces/Bitter agora,
      zero `var(--font-spectral)` restante** (Spectral continua carregado
      pra quem ainda depender, mas nenhum CSS usa mais).

## Pendências herdadas do handoff original (não resolvidas ainda)

- [ ] Revisão jurídica da frase de privacidade gerada na tela de Chegada
      ("nunca compartilhamos com terceiros...") antes de virar copy final.
- [x] `presenca-cuida-planejamento.md` — chegou (`docs/redesign-cuida/`).
      Resolve a decisão de identidade visual do Cuida: **mantém sistema
      próprio** (Spectral itálico + Work Sans + IBM Plex Mono + teal
      `#1e6b64`), não adota Fraunces/Bitter do Presença. Confirmado também
      no `cuida_professional_ecosystem/DESIGN.md` junto dos mockups.
- [ ] Ainda sem chegar ao repo: `presenca-merge-site-decisoes.md`,
      `presenca-fusao-site-institucional.md`.
- [x] **Auditoria das 4 telas antigas do Cuida** (login, lista de
      pacientes, detalhe do paciente, perfil) — feita. Nenhum ícone
      genérico/biblioteca padrão encontrado (só texto e um emoji 🔒 no
      estado bloqueado do pré-cadastro, não substituído — não é ícone de
      biblioteca, baixa prioridade). `max-width` de mobile preso em
      desktop confirmado e corrigido em `/pacientes` e `/pacientes/[id]`
      (480px→640px a partir de 900px) — só largura, sem redesenho de
      layout. `/perfil` e `/` (login) ficaram em 400px de propósito
      (formulário/card centralizado, não é o mesmo problema).

## Processo

- [x] Trabalho da sessão organizado em 9 commits temáticos na branch
      `redesign/visual-contemplative-warmth` (fundação, Home, Práticas,
      Livro Vivo/autor, Diário/pergunta, Privacidade, Cuida, docs,
      indicação estruturada). Nada em aberto sem commit.
- [ ] **2 migrations novas precisam ser aplicadas** (mesmo fluxo manual de
      sempre): `20260902120000_biblioteca_categoria_pratica.sql`,
      `20260902123000_profissionais_leitura_publica.sql`.
- [ ] Branch ainda não teve PR aberto nem foi mergeada — só local.
