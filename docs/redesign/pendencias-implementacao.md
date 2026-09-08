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
      zero `var(--font-spectral)` restante.**
- [x] Spectral removido de `app/layout.tsx` (03/09/2026) — ficava
      carregado sem nenhum CSS consumir, exatamente o "resquício de fonte
      antiga" que a análise da Home (ver seção "Check-in vira modal"
      abaixo) foi atrás de confirmar. Comentário desatualizado em
      `app/(marketing)/layout.tsx` (dizia que o app logado "usa Spectral")
      também corrigido.

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

## Check-in vira modal, Home perde leftovers da versão antiga (03/09/2026)

- [x] Portão de tela cheia obrigatório do check-in (`precisaVisitaCheckin`,
      2 dias sem visita) removido — trocado por um gatilho sempre visível
      ("Como você está hoje?" + humor atual, quando respondido) logo abaixo
      da saudação, que abre um modal (bottom sheet) com as 5 opções, igual
      às telas novas em `docs/redesign/stitch_presen_a_home_experience 4/`.
      O resto da Home (lente, terapeuta, prática sugerida, Livro Vivo)
      nunca mais fica escondido atrás do check-in. Novo componente cliente
      `app/home/MoodTrigger.tsx`.
- [x] Removidos da Home (mobile e desktop — os mockups novos não mostram
      nenhum dos dois): banner de instalar PWA (`InstalarPWABanner` — ficou
      órfão nesta etapa, apagado de vez na seção "Aviso de instalar PWA
      removido de vez" abaixo), o headline adaptativo
      ("Há outros lugares...", "Continue de onde você parou" etc. —
      `HEADLINE_*`/`ordemPorMood`/`ordemComDestaque`/`destinoIdDeUltimoDestino`
      removidos de `lib/menuHome.ts`), o link "Como foi seu dia? →", e as 4
      pílulas de destino (uma prática/uma página do livro/conversar/
      escrever algo).
- [x] "recursos de cuidado →" saiu da Home mas ganhou um lar persistente em
      `/perfil` (seção "cuidado", topo da página, antes de e-mail) —
      confirmado que não existia nenhum outro caminho incondicional até
      `/recursos` (só via crise detectada na Conversa, ou enterrado no
      rodapé de Privacidade). `/perfil` é alcançável de qualquer tela
      (avatar no header, mobile e desktop) — Fase 8/PRD §7 exige que
      Recursos nunca suma, nem no estado "confuso".
- [x] Link "voltar a algo que você guardou →" (revisitar) mantido — não
      apareceu nos mockups novos nem foi mencionado pra remoção, e é uma
      funcionalidade própria, não resquício.
- [x] `profiles.ultimo_destino` — como o headline adaptativo que o
      consumia (`destinoIdDeUltimoDestino`) foi removido, as 4 escritas
      incondicionais em conversa/livro-vivo/praticas/diario (`page.tsx`)
      ficaram sem nenhum consumidor — removidas (coluna em si não foi
      migrada pra fora do schema, só parou de ser escrita/lida).
- [x] `lib/checkin.ts`: `precisaVisitaCheckin` removida (só existia pro
      portão antigo). `precisaCheckin` (janela de 12h) continua — agora só
      decide o estado "reduzido" (esconde Terapia quando humor é
      "confuso"), não decide mais se o modal aparece.

## Login e onboarding alinhados aos mockups novos (03/09/2026)

- [x] `/bem-vindo` reescrita do zero — era uma tela com headline + 2 botões
      ("Quero criar meu espaço"/"Já possuo meu espaço"), virou a "porta de
      entrada" minimalista do mockup (`bem_vindo_porta_de_entrada`): logo
      (`CirculoRespirando`, já usado no wordmark da Home) respirando,
      wordmark "presença", um "entrar →" discreto (leva pra `/chegada`) e
      "já possuo meu espaço" como rodapé pequeno (leva pro `/login`). Sem
      `PageHeader` — tela silenciosa de propósito, igual ao mockup.
- [x] `/login` — ícone (`CirculoRespirando`) adicionado no topo, "entrar
      sem senha" (link mágico) promovido de linkzinho a segundo botão de
      peso visual real (mesmo par do mockup), "criar um novo espaço"
      virou link de rodapé (não existia antes). Fluxo de recuperação de
      senha e captcha mantidos — o mockup não modela isso, mas são
      proteção/funcionalidade real, não removidos.
- [x] `/chegada` (etapa 1) já estava bem alinhada ao mockup desde o
      commit `59dc84c` (apelido/e-mail/senha unificados) — só ganhou o
      divisor + rótulo "opcional para agora" acima de e-mail/senha,
      igual ao agrupamento visual do mockup (`chegada_identidade_e_escolha`).
      Checkbox de consentimento (política de privacidade/limites de
      cuidado) e captcha Turnstile mantidos — o mockup usa um bloco de
      texto estático ali, mas a versão real precisa do consentimento
      explícito e da proteção contra bot, então não foram trocados.
- [x] As 3 telas passaram de fundo com foto (`/images/claro.png`, mesmo
      tratamento da Home) pra fundo plano (`var(--bg)`) — nos 3 mockups
      novos nenhuma tela de entrada/onboarding usa imagem, só as telas de
      dentro do app (Home etc.) — mantém a leitura de "aqui é mais quieto,
      a textura vem depois".

## Correção de fidelidade: chegada e login vs. mockup (03/09/2026)

Depois de comparar lado a lado com os mockups, o Guilherme apontou que
`/chegada` e `/login` ainda estavam "bem diferentes" — `/bem-vindo` foi
aprovada sem ressalvas.

- [x] Headline itálico era o maior culpado visual em ambas — os mockups
      usam Fraunces peso 300 **reto** (não itálico) em display grande;
      `.headline` de `chegada` e `login` corrigido (itálico removido, peso
      e tamanho ajustados pra bater mais com os ~40px do mockup).
- [x] `/chegada`: eyebrow "CRIAR ESPAÇO" removida (mockup não tem).
      Headline/subtítulo trocados pro texto real do mockup ("Como quer ser
      chamado?" / "Um espaço reservado para suas reflexões."). Card
      "Transparência e Cuidado" (ícone + título + texto, fundo âmbar bem
      sutil) devolvido, no lugar exato do mockup — o checkbox de
      consentimento real (obrigatório, com links de política/limites) e o
      captcha Turnstile **não foram removidos**: o card é só contexto, o
      checkbox continua sendo o que de fato registra o aceite.
- [x] `/login`: eyebrow "BEM-VINDO DE VOLTA" removida, headline virou só
      "Entrar" (grande, reto) + subtítulo "Retorne ao seu espaço de
      reflexão." — copy do mockup. Campos e-mail/senha ganharam rótulo
      visível acima (não só placeholder), igual ao mockup — replicado
      também nos sub-formulários de recuperação de senha/link mágico pra
      ficar consistente. Botão "entrar sem senha" trocado de contorno
      branco pra preenchido âmbar bem claro (sem borda), igual ao par de
      botões do mockup.

## Home: fundo/cabeçalho/cards alinhados ao mockup refinado (03/09/2026)

Comparando lado a lado, o Guilherme apontou que a Home ainda estava "bem
diferente" do mockup mais completo (`docs/redesign/
home_presen_a_cones_svgs_inline_refinados` — os ícones do BottomNav já
vinham dali de uma fase anterior, mas o resto do layout não).

- [x] Fundo: era foto em tela cheia com gradiente escuro (texto branco por
      cima); virou o padrão "atmosférico" do mockup — foto só numa faixa no
      topo (`.atmosfera`, ~58vh, desbotando pra `var(--bg)`), resto da
      página em superfície lisa. Todo texto que dependia de fundo escuro
      (saudação, nav, wordmark, links) virou texto escuro normal — não tem
      mais nada realmente escuro atrás pra justificar branco+text-shadow.
- [x] Cards "Lente do dia" e "Do seu terapeuta": eram translúcidos sobre a
      foto (`rgba(...)+backdrop-blur`); viraram cards sólidos
      (`var(--bg-elevated)` + borda), mesmo tratamento do resto do app.
- [x] "Lente do dia" ganhou eyebrow com ícone (olho, novo
      `app/IconeLente.tsx`) + data real do dia — **não** o título fabricado
      que aparecia no mockup ("A Impermanência da Pressa"): `DailyPresent`
      (`lib/present.ts`) não tem campo de título, só `reflection`/
      `question`/`derivationSummary`, e isso não foi inventado. Pergunta +
      "conversar sobre isso" + "entender de onde vem" mantidos, sem perda
      de conteúdo real.
- [x] "Prática sugerida" ganhou o mesmo eyebrow com ícone (reaproveitando
      `IconePraticas`, já existente do BottomNav) acima do card, e o CTA
      "Iniciar prática" virou pílula de largura total com seta — igual ao
      mockup.
- [x] "Livro Vivo" ganhou eyebrow com ícone (reaproveitando `IconeLivroVivo`).
- [x] Saudação + gatilho de humor (MoodTrigger) centralizados, novo wrapper
      `.saudacaoBloco` — igual ao mockup (`text-center`).
- [x] Wordmark "presença" do header desktop virou negrito âmbar (cor real
      da marca), em vez de branco translúcido pensado pra foto de fundo.
- [x] `.lenteRotuloClaro` (label que só existia dentro do overlay da
      prática sugerida) removida — órfã depois que o rótulo virou eyebrow
      externo.

## Aviso de instalar PWA removido de vez (03/09/2026)

Remover o `InstalarPWABanner` do render da Home (feito antes, ver seção
acima) não foi suficiente — o Chrome continuava mostrando o próprio aviso
nativo de instalação, porque `AmbienteShell.tsx` registrava um service
worker (`public/sw.js`) em **toda** página do app, globalmente, só pra
satisfazer o critério de instalabilidade do Chrome
(`beforeinstallprompt` exige um SW ativo — comentário original do próprio
código já explicava isso). Sem nenhum componente ouvindo mais esse evento,
sobrava só o aviso nativo do navegador.

- [x] Registro do service worker removido de `AmbienteShell.tsx`.
- [x] `public/sw.js` e `app/home/InstalarPWABanner.tsx` apagados — eram
      infraestrutura de uma funcionalidade (convite de instalar customizado)
      que já tinha sido tirada da UI; sem consumidor, viraram peso morto.
      `.conviteAcao` (CSS que só o banner usava) removido junto.
- [x] `manifest.ts` mantido — ainda serve pra ícone/tema do app (inclusive
      pro wrapper Capacitor), não é o que dispara o aviso.

## Auditoria completa: mockup vs código, fixes sistêmicos (03/09/2026)

Pedido do Guilherme: "as telas não estão parecidas, vamos revisar
novamente". Rodei 4 auditorias (uma por grupo de telas) comparando cada
mockup de `docs/redesign/` contra o código real. Achado mais recorrente:
o headline principal de quase toda tela usava `font: italic 300 ...`
copiado de um lugar só, mas nenhum mockup pede itálico nesse elemento.

- [x] Itálico removido do headline principal em: `/perfil`, `/conta`,
      `/autor/[id]` (e o itálico que estava no lugar errado foi pro
      `.descricao`, que é onde o mockup pede), `/terapia`, `/livro-vivo`
      (`.titulo` e `.tituloSelecao`), `/praticas` (idem), `/recursos`,
      `/privacidade` (`.headline` e `.secaoPrincipal`, este último também
      ganhou peso 500 — mockup usa um token diferente pra título de seção),
      `/fechamento` (peso 500 também, confirmado pelo mockup), e o
      "fechamento da conversa" dentro de `/conversa`
      (`.fechamentoTitulo`, que também estava com metade do tamanho do
      mockup — ajustado).
- [x] **Bug**: `/diario/pergunta` renderizava no ambiente escuro por
      herdar o prefixo `/diario` de `AmbienteShell.tsx` — o mockup dessa
      tela é claro. Adicionada exceção explícita (`EXCECOES_CLARAS`).
- [x] **Bug**: texto digitado pelo usuário em itálico (não só o
      placeholder) no Diário (`.textarea`) e em `/diario/pergunta`
      (campo de resposta) — corrigido pra itálico só no placeholder vazio,
      texto real reto (mais legível).
- [x] `/diario/pergunta`: CTA centralizado (estava `flex-start`) e
      `.pergunta` (a pergunta em destaque) ajustada pro tamanho/peso do
      mockup (36px/400, mantendo itálico — aqui é intencional).
- [x] Home: saudação grande ("boa tarde, Nome.") agora aparece em
      qualquer largura — antes só existia no desktop (`.greetingDesktop`),
      no mobile sobrava só a versão pequena espremida na barra do topo.
      Renomeada pra `.saudacaoGrande`, cabeçalho perdeu a saudação
      duplicada (fica só monograma/wordmark + avatar, igual ao mockup).

### Achados estruturais maiores — não implementados ainda, exigem decisão de escopo

- ~~**"Lente do dia" sem tela de leitura própria**~~ — implementado, ver
  "Lente do dia: tela de leitura própria" (04/09/2026) abaixo.
- ~~**`/fechamento` é página cheia clara; mockup é modal escuro**~~ —
  implementado, ver "Fechamento do dia vira modal na Home" (04/09/2026)
  abaixo.
- ~~**Terapia (conectado)**~~ — implementado, ver "Terapia (conectado):
  foto, compartilhamento por categoria e desconectar" (04/09/2026) abaixo.
- ~~**Terapia (sem conexão)**~~ — implementado, ver "Terapia (sem
  conexão): card Dinâmica da conexão" (04/09/2026) abaixo.
- ~~**Página do Autor**~~ — implementado, ver "Página do Autor: cards de
  'mais obras' corrigidos" (04/09/2026) abaixo.
- ~~**Conversa**~~ — implementado, ver "Conversa: pílula única, hover no
  guardar, cores das bolhas" (04/09/2026) abaixo.
- ~~**Fechamento da conversa**~~ — implementado, ver "Fechamento da
  conversa: 3 ações reais" (04/09/2026) abaixo.
- ~~**Prática ativa**~~ — revisto (04/09/2026), sem mudança de código: o
  estado "instrução textual" do mockup (logo pulsando + 1 linha, sem
  contador nenhum) já é coberto por `FolegoInline.tsx` de forma mais rica
  (contador de fases 4·7·8 + círculo animado sincronizado, construído numa
  fase anterior desta sessão) — decisão de não empobrecer o que já existe
  só pra bater com um mockup mais genérico. O outro estado, "mídia
  imersiva" (vídeo/áudio de fundo, player com tempo decorrido), continua
  **bloqueado de verdade**: não existe nenhum arquivo de áudio/vídeo de
  prática guiada no sistema, nem coluna pra isso em `biblioteca` — não dá
  pra fabricar conteúdo de prática guiada.
- ~~**Detalhe de prática** (foto hero + coluna única)~~ — resolvido na
  reforma "Jornada de Prática/Livro Vivo: foco single-item" (04/09/2026,
  ver acima). Segue faltando: autoria (Página do Autor) não aparece em
  práticas interativas (`FolegoInline`) — só nas práticas de texto.
- ~~**Biblioteca de Práticas**~~ — implementado, ver "Biblioteca de
  Práticas: card maior + ícone por categoria" (04/09/2026) abaixo.
- ~~**Recursos**~~ — implementado, ver "Recursos: paleta terracota migrada
  pra âmbar" (04/09/2026) abaixo.
- ~~**Conta**~~ — implementado, ver "Conta: card com Google SSO primeiro"
  (04/09/2026) abaixo. Última pendência da lista de achados estruturais
  desta auditoria — todos os itens levantados em 03/09/2026 estão
  resolvidos ou bloqueados por falta de conteúdo/dado real.

## Modal de nascimento vira bottom sheet (03/09/2026)

Mockup novo em `docs/redesign/stitch_presen_a_home_experience_data`
(modal "Quer uma experiência melhor?" da etapa 2 de `/chegada`) — usava
Spectral em vários lugares, inconsistência do próprio Stitch (ignorado,
ver [[feedback_mockup_fonte_do_projeto]]).

- [x] Modal de `/chegada` (etapa 2) trocado de card centralizado
      (`.backdrop`/`.dialogo`) pra bottom sheet — mesmo padrão do modal de
      humor da Home (`MoodTrigger.tsx`): alça de arrastar, folha subindo
      de baixo, botão fechar (×) no canto — ambos "fechar" e "pular por
      enquanto" chamam a mesma action (`pularNascimentoCadastro`), sem JS
      de abrir/fechar porque é tudo server component.
- [x] `NascimentoForm.tsx` (compartilhado entre o modal de `/chegada` e a
      página própria `/perfil/nascimento`) ganhou labels normais (não mais
      eyebrow uppercase) + hint "(obrigatório)"/"(opcional)" com estilo
      próprio ao lado de cada rótulo, igual ao mockup. Campos continuam
      `type="date"`/`type="time"` nativos (não virou texto livre "dd/mm/
      aaaa" como no mockup — isso seria trocar acessibilidade/validação
      real por uma maquete estática, não fazia sentido).
- [x] Nota tranquilizadora ("Não sabe a hora? Sem problema...") já existia
      igual ao mockup, nada a mudar ali.

## Home: convite de conversão removido, espaçamento e saudação corrigidos (03/09/2026)

- [x] **Convite de conversão** ("Quer poder voltar de qualquer lugar?
      Guardar meu espaço") removido da Home por pedido explícito — "vamos
      remover essa mensagem e pensar nisso para outro momento". Removido:
      o bloco JSX, a variável `mostrarConviteConversao`, o import de
      `adiarConversao`, e `lembrete_conversao_em` do select do profile
      (nada mais lia essa coluna). **Não removido**: a action
      `adiarConversao` em `actions.ts` nem a coluna `lembrete_conversao_em`
      no banco — só desconectado da UI, fácil de retomar quando for
      redesenhado.
- [x] **Bug de espaçamento**: `.bottom` tinha `margin: auto auto 0`,
      sobra do layout antigo (foto em tela cheia, conteúdo centralizado na
      sobra vertical). Com o fundo "atmosférico" atual isso deixava um vão
      enorme e vazio entre o header e a saudação — ainda mais visível
      depois de tirar o convite de conversão. Virou espaçamento fixo.
- [x] Saudação ("bom dia"/"boa tarde"/"boa noite") corrigida pra maiúscula
      — vinha de uma função JS (`saudacao()` em `app/home/page.tsx`), não
      apareceu na varredura de maiúscula anterior porque não é uma string
      JSX estática.

## Home: wordmark centralizada em qualquer largura (04/09/2026)

Comparando de novo com o mockup, "Presença" não aparecia em nenhum lugar
do header no mobile (só o monograma "p·") — o mockup centraliza a
wordmark em qualquer largura, não só desktop.

- [x] `.topBar` virou grid de 3 colunas (`1fr auto 1fr`): monograma
      (esquerda, sempre visível) / "Presença" (centro, sempre visível,
      negrito âmbar) / nav+avatar (direita). Antes a wordmark só existia
      numa variante `.wordmarkDesktop` (tracking de logotipo, só ≥960px);
      virou `.wordmarkCentro`, sempre visível, sem o tracking largo
      (o mockup usa peso normal, não all-caps espaçado).
- [x] `.greeting` (regra CSS órfã — a saudação pequena do topo tinha sido
      removida do JSX numa correção anterior, mas a regra `display:none`
      dela sobrou no CSS) removida.
- [x] `.topBarEsquerda` (wrapper que agrupava monograma+wordmark antigos)
      removida — grid não precisa mais desse agrupamento.

## Jornada de Prática/Livro Vivo: foco single-item, sem lista lateral (04/09/2026)

Decisão confirmada explicitamente: trocar o padrão "lista lateral + painel
de leitura" (igual nas duas seções) por foco numa prática/página só, sem
navegar pra outra sem voltar pra grade — fiel ao mockup, mesmo perdendo a
navegação lateral rápida que existia.

**Biblioteca de Práticas (grade)**
- [x] Card ganhou descrição (2 linhas) + CTA "Iniciar →" sempre visível
      (pílula translúcida com blur, como o mockup).
- [x] Título do card ~22-28px (era 19px fixo).
- [x] Grid trava em 2 colunas no máximo (era até 3 em desktop).
- [x] Pílula de filtro ativa virou escura (`var(--text)`) — era âmbar.
- Duração ("5 min") não existe no modelo de dados — não fabricado, fica de
  fora até existir um campo real.

**Detalhe de Prática**
- [x] Reescrito do zero: foto hero (`PLACEHOLDER_PRATICA`, 50vh mobile /
      metade da tela desktop) + coluna única de conteúdo. Sem
      `PageHeader`, só um botão "‹" flutuante circular.
- [x] Sem painel lateral com as outras práticas — pra ver outra, volta pra
      grade.
- [x] Autoria (`AutoriaBiblioteca`) reposicionada antes do CTA "Guardar"
      (estava depois).
- [x] "Guardar esta prática" virou o CTA principal, cheio/preenchido — faz
      o papel visual do "Começar" do mockup, mas com o rótulo certo pro
      que o botão realmente faz. **Não** foi inventado um botão "Começar"
      sem função pra prática de texto (só as interativas, via
      `FolegoInline`, têm um "começar" de verdade — essas mantiveram sua
      própria experiência intacta, sem a foto hero por cima).
- [x] Tamanho do título: 34-48px agora (era 28-36px).
- [x] `/praticas/[id]/page.tsx` simplificado: busca só a prática pedida
      (era o catálogo inteiro pra achar por id, sobra da lista lateral que
      não existe mais).

**Livro Vivo (acervo)**
- [x] Lista de texto virou grade de cards de foto (`PLACEHOLDER_LIVRO_VIVO`),
      2 colunas no máximo — pendência antiga, já registrada no próprio
      código, finalmente resolvida.
- [x] "X min de leitura" mantido (é dado real, calculado) — o mockup não
      mostra, mas não é motivo pra tirar uma informação real e útil.
- [x] Filtro por momento/humor — implementado depois, ver "Livro Vivo:
      título e filtro por momento" (04/09/2026) mais abaixo (pílulas com a
      taxonomia real, não os rótulos poéticos do mockup).

**Leitura do Livro Vivo (detalhe)**
- [x] Mesma decisão do detalhe de Prática: sem painel lateral, botão "‹"
      flutuante. Mantém o fundo fotográfico escuro (`sala.png`) que já
      existia pra essa rota — nenhum mockup específico de leitura pra
      contradizer isso.

**Limpeza correlata**
- [x] Prop `variante` (nunca lida em lugar nenhum) removida de
      `PainelPratica`/`PainelLeitura`.
- [x] `nome`/`introExpandidaInicialmente`/lista completa deixaram de ser
      obrigatórios nos dois componentes — só a variante "lista" precisa.
- [x] **Bug pego na limpeza**: os estados vazios ("nenhuma prática/página
      publicada ainda") em `app/praticas/page.tsx` e `app/livro-vivo/
      page.tsx` ainda usavam as classes CSS antigas (`.duasColunas`,
      `.painelLista`, `.titulo`) que acabaram de ser removidas — teriam
      quebrado o layout silenciosamente (TS não pega isso, classe CSS é
      só string). Corrigido pros mesmos nomes de classe da tela nova.
- [x] `AutoriaBiblioteca.tsx`: 3 strings que escaparam da varredura de
      maiúscula anterior ("escrito por"/"ver perfil de"/"conectar com")
      corrigidas.

## "Sobre este espaço" removido de todo o app (04/09/2026)

Pedido explícito: tirar o `IntroEspaco` (o gatilho colapsável "sobre este
espaço" que existia em Diário, Conversa, Práticas e Livro Vivo) de todas
as telas.

- [x] `<IntroEspaco>` removido de `app/diario/page.tsx`,
      `app/conversa/page.tsx`, `app/praticas/page.tsx`,
      `app/praticas/PainelPratica.tsx`, `app/livro-vivo/page.tsx`,
      `app/livro-vivo/PainelLeitura.tsx` — os 6 lugares reais onde
      renderizava (os `[id]/page.tsx` de Prática/Livro Vivo já não
      mostravam mais desde a reforma da jornada single-item).
- [x] Toda a cadeia de rastreio "já viu a intro" removida junto — não
      sobrava propósito nenhum sem o componente pra ler: computação de
      `primeiraEntrada`, o `UPDATE` que marcava
      `intro_{diario,conversa,praticas,livro_vivo}_vista_em`, e essas 4
      colunas saíram do `select` de cada página. As colunas em si **não**
      foram apagadas do banco (mudança de schema é mais permanente que o
      pedido — dado morto e inofensivo, não pediu pra isso).
- [x] `app/IntroEspaco.tsx`, `app/IntroEspaco.module.css` e
      `lib/introEspacos.ts` (dados das frases por espaço) apagados —
      ficaram 100% órfãos.
- [x] `.introAlinhamento` (CSS que só existia pra alinhar o `IntroEspaco`
      em `/conversa`) removida junto.

## Livro Vivo: título e filtro por momento (04/09/2026)

Pedido explícito: título do acervo igual ao mockup + os filtros de
momento/humor que já estavam pendentes desde a auditoria mockup vs.
código.

- [x] Título trocado de eyebrow "Livro Vivo" + itálico "Leituras para
      atravessar o dia." pra um único `<h1>Livro Vivo</h1>` em negrito reto
      (`.tituloSelecao`), igual ao mockup
      `docs/redesign/acervo_do_livro_vivo_atmosfera_quarto`.
- [x] Pílulas de filtro por momento — "Todos os momentos" + os 4 valores
      reais de `biblioteca.tags_momento_vida` ("Confuso", "Em paz",
      "Cansado", "Curioso"). Os rótulos poéticos do mockup do Stitch
      ("quando tudo parece confuso" etc.) eram só exemplo dele — a
      taxonomia usada é a mesma dos 4 valores já usados no check-in de
      humor da Home (`MoodTrigger.tsx`), sem "não sei". Nova
      `lib/momentosVida.ts` (mesmo padrão de `lib/categoriasPratica.ts`).
- [x] Filtro server-rendered via query string (`?momento=x`), mesmo padrão
      do filtro de categoria em Práticas — sem client component.
      `paginasFiltradas` (esconde de verdade quem não bate) é distinto e
      composto com a ordenação por momento do dia já existente da Fase 7
      (`ordenarPorMomento`/`tagDoMomento`, que só reprioriza, nunca
      esconde).
- [x] Estado vazio (`app/livro-vivo/page.tsx`) e `TelaSelecao`
      (`PainelLeitura.tsx`) mantidos em paridade — os dois têm título e
      filtros idênticos, mensagem vazia diferencia "nenhuma página nesse
      momento" de "nenhuma página publicada ainda".
- [x] Filtro de momento preservado ao entrar numa leitura e voltar —
      implementado, ver "Preservar filtro ativo ao voltar do detalhe"
      (04/09/2026) mais abaixo.

## Lente do dia: tela de leitura própria (04/09/2026)

Primeiro item da lista de "achados estruturais maiores" atacado — fluxo
"Ler" → leitura → contexto, igual aos mockups
`lente_do_dia_leitura_ambiente_claro` e `lente_do_dia_contexto_ambiente_claro`,
mesma decisão de foco single-item já usada em Práticas/Livro Vivo.

- [x] **Home**: card "Lente do dia" virou teaser clicável (`<a href="/lente-do-dia">`)
      — eyebrow + trecho da reflexão (140 char) + "Ler →". Antes mostrava
      reflexão+pergunta+derivação inteiras ali dentro.
- [x] **`/lente-do-dia`** (nova rota): reflexão completa + "Uma pergunta" +
      pergunta completa + rodapé com "Conversar sobre isso →" (real, igual
      antes) e "Entender de onde vem →". Botão "‹" flutuante volta pra
      Home — mesmo padrão de Práticas/Livro Vivo, sem `PageHeader`.
- [x] **`/lente-do-dia/contexto`** (nova rota): os 2 componentes reais da
      derivação (`derivationSummary.tomHoje`+`textoCuradoTom`,
      `seloHoje`+`textoCuradoSelo`) — o mesmo dado que antes só aparecia
      dentro do `<details>` "Entender de onde vem" da Home, agora como
      tela própria. **Não** foi usada a citação fabricada pelo Stitch no
      mockup ("A atenção é a forma mais rara..." — Simone Weil, sem campo
      real correspondente em `DerivationSummary`).
      Reações "gostei/não gostei" do mockup também não foram implementadas
      — não existe (nem foi pedido) mecanismo de reação real pra lente do
      dia; teria sido um botão decorativo sem função, mesma linha do "Começar"
      não fabricado no detalhe de Prática.
- [x] `dailyPresent === null` (motor Presente fora do ar/não configurado)
      redireciona ambas as rotas novas pra `/home` — mesmo fail-open que já
      existia (a Home simplesmente não mostra o teaser nesse caso).
- [x] **Bug achado no caminho**: `app/diario/page.tsx` ainda importava
      `IntroEspaco` e escrevia `intro_diario_vista_em`/`ultimo_destino` —
      ficou pra trás na limpeza de "'Sobre este espaço' removido de todo o
      app" (seção acima), só esse arquivo, os outros 5 já estavam limpos.
      Quebrava o typecheck (`Cannot find module '../IntroEspaco'`) —
      corrigido agora, mesmo padrão dos outros 5 arquivos.
- [x] **Bug achado testando local**: `lib/present.ts` acessava
      `caches.default` sem checar se existe — em `pnpm dev` (Next.js puro,
      sem o adapter do OpenNext) essa API não existe (só existe no runtime
      real dos Workers), então `buscarLenteGenerica` sempre lançava
      `ReferenceError: caches is not defined`, silenciado pelo próprio
      catch — a Lente do dia nunca aparecia em dev local, sem nenhum erro
      visível na tela, mesmo antes desta rodada de mudanças. Corrigido com
      `typeof caches !== "undefined"` — sem cache em dev (dado sempre
      fresco), comportamento de produção real inalterado.
- [x] **Fidelidade de cor**: cards "Lente do dia" e "Do seu terapeuta"
      saíam com fundo quase branco (`var(--bg-elevated)`, `#fffdf9` —
      pensado pros cards neutros do resto do app) — no mockup
      (`home_presen_a_cones_svgs_inline_refinados`) cada um tem um tom
      próprio e visivelmente mais saturado que o fundo da página:
      `#fcebdc` (pêssego) pra Lente, `#e2d9cf` (greige) pra Terapeuta.
      Corrigido pros valores reais do mockup.
- [x] **Fidelidade de estrutura**: botão "Ler" virou pílula preenchida
      escura (`#271700` fundo / `#fff8f0` texto, igual ao mockup — cor
      distinta da pílula âmbar usada em "Guardar"/"Iniciar" no resto do
      app), com divisor acima separando do texto — antes era só um link
      sublinhado "Ler →" sem destaque visual.
- [x] **Reação Gostei/Não gostei** — pedido explícito do Guilherme, ao
      contrário da decisão inicial de não implementar (não existia
      mecanismo real). Nova tabela `lente_reacoes` (migration
      `20260904180000_lente_reacoes.sql`, **precisa ser aplicada**): uma
      linha por pessoa por dia civil (mesma data de `lib/present.ts:
      dataCivilHoje()`, extraída pra reuso). `app/lente-do-dia/actions.ts`:
      `reagirLente()` — clicar de novo na mesma reação desfaz (upsert vira
      delete). Sem JS: 2 `<form>` com server action `.bind()`, mesmo padrão
      zero-client-JS já usado em `adiarNascimento`/`registrarPresenca`.
- [x] "Conversar sobre isso" e "Entender de onde vem" viraram pílulas com
      borda (`.pill`, mesma classe da reação) — antes eram links
      sublinhados soltos, sem destaque visual pedido.
- [x] **Ajuste fino, pedido em seguida**: pílulas Gostei/Não Gostei
      ganharam ícone de coração (`IconeCoracao.tsx`/`IconeCoracaoCortado.tsx`,
      mesmo traço único dos outros ícones inline, cor herdada da pílula via
      `currentColor`) + "Não Gostei" com as duas palavras maiúsculas +
      divisor entre os dois grupos de pílula removido (pedido explícito,
      ficava redundante com o espaçamento já existente).

## Botão de voltar padronizado em toda a barra de topo (04/09/2026)

Pedido explícito, com referência visual (`docs/redesign/
biblioteca_de_pr_ticas_imersiva_e_padronizada`): substituir o monograma
"p." + link de texto "voltar" (que existia com rótulo diferente em cada
tela — "← voltar", "← Voltar", "‹ Perfil", "‹"...) por uma barra única:
seta + título centralizado — igual ao mockup de referência.

- [x] Novo ícone `IconeSetaEsquerda.tsx` — usado tanto na barra
      (`PageHeader.tsx`) quanto nos botões flutuantes de detalhe
      (Práticas/Livro Vivo/Lente do dia), substituindo o caractere "‹"
      solto que existia lá — um ícone só em todo lugar que significa
      "voltar", em vez de dois estilos diferentes.
- [x] `PageHeader.tsx`: prop nova `titulo: string` (obrigatória),
      renderizada como `<h1>` centralizado entre a seta e o espaçador. Prop
      `voltar` perdeu o campo `label` (não tem mais texto pra mostrar, só
      `href`). `VoltarLink.tsx` virou ícone-only (`aria-label="Voltar"`
      fixo) — mantida a lógica de esconder o link dentro do app nativo
      quando o destino é "/" (área deslogada, só-web); some de vez nesse
      caso (não precisa mais de espaço reservado, ver item abaixo sobre
      centralização).
- [x] Título de cada tela decidido caso a caso, não um valor genérico:
      onde já existia um eyebrow ou `<h1>` que era só o nome da seção
      ("Diário", "Livro Vivo", "Práticas", "Privacidade e Limites de
      Cuidado", "Entrar") esse texto **subiu pra barra e foi removido de
      baixo** (evita duplicar a mesma palavra duas vezes na tela). Onde o
      conteúdo existente é distinto (a pergunta "Como foi seu dia?", o
      nome da pessoa, "Você não está sozinho agora." etc.), a barra ganhou
      só um rótulo curto de navegação ("Fechamento do dia", "Perfil",
      "Recursos"...) e o conteúdo emocional da tela **não foi tocado**,
      convivendo com o título da barra sem duplicar.
- [x] **Correção de semântica**: como a barra agora tem seu próprio
      `<h1>`, os headlines de página que continuaram existindo por baixo
      (Diário, Práticas, Fechamento, Terapia, Recursos, Autor, Perfil,
      Conta, Chegada, Nascimento) viraram `<h2>` — mesmo estilo visual
      (classe CSS inalterada), só a tag semântica, pra não sobrar duas
      seções de nível 1 na mesma página.
- [x] 17 arquivos com `<PageHeader>` atualizados (todos com `titulo`
      agora), verificado por varredura — nenhum ficou pra trás.
      `.monogramaLink`/`.monograma` (CSS) e o import de `MonogramaP`
      removidos de `PageHeader.tsx` (o monograma em si continua existindo
      como componente — a Home usa a própria versão dele, não afetada).
      6 regras `.eyebrow` órfãs removidas (Diário, Práticas ×2, Fechamento,
      Terapia, Perfil) e `.tituloSelecao` órfã removida do Livro Vivo.
- [x] **Ajuste fino, pedido em seguida**: o Guilherme reparou que cada
      lugar tinha um tratamento visual diferente pra seta — sem círculo na
      barra (`PageHeader`), círculos com cores diferentes nos botões
      flutuantes de detalhe (translúcido claro em Práticas/Lente do dia,
      translúcido escuro no Livro Vivo), quase invisível sobre fundo claro
      próximo da própria cor do fundo. Padronizado: círculo branco sólido
      + sombra sutil + ícone escuro fixo (`#2a2118`, não mais
      `var(--text)`/`currentColor` dependente de ambiente) — idêntico nos
      4 lugares (barra + 3 botões flutuantes), sempre no mesmo offset do
      canto (`top/left: clamp(16px,3vh/vw,28px)`), visível em qualquer
      fundo (claro, escuro, foto, gradiente âmbar). A seta da barra também
      virou `position: fixed` (era só um item flex) — mesma técnica de
      posicionamento dos botões flutuantes, o que também permitiu
      centralizar o título de verdade via `left: 50%` (igual à correção
      da wordmark da Home) em vez de depender de um espaçador do lado
      oposto pra balancear — espaçador removido, ficou mais simples.
- [x] Typecheck limpo e varredura de classes CSS órfãs em todo o app —
      nada além dos 2 órfãos pré-existentes e não relacionados
      (`navItemDesabilitado` na Home, achado antes desta sessão; classes
      do site de marketing em `Precos.module.css`).

## Fechamento do dia vira modal na Home (04/09/2026)

Achado antes de mexer no visual: `/fechamento` (P6) **não tinha nenhum
link de entrada em lugar nenhum do app** — só alcançável digitando a URL
direto. O link "Como foi seu dia? →" que dava acesso a essa tela sumiu da
Home na limpeza de leftovers (seção "Check-in vira modal..." acima,
03/09/2026), sem que isso fosse percebido como o único caminho de entrada
da funcionalidade. Perguntado ao Guilherme onde deveria ficar o link de
entrada antes de mexer no resto — confirmado: mesmo lugar de antes
(próximo à saudação/Lente do dia).

- [x] **Link restaurado na Home** — mesmo texto de antes ("Como foi seu
      dia? →"), agora abrindo um modal em vez de navegar
      (`app/home/FechamentoTrigger.tsx`).
- [x] **Divergência de arquitetura corrigida**: mockup
      (`modal_de_fechamento_do_dia_corrigido`) mostra modal escuro
      sobreposto à tela, não uma página cheia própria. Mesmo padrão já
      estabelecido pro `MoodTrigger.tsx` (gatilho + card centralizado,
      **não** bottom sheet — conferido no código: `.moodSheet` já é um
      card com cantos redondos nos 4 lados, sem alça de arrastar, mesmo
      tratamento do modal de nascimento em `/chegada`) — a nota de uma
      rodada anterior desta sessão que descrevia esses dois como "bottom
      sheet" estava incorreta, corrigido lendo o CSS real.
- [x] `data-ambiente="escuro"` aplicado só no card do modal (escopo
      local, via atributo no elemento — não no `AmbienteShell`, que a
      Home não usa) — o mockup pede especificamente um cartão escuro
      mesmo com o resto da Home clara (fechar o dia é mais quieto/noturno
      que o resto). Todas as cores do cartão usam `var(--bg-elevated)`/
      `var(--text)`/`var(--border)`/`var(--accent)` etc., que resolvem pro
      conjunto escuro só por causa do atributo — sem hex novo duplicado.
- [x] Conteúdo real reaproveitado de `FechamentoForm.tsx` (agora apagado):
      as mesmas 3 respostas rápidas (toggle single-select) + campo de
      texto livre opcional + `salvarFechamento()` (server action
      inalterada, só o comentário sobre navegação foi corrigido). **Não**
      foram fabricados os 2 botões distintos do mockup ("Enviar" e "Salvar
      e enviar") — não existe diferença real de comportamento entre eles
      no backend, então ficou só um CTA ("Guardar", rótulo já
      estabelecido) + "Agora não" (fecha o modal, não navega mais pra
      `/home` porque já está nela).
- [x] Rota `/fechamento` apagada (`page.tsx`, `page.module.css`,
      `FechamentoForm.tsx`) — `actions.ts` mantido (reaproveitado direto
      pelo componente novo). Comentário desatualizado em
      `app/diario/page.tsx` (ainda dizia "tela própria (/fechamento)")
      corrigido.
- [x] Typecheck limpo (inclusive depois de limpar `.next/types` — o
      validador de rotas do Next ficou com uma referência travada à rota
      apagada até regenerar) e varredura de CSS órfã sem novidade.
- [x] **Regra de exibição, pedida em seguida**: o convite só aparece a
      partir da segunda visita do dia (comparando `profiles.
      ultima_visita_em` — ainda a visita anterior no momento da leitura,
      o UPDATE que grava a atual só roda no fim da função — contra o
      início do dia civil em America/Sao_Paulo) **ou** depois das 18h
      (o que vier primeiro), e some de vez assim que a pessoa preenche
      (consulta a `caderno_entradas` por `tipo = 'fechamento_dia'` criado
      hoje, não só "abriu o modal nesta visita"). Helpers novos em
      `app/home/page.tsx`: `inicioDoDiaSaoPauloISO()`/`horaAtualSaoPaulo()`
      — fuso fixo -03:00 (Brasil não usa horário de verão desde 2019).
- [x] **Contraste do modal, pedido em seguida**: fundo do cartão trocado
      de `var(--bg-elevated)` (escuro, mas translúcido a 50% — pensado pra
      ficar sobre uma cena já escura, aqui por baixo é a Home clara e
      lavava o card) pra `var(--bg)` (sólido, mais escuro). Pílulas e
      campo de texto passaram a usar `var(--bg-elevated)` (antes usavam
      `var(--bg)`, a mesma cor do fundo do card de antes) — cria contraste
      contra o card mais escuro, em vez de repetir a mesma cor.

## Terapia (conectado): foto, compartilhamento por categoria e desconectar (04/09/2026)

Antes de implementar, achado que mudou o escopo: os 2 toggles de
compartilhamento e o botão "desconectar" do mockup
(`terapia_conectado_controles_padronizados`, a versão corrigida — a outra,
`terapia_conectado`, tem os 2 toggles com estilos inconsistentes entre si)
**não tinham mecanismo real nenhum** — só existia compartilhamento por
entrada individual do Diário (`caderno_entradas.compartilhar`, Fase 2,
marcado na hora de escrever), e nenhuma function que deixasse o paciente
encerrar o próprio vínculo (só `conectar_profissional`, Fase 4). Perguntado
ao Guilherme se implementava de verdade (schema novo) ou só o resto da
tela — confirmado: implementar os dois de verdade.

- [x] **Migration** `20260904192000_terapia_conectado_controles.sql`:
      2 colunas novas em `vinculos` (`compartilhar_praticas`,
      `compartilhar_livro_vivo`, default `false`) + 3 functions
      `security definer` (mesmo padrão de `conectar_profissional`, Fase 4
      — escrita em `vinculos` sempre mediada por function, nunca UPDATE
      direto do cliente): `definir_compartilhar_praticas(boolean)`,
      `definir_compartilhar_livro_vivo(boolean)` (uma function por
      categoria, não uma só recebendo os 2 valores — evita que dois
      toggles clicados em sequência rápida se sobrescrevam por causa de
      round-trips fora de ordem) e `desconectar_terapeuta()` (soft delete:
      `vinculos.ativo = false`, linha continua existindo; também limpa
      `profiles.profissional_id`, espelhando o que `conectar_profissional`
      faz ao conectar).
- [x] **`guardarPratica`/`guardarLeitura`** (`app/praticas/[id]/actions.ts`,
      `app/livro-vivo/[id]/actions.ts`) passaram a consultar a preferência
      do vínculo ativo e gravar `compartilhar` de acordo, no momento de
      guardar — antes disso, prática/Livro Vivo guardados nunca eram
      compartilhados com o terapeuta, com toggle ou sem. O lado do Cuida
      (`apps/cuida/app/pacientes/[id]/page.tsx`) já lê `compartilhar = true`
      de forma genérica (todo `autor_tipo = 'usuario'`) — não precisou
      mudar nada lá.
- [x] **`app/terapia/CompartilhamentoToggle.tsx`** (novo, client) — switch
      próprio (sem lib), otimista no clique, cada categoria chama a
      própria server action. **`app/terapia/DesconectarBotao.tsx`** (novo,
      client) — confirmação inline antes de agir (ação difícil de
      reverter: precisa de novo código de convite pra reconectar), nunca
      um `confirm()` nativo do navegador.
- [x] Foto do terapeuta continua placeholder (`PLACEHOLDER_TERAPEUTA`,
      mesmo padrão já usado em "Do seu terapeuta" na Home — não existe
      coluna de foto em `profissionais`, e inventar uma imagem genérica
      seria pior que não ter nenhuma). "conectado(a) desde [data]" é dado
      real (`vinculos.created_at`).
- [x] Texto do aviso de privacidade ("Conversas específicas e reflexões
      profundas são compartilhadas individualmente após cada sessão...")
      reaproveitado do mockup — é só copy explicativa sobre a dinâmica
      humana da relação (não promete nenhum botão/funcionalidade que não
      existe), e descreve corretamente como o sistema já funciona
      (entradas do Diário ficam privadas por padrão, só aparecem pro
      profissional com `compartilhar = true` explícito).
- [x] **Bug cometido e corrigido no processo**: usei Write pra criar
      `app/terapia/actions.ts` sem ler o arquivo antes — como ele já
      existia (com `conectarProfissional`, usado por `ConectarForm.tsx`),
      isso apagou essa função sem querer. Percebido no typecheck seguinte
      (erro de import quebrado), corrigido juntando as duas versões no
      mesmo arquivo.
- [x] Typecheck limpo e varredura de CSS órfã em todo o app sem novidade.

## Padrão de pílula preenchida vira âmbar, não preto (04/09/2026)

Pedido explícito depois de ver renderizado: pílula preenchida "Ler" (card
da Lente do dia) usava preto (`#271700`, cor literal do mockup
`bg-primary`) — decisão de padronizar pra cor da paleta (âmbar,
`var(--accent-strong)`/`var(--cta-text)`), mesma combinação já usada em
"Guardar"/"Iniciar"/etc no resto do app. Preto fica reservado pra fora
desse padrão (não é mais usado em nenhuma pílula preenchida da Home).

- [x] `.lenteCta` ("Ler", Lente do dia): `#271700`/`#fff8f0` → `var(--accent-strong)`/`var(--cta-text)`.
- [x] "Como foi seu dia? →" (`.fechamentoConvite`) virou pílula de contorno
      (borda + texto âmbar, sem preenchimento) — antes era só um link
      sublinhado solto. Contorno em vez de preenchida de propósito: mantém
      o tom de convite ocasional/discreto, diferente da pílula preenchida
      "Ler" (CTA principal do card acima dela).

## Terapia (sem conexão): card Dinâmica da conexão (04/09/2026)

Mockup `terapia_sem_conex_o_texto_corrigido` — card "Dinâmica da Conexão"
com 2 itens (ícone + título + texto) explicando o que muda ao conectar,
antes da pessoa digitar o código. Verificado antes de escrever a copy:
os 2 itens descrevem funcionalidade real, não foram inventados.

- [x] **"Acompanhamento contínuo"** — o terapeuta sugerir práticas e
      escrever anotações direto no Diário já é real
      (`apps/cuida/app/pacientes/[id]/EntradaForm.tsx`).
- [x] **"Canal de apoio"** — "avisar quando precisar de apoio" é o botão
      `avisarProfissional` já real em `app/recursos/page.tsx` (insere em
      `alertas_risco`, mesma tabela do protocolo de risco automático, só
      que disparado manualmente pela pessoa).
- [x] Ícones reaproveitados (`IconeDiario`/`IconeConversa`, os mesmos do
      BottomNav) em vez de criar 2 ícones novos — a nota no Diário e o
      canal de apoio já tinham ícone estabelecido no resto do app.
- [x] Card inserido entre o texto de intro e o formulário de código
      (`ConectarForm.tsx` não foi dividido — o card fica antes dele
      inteiro, não entre o campo e o checkbox de consentimento como no
      mockup, pra não quebrar o `<form>` em dois pedaços).
- [x] Typecheck limpo e varredura de CSS órfã sem novidade.

## Página do Autor: cards de "mais obras" corrigidos (04/09/2026)

`app/autor/[id]/page.tsx` tinha herdado o padrão de card "foto-cheia com
overlay em gradiente" (o mesmo da Home/grades de Práticas e Livro Vivo) —
mockup (`p_gina_do_autor_alice_guimar_es`) usa um card diferente: foto só
na metade de cima, corpo sólido embaixo com selo de categoria + título +
descrição.

- [x] Card reescrito: `.cardImagem` (foto, altura fixa, sem gradiente/texto
      por cima) + `.cardCorpo` (fundo sólido `var(--bg-elevated)`) com
      `.cardBadge` (pílula escura pequena) + título + descrição.
- [x] Selo de categoria mantido nos rótulos reais já usados no resto do
      app ("Prática"/"Livro Vivo") — **não** foi copiado o rótulo
      "ENSAIO" do mockup (Stitch inventou essa categoria; a taxonomia real
      de `biblioteca.tipo` só tem 'pratica'/'pagina_livro_vivo', mesma
      lógica de não copiar os rótulos poéticos do filtro do Livro Vivo).
- [x] Query de `obras` ganhou a coluna `conteudo` (só tinha `id, tipo,
      titulo` antes) — precisava pra montar a descrição de cada card
      (`trecho()`, mesmo helper de app/home/page.tsx).
- [x] Typecheck limpo e varredura de CSS órfã sem novidade.

## Conversa: pílula única, hover no guardar, cores das bolhas (04/09/2026)

Mockup `conversa_fluxo_de_leitura` — 3 divergências confirmadas contra o
código real antes de mexer.

- [x] **Input em pílula única**: antes eram 2 elementos lado a lado
      (`.textarea` com fundo/borda/sombra próprios + botão "Enviar" com
      pílula âmbar própria). Agora o fundo/borda/sombra moram só em
      `.form` (a pílula em si); `.textarea` fica transparente por dentro;
      o botão virou um círculo com ícone de seta (`.enviarBotao`, classe
      nova — **não** reaproveitei `.cta`, que essa mesma tela usa também
      pro link "ver recursos" em `CardTransicaoRisco`, contextos
      diferentes).
- [x] **"Guardar no diário" só no hover** — mas só em telas com mouse de
      verdade (`@media (hover: hover)`): sem essa checagem, esconder por
      padrão tornaria o botão inalcançável no celular (não existe hover
      antes do toque), que é o uso principal do app. Continua sempre
      visível em touch devices — desvio deliberado do mockup (que é uma
      captura desktop), documentado no CSS.
- [x] **Cores das bolhas corrigidas**: mockup tem a bolha do usuário mais
      CLARA que a do assistente (quase branca) e as duas com borda visível
      — o código tinha o oposto (usuário mais escuro/saturado, sem borda
      nenhuma). Ajustado: assistente `#fcf2e8` (igual já estava), usuário
      `#fff8f3` com borda sutil (`rgba(224, 211, 188, 0.5)`, era sólido
      sem borda antes).
- [x] Typecheck limpo e varredura de CSS órfã sem novidade.

## Fechamento da conversa: 3 ações reais (04/09/2026)

Mockup `fechamento_da_conversa_momento_de_pausa` — "Guardar no Diário" /
"Enviar resumo para [nome]" / "Ignorar". Antes era 1 botão "Encerrar por
hoje" + checkbox "compartilhar" + "ainda quero continuar" — mesma
capacidade real por baixo, só reorganizada em ações explícitas.

- [x] **Decisão de escopo registrada**: as 2 primeiras ações continuam
      operando sobre a mesma "uma palavra" digitada à mão (não um resumo
      automático da conversa) — não existe geração de resumo (P7,
      "memória do Presença", ainda não implementada). "Guardar no Diário"
      e "Enviar resumo pro terapeuta" já eram, no fundo, a mesma escrita
      em `caderno_entradas` variando só o `compartilhar` (`true`/`false`)
      — a mudança foi separar isso em 2 botões explícitos em vez de 1
      botão + checkbox.
- [x] "Enviar resumo para [nome]" agora usa o nome real do profissional
      (antes só existia `temProfissional: boolean`, sem nome) —
      `app/conversa/page.tsx` passou a buscar `profissionais.nome`,
      encadeado até `TelaFechamento` via `ConversaExperiencia`.
- [x] "Ignorar" novo — ação explícita que não salva nada e volta pra Home
      (antes só existia implicitamente: clicar em "encerrar" com o campo
      vazio).
- [x] "Ainda quero continuar" (voltar pro chat sem fechar) mantido — não
      está nas 3 ações do mockup, mas é funcionalidade real adicional,
      não foi removida.
- [x] `.cta` (botão preenchido, também usado no link "ver recursos" de
      `CardTransicaoRisco`) virou `width:100%` — antes só tinha largura de
      conteúdo, ficava inconsistente ao lado de `.ctaContornado` (que já
      era full-width) quando empilhados. `.fechamentoCompartilhar` (CSS do
      checkbox removido) ficou órfã, removida.
- [x] Typecheck limpo e varredura de CSS órfã sem novidade.

## Prática ativa: avaliado, sem mudança de código (04/09/2026)

- [x] **"Instrução textual"** — já coberto por `FolegoInline.tsx` (contador
      de fases 4·7·8 + círculo animado sincronizado), construído numa fase
      anterior desta sessão. Decisão: não empobrecer isso pra bater com o
      mockup, que é bem mais minimalista (só logo pulsando + 1 linha, "sem
      contadores") — o que já existe é mais informativo sem perder a
      atmosfera contemplativa.
- [ ] **"Mídia imersiva"** (vídeo/áudio de fundo, player com tempo
      decorrido) — continua **bloqueado**: não existe nenhum arquivo de
      áudio/vídeo de prática guiada no sistema, nem coluna pra isso em
      `biblioteca`. Não dá pra fabricar conteúdo de prática guiada.

## Biblioteca de Práticas: card maior + ícone por categoria (04/09/2026)

Mockup `biblioteca_de_pr_ticas_imersiva_e_padronizada` — últimos 2 ajustes
pendentes desse mockup (CTA e filtro escuro já tinham sido feitos numa
rodada anterior).

- [x] Card da grade: `min-height` 220px → 400px (`.cardFoto`/
      `.cardFotoOverlay`), igual à proporção do mockup.
- [x] Novo `app/praticas/IconeCategoria.tsx` — um ícone por categoria real
      (`respiracao`/`meditacao`/`movimento`/`sono`, mesmas 4 de
      `CATEGORIAS_PRATICA`) no eyebrow de cada card, ao lado do rótulo.
      As 4 categorias do mockup batem exatamente com a taxonomia real —
      nenhuma inventada.
- [x] Duração ("5 MIN" no mockup) continua de fora, decisão já registrada
      antes: não existe campo de duração em `biblioteca`, não fabricado.
- [x] Typecheck limpo e varredura de CSS órfã sem novidade.

## Recursos: paleta terracota migrada pra âmbar (04/09/2026)

`.eyebrow`/`.recurso`/`.recursoNome`/`.recursoDescricao`/`.recursoIcone`
usavam uma paleta terracota (`#b8552f`, `#c9542c` etc.) vinda de um
documento anterior a este redesign (comentário no próprio CSS já
apontava isso como órfão). Comparado contra o mockup real desta fase
(`recursos_apoio_e_cuidado`): usa a mesma paleta âmbar/parchment do resto
do app — migrado.

- [x] Cores trocadas pra tokens (`var(--accent)`/`var(--text)`/
      `var(--text-muted)`/`var(--border)`) e pro pêssego `#fcebdc` já
      estabelecido (mesmo tom do card "Lente do dia" da Home) — não um
      hex novo.
- [x] **Bug achado no caminho**: `.recursoIcone` era um `<span>` vazio só
      com fundo colorido (`background: #c9542c`, nenhum ícone de verdade
      dentro) — virou um círculo escuro com ícone real (telefone pro
      CVV, cruz pro SAMU), em vez de uma bolinha decorativa sem função.
- [x] Typecheck limpo e varredura de CSS órfã sem novidade.

## Conta: card com Google SSO primeiro (04/09/2026)

Mockup `criar_conta_continuidade_do_cuidado` — Google SSO **já era real**
(`ContaForm.tsx` usa `supabase.auth.linkIdentity({ provider: "google" })`,
preserva a sessão anônima atual em vez de criar conta nova), só estava na
ordem errada (depois do e-mail/senha) e sem o embrulho de card — pura
reestruturação visual, nenhuma funcionalidade nova.

- [x] Ordem invertida: "Continuar com o Google" primeiro, depois "ou",
      depois e-mail/senha — igual ao mockup.
- [x] Tudo embrulhado num `.card` novo (`var(--bg-elevated)` + borda,
      cantos arredondados) — antes os campos ficavam soltos direto no
      fundo da página.
- [x] Botão do Google ganhou o ícone real da marca (SVG multicolor
      padrão) + virou branco/`--bg-elevated` com borda (igual ao mockup),
      em vez do outline neutro genérico de antes. `.ctaSecundario`
      renomeado pra `.ctaGoogle` (órfão removido).
- [x] Reaproveitado também por `app/terapia/page.tsx` (branch
      `is_anonymous`, mesmo `<ContaForm>`) — ganha o card ali também, de
      graça, por ser o mesmo componente.
- [x] Typecheck limpo e varredura de CSS órfã sem novidade.

## Preservar filtro ativo ao voltar do detalhe (04/09/2026)

Lacuna cosmética conhecida desde a reforma "Jornada de Prática/Livro Vivo"
(04/09/2026, acima): entrar numa leitura/prática a partir da grade
filtrada e voltar perdia o filtro (link de voltar sempre ia pra rota base,
sem query string). Corrigido nos dois — Livro Vivo (momento) era o pedido
original; Práticas (categoria) tem a mesma lacuna registrada no tracker,
resolvida junto por consistência (mesmo padrão, esforço pequeno).

- [x] **Livro Vivo**: `momentoValido()` (antes só definida localmente em
      `app/livro-vivo/page.tsx`) virou export de `lib/momentosVida.ts`,
      reaproveitado por `app/livro-vivo/[id]/page.tsx` também. Cards da
      grade (`TelaSelecao`) linkam com `?momento=x` quando há filtro
      ativo; `TelaDetalhe` recebe `momentoAtivo` e monta o link de voltar
      com o mesmo query string.
- [x] **Práticas**: mesmo padrão, mas sem validar o valor contra
      `CATEGORIAS_PRATICA` — `app/praticas/page.tsx` (a rota base) já não
      validava antes, mantido o mesmo grau de confiança por consistência
      (um valor inválido só faz o link de volta cair numa categoria
      vazia, não quebra nada). `rotaDePratica()` não foi alterada (é
      reaproveitada pela Home, sem conceito de filtro) — o query string é
      montado inline no card em vez de dentro da função.
- [x] Em ambos, a prática/leitura em si nunca é filtrada pelo parâmetro —
      ele só existe pra reconstruir o link de volta.
- [x] Typecheck limpo e varredura de CSS órfã sem novidade.

## Processo

- [x] Trabalho da sessão organizado em 9 commits temáticos na branch
      `redesign/visual-contemplative-warmth` (fundação, Home, Práticas,
      Livro Vivo/autor, Diário/pergunta, Privacidade, Cuida, docs,
      indicação estruturada). Nada em aberto sem commit.
- [x] `20260902120000_biblioteca_categoria_pratica.sql` e
      `20260902123000_profissionais_leitura_publica.sql` aplicadas
      (confirmado pelo Guilherme).
- [x] `20260904180000_lente_reacoes.sql` (tabela `lente_reacoes`, pro
      Gostei/Não Gostei da Lente do dia) aplicada (confirmado pelo
      Guilherme).
- [x] `20260904192000_terapia_conectado_controles.sql` (colunas
      `compartilhar_praticas`/`compartilhar_livro_vivo` em `vinculos` +
      functions `definir_compartilhar_praticas`/
      `definir_compartilhar_livro_vivo`/`desconectar_terapeuta`) aplicada
      (confirmado pelo Guilherme).
- [ ] Branch ainda não teve PR aberto nem foi mergeada — só local.
