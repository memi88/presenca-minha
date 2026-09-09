# Presença — Extensão: App Mobile (iOS/Android)

> Documento complementar ao `presenca-prd.md`, `presenca-ia-arquitetura.md` e `presenca-voz-de-marca.md`. Registra decisões tomadas em conversa entre Guilherme e Claude sobre transformar o Presença (hoje PWA) em app nativo/publicado nas lojas. **Escopo: só o Presença.** O Cuida continua sendo web (`cuida.presenca.app`), sem mudança nenhuma aqui.

---

## 0. Por que essa extensão existe

O Presença hoje é PWA. A hipótese é que ter presença nas lojas (App Store / Google Play) ajuda divulgação e usabilidade — ícone na tela, push, sensação de "app de verdade". Esta extensão não muda o produto em si; muda a casca de distribuição e adiciona uma capacidade nova (push) que precisa de uma exceção de princípio explícita.

---

## 1. Decisão técnica: Capacitor, não rewrite nativo

**Decidido:** empacotar o Next.js/PWA existente com **Capacitor**, não reescrever em React Native/Expo.

Razão: reaproveita a base de código quase inteira (o Presença já é web), evita manter dois codebases paralelos (hoje já são dois apps — Presença e Cuida — três seria demais pra manutenção solo), e entrega o essencial que se busca (ícone, splash, push, sem barra de navegador) num prazo de semanas, não meses.

**Trade-off consciente:** por baixo, continua sendo WebView — não ganha performance nativa nem transições nativas de verdade. Aceitável neste estágio; um rewrite nativo fica como opção a reconsiderar só se/quando o volume de usuários justificar o investimento.

---

## 2. Modelo de pagamento e acesso — decidido

**O app nunca processa nem exibe pagamento.** Toda assinatura (individual ou, no futuro, qualquer cobrança) acontece exclusivamente no site, fora da loja, via Asaas/PIX como já planejado. O app apenas verifica o status de acesso vinculado à conta (`profiles.id`) e libera ou bloqueia a experiência com base nisso.

Isso evita por completo a questão de comissão de loja (Apple/Google cobrando 15–30% em compra dentro do app) porque nenhuma transação acontece dentro do app — modelo já usado por várias categorias de apps de assinatura via web.

### Implicações técnicas
- Precisa existir uma tela de "acesso" dentro do app para quem ainda não é assinante — mas essa tela **não pode conter botão de pagamento nem menção a preço específico dentro do app** (lado mais seguro frente às regras de loja). Ela só linka para abrir o navegador e ir ao site.
- Login já compartilhado (Supabase) entre web e app — a checagem de assinatura precisa reconhecer a mesma conta em ambos, sem re-perguntar nada a quem já assina.
- **Pendente de decisão** (já registrado como pendência no documento de modelo de negócio): o que acontece com quem não assina nem contribui após o trial — esse comportamento agora também precisa valer igual no app, não só na web.

---

## 3. Push notifications — exceção nomeada ao pilar 5

**Decisão:** o app mobile terá push notifications. Isso é uma mudança de princípio, não um detalhe técnico — o pilar 5 do documento de voz diz que "o Presença não disputa atenção" e "nunca cria dependência". Push é adicionado como **exceção estreita e explicitamente nomeada**, não como mecanismo geral de reengajamento.

### Texto de emenda ao pilar 5 (para colar em `presenca-voz-de-marca.md`, seção 2, item 5)

> *Notificações push existem como exceção estreita e nomeada, nunca como mecanismo geral de reengajamento: só quando algo que a própria pessoa já registrou passa a fazer sentido com algo novo (a IA percebendo conexões no Caderno), nunca como lembrete de retorno, nunca como convite genérico a abrir o app, nunca com linguagem de urgência ou perda.*

### Escopo decidido: só um gatilho vira push

De todos os gatilhos de notificação que já existem no app (hoje todos in-app banner), **só "a IA percebe conexões" (Caderno) vira push notification real.** Os demais continuam só como banner dentro do app:

| Gatilho | Vira push? |
|---|---|
| IA percebe conexão no Caderno (pergunta do profissional ou entrada `revisitar` ressoando com algo novo) | **Sim** — único caso |
| Pergunta em aberto do profissional (aviso de que algo novo chegou) | Não — só in-app |
| Convite de conversão de conta / nascimento | Não — só in-app |

Razão da escolha: é o único gatilho hoje desenhado desde a origem como convite gentil ("isso parece conversar com..."), nunca como tarefa ou cobrança — o mais alinhado ao espírito do pilar 5. Os demais ficam fora por ora; podem ser revisitados depois com dado real de uso, não por princípio fechado contra eles para sempre.

### Frequência

**Decidido: sem número fixo por enquanto.** Não define um teto explícito ("máximo 1x/dia") no lançamento — calibra com uso real do piloto. Isso é uma decisão temporária, não um vácuo — revisitar depois que houver dado de uso real do gatilho (hoje ele já é raro por natureza, pois depende de match semântico real entre entradas).

---

## 4. Riscos identificados (para o Guilherme ter em mente, não bloqueadores)

- **Regras de loja variam por região.** As liberações de pagamento externo dentro do app nos EUA (por decisão judicial Epic v. Apple/Google) não se aplicam automaticamente ao Brasil — mas como o modelo aqui é "pagamento sempre fora do app", isso não afeta o Presença de qualquer forma. Vale confirmar isso continua valendo se o app for publicado também nos EUA/outros países no futuro.
- **Sign in with Apple:** como o app já oferece login Google, a diretriz 4.8 da Apple normalmente exige oferecer também "Sign in with Apple" como alternativa — item novo de implementação, não coberto ainda.
- **Links de convite (pré-cadastro de paciente):** hoje é link web. No app, precisa virar Universal Links (iOS) / App Links (Android), com domínio verificado dos dois lados e fallback decente pra quem abre sem o app instalado.
- **Revisão de loja para apps de saúde mental:** costuma ter revisão humana mais cuidadosa (classificação etária, política de privacidade visível antes do login). Não é bloqueador, mas pode gerar perguntas manuais do revisor.
- **Deploy deixa de ser instantâneo** para mudanças que tocam o shell nativo (ícone, permissões, configuração de push) — essas passam por revisão de loja (horas a dias). Mudanças de conteúdo/UI dentro do WebView continuam rápidas.

---

## 4.1. Escopo: o que é app, o que continua só web

Decidido em sessão de implementação (28/08/2026), depois de ver na prática que o app estava abrindo a home de marketing dentro do WebView:

- **Só web, sempre:** `cuida.presenca.app` inteiro, e a "área deslogada" do `presenca.app` — home de marketing, `/para-voce`, `/para-terapeutas`, páginas de funcionalidade (`/para-voce/conversa` etc.), preços. Ninguém vê isso dentro do app nativo.
- **App:** a partir do momento em que a pessoa quer entrar no sistema (criar conta ou logar) e usar o Presença de verdade. Continua também disponível no navegador — o app não é um canal exclusivo, é um canal a mais.

**Implicação técnica (revisada — ver também §7):** `capacitor.config.ts` mantém `server.url` só na origem (`https://presenca.app`, sem path) — colocar `/bem-vindo` ali quebrava a navegação interna do app (ver §7). A entrada em `/bem-vindo` acontece via `appendUserAgent: "PresencaApp"`: a home de marketing (`app/(marketing)/page.tsx`) detecta esse marcador no header `user-agent` e redireciona sozinha pra `/bem-vindo` quando não há sessão. `/bem-vindo` já redireciona pra `/home` quando a sessão existe (mesmo padrão de `/login`).

**Resolvido:** `/bem-vindo` e `/login` tinham um link "‹ voltar" apontando pra `/` (marketing) — `VoltarLink.tsx` agora esconde esse link quando `Capacitor.isNativePlatform()` e o destino é `/`.

---

## 5. Fora de escopo desta extensão (explícito)

- Qualquer mudança no Cuida — continua só web.
- Rewrite nativo (React Native/Expo) — não é o plano agora.
- Teto numérico de frequência de push — decidido calibrar depois, não travar agora.
- Push para os gatilhos além de "IA percebe conexões" — não descartado para sempre, só fora do escopo inicial.

---

## 7. Bug de navegação: por que `server.url` não pode ter path

Descoberto testando no simulador (28/08/2026): links internos (ex: "Já possuo meu espaço" → `/login`) abriam o Safari por fora em vez de continuar dentro do app.

**Causa raiz** (confirmada lendo o código-fonte do Capacitor iOS, `WebViewDelegationHandler.swift`): a cada navegação, o Capacitor decide se ela é "do app" checando se a URL de destino **começa com** (`starts(with:)`) a string completa de `server.url`. Configuramos `server.url = "https://presenca.app/bem-vindo"` (path incluído, pensando em já abrir na tela certa) — e `"https://presenca.app/login"` não começa com `"https://presenca.app/bem-vindo"`. Toda rota que não fosse literalmente `/bem-vindo` caía no fallback "navegação externa" e abria no Safari.

**Por que não usar `server.appStartPath`** (a opção que parece feita sob medida pra isso, desde Capacitor 7.3): ela tenta validar um caminho equivalente dentro do `webDir` local — em modo remoto puro (sem cópia local do conteúdo), esse caminho não existe e o app falha ao abrir ("must exist as a resource directory").

**Fix adotado:** `server.url` fica só com a origem (sem path) — isso resolve a checagem de navegação pra qualquer rota do domínio. A entrada em `/bem-vindo` passa a ser responsabilidade do **site**, não do Capacitor: `appendUserAgent: "PresencaApp"` no config marca as requisições vindas do app, e a home de marketing (`app/(marketing)/page.tsx`) redireciona pra `/bem-vindo` quando detecta esse marcador e não há sessão ativa.

---

## 8. Status

Decisões desta extensão fechadas: empacotamento via Capacitor, modelo de pagamento sempre-na-web com app fazendo só checagem de acesso, escopo/texto da exceção de push ao pilar 5, separação app/web (§4.1) e o fix de navegação (§7). Fase 1 (scaffolding) e Fase 2 (acesso manual) implementadas e testadas de ponta a ponta no simulador iOS — detalhe em `presenca-checklist-desenvolvimento.md` (Fase 12). Pendente: testar no Android, e as fases bloqueadas por conta externa (push, Sign in with Apple, universal links, submissão às lojas).
