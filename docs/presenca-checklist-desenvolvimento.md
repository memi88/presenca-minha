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
- [ ] Adicionar OAuth como opção alternativa no fluxo de conversão (hoje só e-mail/senha).
- [x] Conversão obrigatória disparando no momento de conectar profissional. `/terapia` (Fase 4): usuário anônimo que tenta conectar vê o `ContaForm` (com `next="/terapia"`) antes de poder digitar o código de convite — nunca chega ao formulário de código sem antes converter.
- [x] Convite de conversão gentil e recorrente pro resto dos casos (não só uma vez). Banner discreto na Home + "agora não" (adia 7 dias via `profiles.lembrete_conversao_em`), testado.
- [ ] Checagem de sessão local na Entrada: sessão válida → pula onboarding, vai direto pra Home.
- [ ] Link discreto "já tem conta? entrar" na tela de Entrada, pra quem tem conta permanente sem sessão local.
- [ ] Tela de login (e-mail/senha ou magic link) pra esse caso.
- [ ] Logout: comportamento normal pra conta permanente; aviso forte (ou ausência do botão) pra conta anônima, por risco de perda permanente de dado.
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
- [ ] **Portão de qualidade: nenhuma prática entra sem ter sido vivida** — cada item cadastrado precisa ter sido genuinamente experimentado por quem o escreveu antes de virar página.
- [ ] Embedding calculado ao cadastrar cada item. Mecanismo pronto (script + `lib/embed.ts`) e `services/ia` já no ar. **Script de recálculo pronto** (`scripts/recalcular-embeddings-biblioteca.mjs`, precisa de `SUPABASE_SERVICE_ROLE_KEY` — só você roda, credencial nunca passa por um agente de IA); falta só rodar uma vez pra corrigir a página semente (`embedding = null`) e, separadamente, cadastrar o restante do conteúdo curado com `scripts/cadastrar-biblioteca.mjs` — isso depende de escrever o conteúdo em si (decisão de voz/curadoria, não código).
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
- [ ] Respiração 4-7-8 — **adiado deliberadamente**, junto com a tela de Meditação em si (não existe ainda; construir isso junto teria envolvido desenhar UX que o PRD não detalha). Fica para quando Meditação for escopada. Espec já definida pra quando entrar: movimento contínuo (sem corte de tela), saída a qualquer momento, retomada exata da conversa ao voltar.
- [x] **Responsividade desktop — retrabalhada em cima do que o checklist original pedia.** A ideia inicial (coluna fixa de 480px com fundo discreto ao redor) foi implementada, testada pelo usuário e rejeitada na prática: parecia "uma faixa de conteúdo" mesmo maior. Substituída por responsividade de verdade por categoria de tela — sem moldura nenhuma, full-bleed em qualquer largura: **A** (Landing/Chegada/Home, imagem de cena) — imagem cobre a janela inteira, bloco de texto/CTA escala fluidamente via `clamp()`; **B** (Conta/Terapia, formulário) — cartão centralizado com `clamp()` mais discreto; **C** (Diário/Livro Vivo, leitura) — coluna de leitura alarga moderadamente (560→~720px) pra não virar parede de texto. Quebras de linha manuais (`<br/>`) nos títulos viravam quebra estranha em tela larga — corrigido com uma classe `.quebra` que só quebra abaixo de 640px, em texto flui naturalmente acima disso. Aplica a todas as 8 telas do app (não só as 4 originais da Fase 1).

## Fase 6 — Onboarding (revelação contextual)

- [x] Fluxo de entrada sem pedir nascimento. Já satisfeito desde a Fase 1 — `/chegada` só pede nome.
- [x] Check-in "como está sua presença hoje?" funcionando e mudando a estrutura da tela seguinte. `/hoje` — 5 opções (Confuso/Em paz/Cansado/Curioso/Não sei responder), guardadas em `profiles.presenca_hoje`/`presenca_hoje_em` (`precisaCheckin`, `lib/checkin.ts`, gatilho de 12h). Quem responde "confuso" cai numa Home sem o link de Terapia — o PRD só detalha esse recorte pra essa resposta; as outras 4 mantêm a Home cheia (não inventei estrutura reduzida pra elas).
- [ ] Convite de nascimento surgindo só dentro da conversa, quando o tema pedir (nunca em tela fixa). **Desbloqueado** — a Conversa já existe (Fase 10) —, mas a lógica específica desse convite contextual dentro da conversa ainda não foi implementada.
- [x] Convite de nascimento pelas outras 2 formas do PRD §5 (ação própria + gatilho contextual espontâneo). `/perfil/nascimento` — formulário (data obrigatória, local/hora opcionais, com a saída "não sabe a hora? sem problema"), alcançável a qualquer momento por `/perfil`. Gatilho espontâneo: `lib/streak.ts` conta dias consecutivos de visita (sinal interno, nunca exibido como contador — voz-de-marca pilar 3, sem streak/gamificação); a partir de 3 dias seguidos sem `data_nascimento` preenchida, a Home mostra o mesmo convite dispensável de sempre ("Quer personalizar sua presença?"), "agora não" adia 7 dias (`profiles.lembrete_nascimento_em`, mesmo padrão do convite de conversão).
- [x] Conexão com profissional como ação dentro de "Terapia", nunca no cadastro inicial. Já satisfeito pela Fase 4 — `/terapia` é tela separada, alcançada por link na Home, nunca faz parte de `/chegada`.

## Fase 7 — Pipeline de recomendação e IA

- [x] Cálculo de fase da lua (local, sem serviço externo). `lib/lua.ts` — `faseDaLua()`, algoritmo de ciclo sinódico, 8 fases. Testado (`npx tsx`) contra datas conhecidas.
- [ ] Cálculo de configuração HD — **pendente de decisão de biblioteca** (ver Pendências abaixo). Até lá, deixar como stub.
- [x] Filtro por tags (`tags_momento_vida`) funcionando — `tags_hd` continua parado até a configuração HD existir. `/livro-vivo` reordena (nunca esconde) pelo `presenca_hoje` do check-in (Fase 6) contra `biblioteca.tags_momento_vida`. **Mecanismo correto, mas hoje inerte:** a única página semente da `biblioteca` tem `tags_momento_vida = null` — só vai ter efeito visível quando houver conteúdo curado com tags (`scripts/cadastrar-biblioteca.mjs` já suporta isso).
- [x] Busca por proximidade semântica (`embedding <=>`) funcionando dentro do universo de cada usuário. RPC `buscar_conexao_caderno` (migration `busca_semantica_caderno`) — `security invoker` + filtro explícito por `paciente_id = auth.uid()` (nunca cruza entre pessoas), busca a entrada mais próxima entre perguntas em aberto do profissional e entradas `revisitar = true`. Limiar de distância (`p_distancia_maxima`, palpite inicial 0.5) ainda não calibrado com uso real — ajustar conforme os primeiros resultados do piloto. Ainda não aplicada à ordenação do Livro Vivo (que hoje só usa tag), só ao Diário (ver item abaixo).
- [x] Saudação da Home variando por sinal (nunca fórmula fixa, nunca rotulando a pessoa). **Evoluiu duas vezes:** a primeira versão (`lib/abertura.ts`, 4 categorias de frase) foi substituída por um mecanismo mais rico — a Home virou um menu de 4 destinos (Livro Vivo, Meditação, Diário, Conversar) reordenado por sinal, não só uma frase que muda. "Meditação" é um hub (`/meditacao`) que lista práticas cadastradas em `biblioteca.tipo = 'pratica'` — o Fôlego (Respiração 4-7-8) é a única com experiência interativa de verdade (`biblioteca.slug` liga a prática à rota `/folego`); as demais cadastradas usam uma leitura genérica (`/meditacao/[id]`), mesmo padrão do Livro Vivo. `scripts/cadastrar-biblioteca.mjs` ganhou fallback gracioso sem `IA_SERVICE_URL` (antes travava sem o serviço no ar). `lib/menuHome.ts` decide a ordem: check-in fresco (`presenca_hoje`, Fase 6) define a ordem por humor; sem isso, pergunta em aberto do profissional bota "escrever algo" na frente; sem isso, `profiles.ultimo_destino` (novo) bota o último lugar visitado na frente ("continue de onde você parou"). Gatilho do check-in também mudou: de "12h desde a última resposta de humor" pra "2+ dias desde a última visita" (`lib/checkin.ts`, `precisaVisitaCheckin`). Sinais só escolhem *qual* convite/ordem mostrar — nunca viram texto que descreve a pessoa.
- [x] ~~Cena visual variando por sinal (4-6 variações)~~ — **removido do escopo por decisão do usuário** (2026-07-12). Não vamos variar a imagem de cena por sinal; a cena permanece fixa.
- [x] Notificação gentil quando uma entrada nova conecta com pergunta em aberto ou entrada `revisitar` — **duas versões coexistindo**: a Home continua mostrando "voltar a algo que você guardou →" (checagem simples de existência); e agora `/diario` também roda a versão com matching semântico de verdade — ao guardar uma entrada nova, `criarEntrada` chama `buscar_conexao_caderno` e mostra "isso conecta com algo que você guardou: ..." quando encontra uma correspondência.
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

## Fase 10 — Conversa (chat com IA companheira)

- [x] Rota `/conversa` funcionando — chat com Claude Sonnet 5, streaming NDJSON via Route Handler (`app/api/conversa/route.ts`, primeiro Route Handler do projeto — resto do app é só Server Actions). System prompt validado no comparativo (`docs/testes-modelo/comparacao-modelos-2026-07-15.md`), vive em `lib/systemPromptConversa.ts`. Testado localmente (`next dev`) pelo usuário — funcionou.
- [x] Conversa é efêmera por decisão — nunca persiste mensagens; sempre começa do zero a cada visita (sem retomar sessão anterior).
- [x] "Guardar no Diário" — botão por bubble (usuário e assistente), insere em `caderno_entradas` via Server Action `guardarNoDiario` (`app/conversa/actions.ts`), mesmo pipeline de embedding assíncrono de `criarEntrada`. Testado pelo usuário — funcionou.
- [x] Protocolo de risco — tool `sinalizar_risco` (canal estrutural, nunca texto do modelo) aciona um card de transição fixo no código (nunca copy gerada pela IA) com botão "ir para recursos →" + redirect automático em ~5s. Destino sempre `/recursos`, nunca variando. **Ainda não confirmado pelo usuário** — construído, gatilho de teste sugerido, mas falta confirmação de que o comportamento saiu como esperado.
- [x] Rate limit próprio da conversa (`conversa_rate_limit` + RPC `pode_conversar`, 40 msgs/10min) — migration `20260715150000_rate_limit_conversa.sql` criada e **aplicada no banco remoto**.
- [x] UI reservada ativada — nav desktop (`PageHeader.tsx`, `home/page.tsx`) e pills mobile (via `lib/menuHome.ts`) que mostravam "Conversa (em breve)" agora linkam de verdade pra `/conversa`. "Continue de onde você parou" reconhece Conversa como último destino.
- [ ] Validar em `cf:preview` (runtime real do Cloudflare Workers) antes de considerar pronto pra produção — só foi testado em `next dev` até agora. Build pro Workers (`opennextjs-cloudflare build`) já foi validado sem erros nas duas rodadas de desenvolvimento (conversa + tela de fechamento), mas falta rodar a preview completa e testar o streaming de ponta a ponta nesse runtime.
- [x] Ajustes de design "mais acolhedor" — fundo com a cena da Home desfocada + véu quente (antes era cor chapada), bubbles com cor e "rabinho" assimétrico batendo com o mockup oficial (`docs/Presenca Jornada em Telas.dc.html`, tela "05 · CONVERSA"), input em formato pílula. Também corrigida uma inconsistência de espaçamento pré-existente (não específica da Conversa): 4 telas (`diario`, `conversa`, `privacidade`, `limites-de-cuidado`) duplicavam padding acima do `PageHeader`, que já tem o próprio espaçamento embutido — removido o padding redundante das 4.
- [x] Tela de Fechamento ("Por hoje, é o bastante") — mockup oficial, tela "06 · FECHAMENTO". Gatilho duplo: tool `sinalizar_encerramento` (mesmo canal estrutural do risco, mas reversível) quando a IA reconhece que a conversa terminou naturalmente, **e** um link manual "encerrar por hoje" sempre visível pra pessoa decidir por conta própria. Reversível — "ainda quero continuar" volta pro chat sem perder o histórico da sessão. "Guardar uma palavra do encontro" reusa `guardarNoDiario` (sem Server Action nova). Testado pelo usuário — os dois gatilhos, reversibilidade e guardar-palavra com/sem conteúdo funcionaram.
- [x] **Bug corrigido:** autoscroll parava de funcionar em conversas mais longas. Causa: `.scene` usava `min-height: 100dvh` (só um piso) em vez de `height: 100dvh` (teto fixo) — o container crescia junto com a conversa e quem rolava era a página inteira, não a lista de mensagens; faltava também `min-height: 0` na `.lista` (flex item recusa encolher abaixo do próprio conteúdo por padrão). Corrigido, confirmado pelo usuário.
- [ ] Fast-follow (fora do escopo desta v1, por decisão consciente): Llama Guard 3 rodando em paralelo como segunda camada de verificação de risco; busca semântica no núcleo Presença pra sugerir prática/página concreta durante a conversa; Human Design no prompt (ainda depende do cálculo, que é stub).

---

## Pendências externas (não bloqueiam o código, mas precisam de decisão)

- [x] Microsserviço Python — código pronto em `services/ia` (FastAPI, autenticado por `IA_API_KEY` compartilhada, nunca aberto). **Deployado no Railway** (`presenca-minha-production.up.railway.app`, Dockerfile builda a imagem com o modelo já cacheado). Endpoint `/embed` testado de ponta a ponta contra produção (multilingual-e5-small, 384 dim, prefixo passage/query). `IA_SERVICE_URL` preenchido nos `.env.local` do Presença e do Cuida. Endpoint `/human-design` continua stub — retorna `pendente: true` até a decisão de biblioteca.
- [x] LLM de conversa/entrega: Claude via API Anthropic — Sonnet 5 (conversa principal) + Haiku 4.5 (todo microcopy: home, reentrada, convite, encerramento, resumo, notificações). Decidido depois de comparativo lado a lado com Llama (Cloudflare) e GPT (OpenAI), rodando cada cenário 3x contra o `voz-de-marca.md` — resultado completo em `docs/testes-modelo/comparacao-modelos-2026-07-15.md`. Llama descartado (não seguiu instrução explícita de gênero neutro de forma confiável); GPT descartado por verbosidade sistemática e um uso de linguagem técnica banida.
- [ ] Confirmar termos atuais da API Anthropic sobre uso de conteúdo para treino; documentar como operador no inventário LGPD.
- [x] ~~Texto final de consentimento + política de privacidade~~ — já coberto pelo item da Fase 9 acima (checkboxes de consentimento + `/privacidade` publicada). Mesma ressalva: rascunho técnico meu, recomendo revisão por advogado antes de valer pra pacientes reais.
- [x] Cadastrar os 3 terapeutas do piloto com `scripts/cadastrar-profissional.mjs`. **Feito, os 3.** Senhas usadas foram temporárias e previsíveis (nome+número) — `/perfil` no Cuida agora tem tela de trocar senha; recomendo cada terapeuta trocar a própria antes de dado real de paciente entrar.
- [x] Migração da Fase 6 (`supabase/migrations/20260710174036_fase6_checkin_presenca.sql`) aplicada no banco. **Feito**, testado de ponta a ponta.
- [x] Migração da Fase 7 (`supabase/migrations/20260710183033_fase7_ultima_visita.sql`) aplicada no banco. **Feito**, testado de ponta a ponta.
- [x] Migração da Fase 8 (`supabase/migrations/20260710194547_fase8_alertas_risco.sql`) aplicada no banco. **Feito**, testado de ponta a ponta.
- [x] Migração do menu de destinos da Home (`supabase/migrations/20260710213547_home_ultimo_destino.sql`) aplicada no banco. **Feito**, testado.
- [x] Migração do menu Perfil + streak + nascimento (`supabase/migrations/20260711221959_perfil_streak_nascimento.sql`) aplicada no banco. **Feito**.
- [x] Migração da Meditação (`supabase/migrations/20260711134921_meditacao_biblioteca_slug.sql`) aplicada no banco. **Feito**, testado.
- [x] Deploy dos apps Next.js no Cloudflare Workers (adapter `@opennextjs/cloudflare`). `apps/presenca` → `presenca.app`/`www.presenca.app`; `apps/cuida` → `cuida.presenca.app`. **Achado no processo:** o `proxy.ts` (ex-`middleware.ts`, refresca sessão do Supabase a cada request) foi removido — a partir do Next.js 16 o Proxy roda só em runtime Node.js, e o adapter Cloudflare só suporta Edge; a sessão continua sendo refrescada normalmente pelos Server Components (`packages/supabase/src/server.ts`). Domínio `presenca.app` antes apontava pra um app Vite antigo hospedado na AWS Amplify (decomissionado); DNS trocado pelos Custom Domains do Cloudflare.
- [x] Rate limiting no microsserviço de IA. `services/ia` — 20 chamadas/min por IP em `/embed`, 10/min em `/human-design` (slowapi), protegendo o serviço compartilhado contra loop de retry ou abuso. Timeout de 15s nas chamadas do Next.js (`lib/embed.ts` dos dois apps) pra não travar a Server Action se o serviço ficar lento.
- [x] Rate limiting no lado do Next.js (por usuário, não só por IP no serviço). Migration `rate_limit_embedding` — tabela `embedding_rate_limit` (RLS, cada usuário só vê/edita a própria linha) + função `pode_calcular_embedding` (upsert atômico, janela deslizante, default 20 chamadas/10min). `lib/rateLimit.ts` (duplicado nos dois apps, mesmo padrão de `lib/embed.ts`) chama isso antes de toda chamada a `calcularEmbedding` — Diário, guardar leitura/prática (Presença) e entrada do profissional (Cuida). Se a checagem em si falhar, libera (mesma filosofia de degradação graciosa do `lib/embed.ts`).

---

## Fora de escopo do piloto (não fazer agora)

- Profissionais além de terapeuta (nutricionista, fono).
- Tela de conectar profissional para quem começou sem nenhum (V2 — via biblioteca pública com autoria).
- Cadastro próprio do profissional no Cuida (self-signup). No piloto, os 3 terapeutas são cadastrados manualmente via `scripts/cadastrar-profissional.mjs` (você roda, com `service_role`). V2: profissional cria a própria conta.
- Contribuição de usuários ao Livro Vivo público.
- Ambiente claro/escuro por tipo de ação em vez de tela fixa.
- Painel admin sofisticado para a Biblioteca.