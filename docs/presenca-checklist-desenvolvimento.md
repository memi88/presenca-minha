# Presença — Checklist de Desenvolvimento

> Este arquivo é o estado atual do projeto. No início de cada sessão com o Claude Code, aponte pra ele: *"olha o `docs/checklist-desenvolvimento.md`, continua de onde paramos."* No fim de cada sessão, peça pra ele marcar o que foi concluído e adicionar itens novos que tenham surgido. Isso substitui depender de lembrar o que já foi feito.

---

## Fase 0 — Fundação

- [x] Repositório monorepo criado (pnpm workspaces: `apps/presenca`, `apps/cuida`, `packages/supabase`).
- [x] Projeto Supabase criado, conectado ao repo.
- [x] `pgvector` habilitado no banco.
- [x] Todas as tabelas do PRD (seção 4) criadas: `profiles`, `profissionais`, `vinculos`, `biblioteca`, `caderno_entradas`.
- [x] RLS habilitado e testado em **cada** tabela, sem exceção, antes de seguir adiante. 23/23 checagens (`scripts/rls-check.mjs`).
- [x] `service_role` confirmado fora do código de frontend e fora de acesso de qualquer agente de IA.
- [ ] Processo de backup manual configurado (plano free não tem automático). Script e doc prontos (`scripts/backup.sh`, `docs/backup.md`); falta rodar uma vez de verdade.

## Fase 1 — Autenticação e perfil

- [x] Login anônimo (`signInAnonymously()`) habilitado, disparado silenciosamente na Entrada.
- [x] CAPTCHA/Turnstile configurado no login anônimo. Widget oficial da Cloudflare, site key em `.env.local`, secret key só no dashboard do Supabase (Attack Protection).
- [x] Fluxo de conversão pra conta permanente (e-mail/senha), preservando o mesmo UUID. `/conta` — `supabase.auth.updateUser({email, password})`, testado (mesmo `auth.uid()` antes/depois).
- [x] Conversão obrigatória disparando no momento de conectar profissional. `/terapia` (Fase 4): usuário anônimo que tenta conectar vê o `ContaForm` (com `next="/terapia"`) antes de poder digitar o código de convite — nunca chega ao formulário de código sem antes converter.
- [x] Convite de conversão gentil e recorrente pro resto dos casos (não só uma vez). Banner discreto na Home + "agora não" (adia 7 dias via `profiles.lembrete_conversao_em`), testado.
- [x] Tela de Entrada/Landing (ambiente claro).
- [x] Tela de Chegada — entrada enxuta, sem pedir nascimento.
- [x] Home básica funcionando (mesmo sem personalização ainda).
- [x] Menu de perfil real, substituindo os 3 pontinhos decorativos. `/perfil` — nome, e-mail (ou convite de conversão se ainda anônimo), vínculo com profissional (conectado(a) com {nome} ou "conectar →", ambos levam a `/terapia`) e data de nascimento (resumo ou "adicionar →"). O link "terapia →" saiu da Home — só existe dentro de `/perfil` agora.

## Fase 2 — Caderno (Meu Livro) — **renomeado pra "Diário"** (rota `/diario`, ambiente escuro) numa revisão de design posterior; nome desta fase fica como está por ser histórico.

- [x] CRUD de entradas do Caderno (criar, ler, apagar). `/diario` (era `/caderno`) — testado por script e no navegador.
- [x] Campo `revisitar` funcionando (marcar entrada pra voltar depois). Testado (persistência confirmada).
- [x] Autoria visual diferenciada: entrada do usuário (sem moldura) vs. entrada do profissional (borda/fundo slate, nome, avatar). Testado com entrada de profissional inserida manualmente (Fase 4 ainda não existe pra criar isso pelo fluxo real). **Bug encontrado e corrigido nesse teste:** faltava policy de RLS pra paciente ler o *nome* do profissional (só a entrada aparecia, sem autoria) — corrigido em `20260710123343_fase2_paciente_ve_nome_profissional.sql`.
- [x] Embedding calculado automaticamente ao salvar cada entrada. `lib/embed.ts` — `services/ia` no ar (Railway), `/embed` testado de ponta a ponta (`{"dimensoes":384,"modelo":"intfloat/multilingual-e5-small"}`). Fallback gracioso pra `null` continua existindo caso o serviço caia.

## Fase 3 — Livro Vivo

- [x] Estrutura de conteúdo curado (`biblioteca`) funcionando. `/livro-vivo` lista páginas publicadas (`tipo = 'pagina_livro_vivo'`); leitura via `authenticated`, escrita continua só via `service_role`/SQL Editor (nunca client-side), conforme PRD.
- [x] Ao menos as primeiras páginas/práticas reais cadastradas (curadoria manual no banco está OK pro piloto). Uma página semente (texto que já existia no mockup de referência) cadastrada e testada; `scripts/cadastrar-biblioteca.mjs` pronto pra curadoria futura (calcula embedding, gera o SQL — você roda).
- [ ] Embedding calculado ao cadastrar cada item. Mecanismo pronto (script + `lib/embed.ts`) e `services/ia` já no ar — falta só recalcular a página semente (foi cadastrada com `embedding = null` antes do deploy) e cadastrar o restante do conteúdo curado com `scripts/cadastrar-biblioteca.mjs`.
- [x] Tela de leitura — sem contagem, sem meta, sem "marcar como concluído". `/livro-vivo/[id]` — só título, texto, e "guardar esta leitura" (cria referência no Diário, `biblioteca_ref_id`). Testado.

## Fase 4 — Vínculo profissional-paciente + Cuida

- [x] Tabela `vinculos` funcionando (conectar paciente a profissional). Conexão via código de convite (`profissionais.codigo_convite`): paciente digita o código em `/terapia`, função `conectar_profissional` (security definer) cria o vínculo — insert direto no client continua bloqueado por RLS, só esse caminho funciona.
- [x] Portal Cuida: lista de pacientes. `apps/cuida/app/pacientes` — login e-mail/senha, mostra o próprio `codigo_convite` e os pacientes vinculados (`ativo = true`). **Revisão pós-lançamento:** identidade visual própria (tokens quentes-neutros + Spectral nos títulos, CTA teal como cor de assinatura do Cuida — não copia a estética "lago" do Presença), cada paciente na lista mostra "conectado(a) desde" + "última entrada sua", e `/perfil` pra trocar a própria senha.
- [x] Portal Cuida: tela de escrever pergunta/prática pro Diário de um paciente vinculado. `apps/cuida/app/pacientes/[id]` — formulário (tipo + conteúdo), mesmo pipeline de embedding do Presença (`lib/embed.ts` duplicado, fallback gracioso pra `null`).
- [x] RLS testado especificamente aqui: profissional nunca vê entradas de tipo `usuario`, só as que ele mesmo escreveu. `scripts/rls-check-fase4.mjs` — 15/15 testes OK contra o banco real, incluindo o teste central (`select` do profissional em `caderno_entradas` nunca retorna `autor_tipo = 'usuario'`, mesmo com vínculo ativo). `scripts/rls-check.mjs` (Fase 0) recheca 23/23 sem regressão. **Bug encontrado e corrigido nesse teste:** as policies novas de `profissionais` e `vinculos` se referenciavam em ciclo (`profissionais → vinculos → profissionais`), causando "infinite recursion" no Postgres — corrigido com uma função `security definer` (`profissional_id_do_usuario_atual()`) em `20260710142826_fase4_corrige_recursao_rls.sql`.

## Fase 5 — Ambientes claro e escuro

- [x] Tokens de tema (CSS variables) para os dois ambientes. `app/globals.css` — `:root` (claro) + `[data-ambiente="escuro"]`, valores claro = hex já em uso antes da Fase 5, escuro = hex reais do mockup (`docs/Presenca Jornada em Telas.dc.html`, tela "H · LIVRO VIVO").
- [x] Transição em fade entre rotas (~400–600ms). `AmbienteShell.tsx` — `key={pathname}` + animação CSS de opacidade (500ms), sem biblioteca de animação (PRD seção 6).
- [x] Mapeamento fixo por tela — **parcial por decisão consciente:** Livro Vivo = escuro (único "cômodo escuro" já construído, reskin completo com `sala.png`). Diário e Meditação continuam claros porque essas telas ainda não existem — mapeá-las é trabalho da fase que as construir, não desta.
- [ ] Respiração 4-7-8 — **adiado deliberadamente**, junto com a tela de Meditação em si (não existe ainda; construir isso junto teria envolvido desenhar UX que o PRD não detalha). Fica para quando Meditação for escopada.
- [x] **Responsividade desktop — retrabalhada em cima do que o checklist original pedia.** A ideia inicial (coluna fixa de 480px com fundo discreto ao redor) foi implementada, testada pelo usuário e rejeitada na prática: parecia "uma faixa de conteúdo" mesmo maior. Substituída por responsividade de verdade por categoria de tela — sem moldura nenhuma, full-bleed em qualquer largura: **A** (Landing/Chegada/Home, imagem de cena) — imagem cobre a janela inteira, bloco de texto/CTA escala fluidamente via `clamp()`; **B** (Conta/Terapia, formulário) — cartão centralizado com `clamp()` mais discreto; **C** (Diário/Livro Vivo, leitura) — coluna de leitura alarga moderadamente (560→~720px) pra não virar parede de texto. Quebras de linha manuais (`<br/>`) nos títulos viravam quebra estranha em tela larga — corrigido com uma classe `.quebra` que só quebra abaixo de 640px, em texto flui naturalmente acima disso. Aplica a todas as 8 telas do app (não só as 4 originais da Fase 1).

## Fase 6 — Onboarding (revelação contextual)

- [x] Fluxo de entrada sem pedir nascimento. Já satisfeito desde a Fase 1 — `/chegada` só pede nome.
- [x] Check-in "como está sua presença hoje?" funcionando e mudando a estrutura da tela seguinte. `/hoje` — 5 opções (Confuso/Em paz/Cansado/Curioso/Não sei responder), guardadas em `profiles.presenca_hoje`/`presenca_hoje_em` (`precisaCheckin`, `lib/checkin.ts`, gatilho de 12h). Quem responde "confuso" cai numa Home sem o link de Terapia — o PRD só detalha esse recorte pra essa resposta; as outras 4 mantêm a Home cheia (não inventei estrutura reduzida pra elas).
- [ ] Convite de nascimento surgindo só dentro da conversa, quando o tema pedir (nunca em tela fixa). **Bloqueado, não esquecido:** depende da Conversa (chat com a IA companheira) existir — hoje é só um botão "conversar" desabilitado na Home. Só dá pra fazer de verdade depois de parte da Fase 7 (pipeline de conversa).
- [x] Convite de nascimento pelas outras 2 formas do PRD §5 (ação própria + gatilho contextual espontâneo). `/perfil/nascimento` — formulário (data obrigatória, local/hora opcionais, com a saída "não sabe a hora? sem problema"), alcançável a qualquer momento por `/perfil`. Gatilho espontâneo: `lib/streak.ts` conta dias consecutivos de visita (sinal interno, nunca exibido como contador — voz-de-marca pilar 3, sem streak/gamificação); a partir de 3 dias seguidos sem `data_nascimento` preenchida, a Home mostra o mesmo convite dispensável de sempre ("Quer personalizar sua presença?"), "agora não" adia 7 dias (`profiles.lembrete_nascimento_em`, mesmo padrão do convite de conversão).
- [x] Conexão com profissional como ação dentro de "Terapia", nunca no cadastro inicial. Já satisfeito pela Fase 4 — `/terapia` é tela separada, alcançada por link na Home, nunca faz parte de `/chegada`.

## Fase 7 — Pipeline de recomendação e IA

- [x] Cálculo de fase da lua (local, sem serviço externo). `lib/lua.ts` — `faseDaLua()`, algoritmo de ciclo sinódico, 8 fases. Testado (`npx tsx`) contra datas conhecidas.
- [ ] Cálculo de configuração HD — **pendente de decisão de biblioteca** (ver Pendências abaixo). Até lá, deixar como stub.
- [x] Filtro por tags (`tags_momento_vida`) funcionando — `tags_hd` continua parado até a configuração HD existir. `/livro-vivo` reordena (nunca esconde) pelo `presenca_hoje` do check-in (Fase 6) contra `biblioteca.tags_momento_vida`. **Mecanismo correto, mas hoje inerte:** a única página semente da `biblioteca` tem `tags_momento_vida = null` — só vai ter efeito visível quando houver conteúdo curado com tags (`scripts/cadastrar-biblioteca.mjs` já suporta isso).
- [ ] Busca por proximidade semântica (`embedding <=>`) funcionando dentro do universo de cada usuário. `services/ia` já no ar (não é mais o bloqueio) — falta escrever a query/RPC em si, ainda não existe no código.
- [x] Saudação da Home variando por sinal (nunca fórmula fixa, nunca rotulando a pessoa). **Evoluiu duas vezes:** a primeira versão (`lib/abertura.ts`, 4 categorias de frase) foi substituída por um mecanismo mais rico — a Home virou um menu de 4 destinos (Livro Vivo, Meditação, Diário, Conversar) reordenado por sinal, não só uma frase que muda. "Meditação" é um hub (`/meditacao`) que lista práticas cadastradas em `biblioteca.tipo = 'pratica'` — o Fôlego (Respiração 4-7-8) é a única com experiência interativa de verdade (`biblioteca.slug` liga a prática à rota `/folego`); as demais cadastradas usam uma leitura genérica (`/meditacao/[id]`), mesmo padrão do Livro Vivo. `scripts/cadastrar-biblioteca.mjs` ganhou fallback gracioso sem `IA_SERVICE_URL` (antes travava sem o serviço no ar). `lib/menuHome.ts` decide a ordem: check-in fresco (`presenca_hoje`, Fase 6) define a ordem por humor; sem isso, pergunta em aberto do profissional bota "escrever algo" na frente; sem isso, `profiles.ultimo_destino` (novo) bota o último lugar visitado na frente ("continue de onde você parou"). Gatilho do check-in também mudou: de "12h desde a última resposta de humor" pra "2+ dias desde a última visita" (`lib/checkin.ts`, `precisaVisitaCheckin`). Sinais só escolhem *qual* convite/ordem mostrar — nunca viram texto que descreve a pessoa.
- [ ] Cena visual variando por sinal (4-6 variações). **Bloqueado:** precisa de 4-6 imagens novas de cena — decisão de direção de arte, não escrevo isso sozinho.
- [x] Notificação gentil quando uma entrada nova conecta com pergunta em aberto ou entrada `revisitar` — **versão simples implementada**, exatamente a que o PRD prevê como suficiente enquanto a busca semântica não existe: Home mostra "voltar a algo que você guardou →" quando há entrada `revisitar = true`, sem depender de matching automático. A versão com matching semântico ("isso conecta com...") fica com o item de busca semântica acima.
- [x] Confirmar: Recursos/Protocolo de risco **nunca variam** — testar que isso está travado, não condicional. A Fase 8 construiu `/recursos` — conteúdo fixo (CVV/SAMU/rede/footer), sem nenhuma dependência de sinal (humor, lua, histórico); linkado incondicionalmente na Home, inclusive no estado "confuso" reduzido.

## Fase 8 — Recursos e protocolo de risco

- [x] CVV (188) e SAMU (192) sempre visíveis, nos dois cenários (com/sem profissional). `/recursos` — conteúdo fixo, sem variação por sinal nenhuma (PRD §7, regra de ouro). Linkado incondicionalmente na Home, inclusive no estado "confuso" reduzido da Fase 6 (a única coisa que sobrevive a esse recorte).
- [x] Caminho "sem profissional": recursos + convite à rede sem pressão + acolhimento contínuo. `/recursos` funciona pra qualquer usuário (sem guard de onboarding); linha "se tiver alguém por perto em quem você confia, também vale chamar"; "← voltar" pra Home no final (nunca um beco sem saída).
- [x] Caminho "com profissional": caso sobe sinalizado no Cuida — **e** recursos imediatos continuam visíveis. **Decisão consciente, confirmada com o usuário:** como não existe detecção de risco por IA (depende da Conversa, que é stub), o sinal é **autoacionado pelo próprio paciente** — botão "avisar {profissional}" em `/recursos`, nunca vigilância automática. Grava em `alertas_risco` (tabela nova, RLS restrita a paciente/profissional vinculado); aparece no Cuida como selo discreto "atenção" (âmbar, não vermelho-sirene — voz-de-marca pilar 4) na lista de pacientes e no detalhe, por 48h. CVV/SAMU continuam na mesma tela, nunca dependem disso.
- [x] Consentimento de compartilhamento com profissional é dado no momento da conexão (antecipado), nunca pedido durante um momento de risco. Frase nova em `/terapia`, antes do campo de código: "Ao conectar, seu profissional passa a poder escrever no seu Diário e você pode avisar ela caso precise de apoio — combinado agora, não pedido de novo depois."

## Fase 9 — Segurança e conformidade

- [x] Consentimento específico e destacado (app em geral + conexão com profissional, separados). Dois checkboxes reais (não só link em letra miúda): `CriarEspacoButton.tsx` (criar espaço — obrigatório, linka `/privacidade` + `/limites-de-cuidado`) e `ConectarForm.tsx` (conectar com profissional — obrigatório, específico da conexão, texto próprio). Contas já convertidas (login) não repetem o consentimento geral — já foi dado na criação.
- [x] Política de privacidade publicada. `/privacidade` — dados coletados, finalidade, base legal (LGPD, dado sensível de saúde art. 11), compartilhamento (Supabase + profissional conectado, nunca terceiros), segurança (RLS), retenção, direitos do titular. **Conteúdo é rascunho técnico meu, não assessoria jurídica — recomendo revisão por advogado antes de valer pra pacientes reais**, dado que é dado de saúde mental.
- [x] Encarregado nomeado + canal de contato visível no app. Guilherme (pessoa física) é o responsável e o encarregado (DPO); contato `guilhermemsts88@gmail.com` em `/privacidade`. Nome de família não incluído (não foi fornecido) — considerar completar com nome completo/CPF antes de publicar oficialmente.
- [x] Processo de exclusão de dados sob pedido (manual está OK pro piloto). `/privacidade`, seção "Seus direitos" — link `mailto:` direto, processo manual (você executa via SQL), conforme o piloto permite.

---

## Pendências externas (não bloqueiam o código, mas precisam de decisão)

- [x] Microsserviço Python — código pronto em `services/ia` (FastAPI, autenticado por `IA_API_KEY` compartilhada, nunca aberto). **Deployado no Railway** (`presenca-minha-production.up.railway.app`, Dockerfile builda a imagem com o modelo já cacheado). Endpoint `/embed` testado de ponta a ponta contra produção (multilingual-e5-small, 384 dim, prefixo passage/query). `IA_SERVICE_URL` preenchido nos `.env.local` do Presença e do Cuida. Endpoint `/human-design` continua stub — retorna `pendente: true` até a decisão de biblioteca.
- [ ] LLM de entrega a usar (personalização de tom/saudação).
- [ ] Texto final de consentimento + política de privacidade (posso rascunhar quando quiser).
- [x] Cadastrar os 3 terapeutas do piloto com `scripts/cadastrar-profissional.mjs`. **Feito, os 3.** Senhas usadas foram temporárias e previsíveis (nome+número) — `/perfil` no Cuida agora tem tela de trocar senha; recomendo cada terapeuta trocar a própria antes de dado real de paciente entrar.
- [x] Migração da Fase 6 (`supabase/migrations/20260710174036_fase6_checkin_presenca.sql`) aplicada no banco. **Feito**, testado de ponta a ponta.
- [x] Migração da Fase 7 (`supabase/migrations/20260710183033_fase7_ultima_visita.sql`) aplicada no banco. **Feito**, testado de ponta a ponta.
- [x] Migração da Fase 8 (`supabase/migrations/20260710194547_fase8_alertas_risco.sql`) aplicada no banco. **Feito**, testado de ponta a ponta.
- [x] Migração do menu de destinos da Home (`supabase/migrations/20260710213547_home_ultimo_destino.sql`) aplicada no banco. **Feito**, testado.
- [x] Migração do menu Perfil + streak + nascimento (`supabase/migrations/20260711221959_perfil_streak_nascimento.sql`) aplicada no banco. **Feito**.
- [x] Migração da Meditação (`supabase/migrations/20260711134921_meditacao_biblioteca_slug.sql`) aplicada no banco. **Feito**, testado.
- [x] Deploy dos apps Next.js no Cloudflare Workers (adapter `@opennextjs/cloudflare`). `apps/presenca` → `presenca.app`/`www.presenca.app`; `apps/cuida` → `cuida.presenca.app`. **Achado no processo:** o `proxy.ts` (ex-`middleware.ts`, refresca sessão do Supabase a cada request) foi removido — a partir do Next.js 16 o Proxy roda só em runtime Node.js, e o adapter Cloudflare só suporta Edge; a sessão continua sendo refrescada normalmente pelos Server Components (`packages/supabase/src/server.ts`). Domínio `presenca.app` antes apontava pra um app Vite antigo hospedado na AWS Amplify (decomissionado); DNS trocado pelos Custom Domains do Cloudflare.
- [x] Rate limiting no microsserviço de IA. `services/ia` — 20 chamadas/min por IP em `/embed`, 10/min em `/human-design` (slowapi), protegendo o serviço compartilhado contra loop de retry ou abuso. Timeout de 15s nas chamadas do Next.js (`lib/embed.ts` dos dois apps) pra não travar a Server Action se o serviço ficar lento.
- [ ] Rate limiting no lado do Next.js (por usuário, não só por IP no serviço) — ainda não existe. Hoje a única proteção é a do `services/ia`; considerar limitar por `user.id` nas Server Actions que disparam embedding se abuso real for observado.

---

## Fora de escopo do piloto (não fazer agora)

- Profissionais além de terapeuta (nutricionista, fono).
- Tela de conectar profissional para quem começou sem nenhum (V2 — via biblioteca pública com autoria).
- Cadastro próprio do profissional no Cuida (self-signup). No piloto, os 3 terapeutas são cadastrados manualmente via `scripts/cadastrar-profissional.mjs` (você roda, com `service_role`). V2: profissional cria a própria conta.
- Contribuição de usuários ao Livro Vivo público.
- Ambiente claro/escuro por tipo de ação em vez de tela fixa.
- Painel admin sofisticado para a Biblioteca.