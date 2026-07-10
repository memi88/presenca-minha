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
- [ ] Conversão obrigatória disparando no momento de conectar profissional. **Parcial:** o mecanismo de conversão existe e é reutilizável; o gatilho em si depende da tela de "conectar profissional" (Fase 4), que ainda não existe. Fica registrado aqui pra não esquecer de chamar a conversão obrigatória quando essa tela for construída.
- [x] Convite de conversão gentil e recorrente pro resto dos casos (não só uma vez). Banner discreto na Home + "agora não" (adia 7 dias via `profiles.lembrete_conversao_em`), testado.
- [x] Tela de Entrada/Landing (ambiente claro).
- [x] Tela de Chegada — entrada enxuta, sem pedir nascimento.
- [x] Home básica funcionando (mesmo sem personalização ainda).

## Fase 2 — Caderno (Meu Livro)

- [ ] CRUD de entradas do Caderno (criar, ler).
- [ ] Campo `revisitar` funcionando (marcar entrada pra voltar depois).
- [ ] Autoria visual diferenciada: entrada do usuário (sem moldura) vs. entrada do profissional (borda/fundo slate, nome, avatar).
- [ ] Embedding calculado automaticamente ao salvar cada entrada.

## Fase 3 — Livro Vivo

- [ ] Estrutura de conteúdo curado (`biblioteca`) funcionando.
- [ ] Ao menos as primeiras páginas/práticas reais cadastradas (curadoria manual no banco está OK pro piloto).
- [ ] Embedding calculado ao cadastrar cada item.
- [ ] Tela de leitura — sem contagem, sem meta, sem "marcar como concluído".

## Fase 4 — Vínculo profissional-paciente + Cuida

- [ ] Tabela `vinculos` funcionando (conectar paciente a profissional).
- [ ] Portal Cuida: lista de pacientes.
- [ ] Portal Cuida: tela de escrever pergunta/prática pro Caderno de um paciente vinculado.
- [ ] RLS testado especificamente aqui: profissional nunca vê entradas de tipo `usuario`, só as que ele mesmo escreveu.

## Fase 5 — Ambientes claro e escuro

- [ ] Tokens de tema (CSS variables) para os dois ambientes.
- [ ] Transição em fade entre rotas (~400–600ms).
- [ ] Mapeamento fixo por tela: Livro Vivo, Diário, Meditação = escuro; resto = claro.
- [ ] Respiração 4-7-8: movimento contínuo (sem corte de tela), saída a qualquer momento, retomada exata da conversa ao voltar.
- [ ] **Responsividade desktop.** É um PWA (seção 3.2 do PRD), não mobile-only — as telas da Fase 1 (Landing, Chegada, Home, Conta) usam layout mobile-first fiel ao mockup, mas em viewport largo isso vira uma faixa de conteúdo pequena numa janela grande, com a imagem de cena esticada/cortada sem intenção. Tratar sistematicamente aqui (junto dos tokens de tema): conter a experiência numa coluna central de largura fixa (~480px) em telas largas, com o entorno preenchido por um fundo mais discreto em vez de esticar a UI interativa de ponta a ponta. Aplica retroativamente às 4 telas já construídas.

## Fase 6 — Onboarding (revelação contextual)

- [ ] Fluxo de entrada sem pedir nascimento.
- [ ] Check-in "como está sua presença hoje?" funcionando e mudando a estrutura da tela seguinte.
- [ ] Convite de nascimento surgindo só dentro da conversa, quando o tema pedir (nunca em tela fixa).
- [ ] Conexão com profissional como ação dentro de "Terapia", nunca no cadastro inicial.

## Fase 7 — Pipeline de recomendação e IA

- [ ] Cálculo de fase da lua (local, sem serviço externo).
- [ ] Cálculo de configuração HD — **pendente de decisão de biblioteca** (ver Pendências abaixo). Até lá, deixar como stub.
- [ ] Filtro por tags (`tags_momento_vida`, `tags_hd`) funcionando.
- [ ] Busca por proximidade semântica (`embedding <=>`) funcionando dentro do universo de cada usuário.
- [ ] Saudação da Home variando por sinal (nunca fórmula fixa, nunca rotulando a pessoa).
- [ ] Cena visual variando por sinal (4-6 variações).
- [ ] Notificação gentil quando uma entrada nova conecta com pergunta em aberto ou entrada `revisitar`.
- [ ] Confirmar: Recursos/Protocolo de risco **nunca variam** — testar que isso está travado, não condicional.

## Fase 8 — Recursos e protocolo de risco

- [ ] CVV (188) e SAMU (192) sempre visíveis, nos dois cenários (com/sem profissional).
- [ ] Caminho "sem profissional": recursos + convite à rede sem pressão + acolhimento contínuo.
- [ ] Caminho "com profissional": caso sobe sinalizado no Cuida — **e** recursos imediatos continuam visíveis (não depende de resposta do profissional).
- [ ] Consentimento de compartilhamento com profissional é dado no momento da conexão (antecipado), nunca pedido durante um momento de risco.

## Fase 9 — Segurança e conformidade

- [ ] Consentimento específico e destacado (app em geral + conexão com profissional, separados).
- [ ] Política de privacidade publicada.
- [ ] Encarregado nomeado + canal de contato visível no app.
- [ ] Processo de exclusão de dados sob pedido (manual está OK pro piloto).

---

## Pendências externas (não bloqueiam o código, mas precisam de decisão)

- [ ] Microsserviço Python (Render/Railway) — código pronto em `services/ia` (FastAPI, autenticado por `IA_API_KEY` compartilhada, nunca aberto). Endpoint `/embed` **implementado e testado localmente** (multilingual-e5-small, 384 dim, prefixo passage/query). Endpoint `/human-design` é stub — aceita o formato de entrada real, retorna `pendente: true` até a decisão de biblioteca. **Falta:** deploy no Render/Railway (fora do meu alcance — precisa da sua conta); depois disso, preencher `IA_SERVICE_URL` nos `.env.local` dos apps com a URL pública.
- [ ] LLM de entrega a usar (personalização de tom/saudação).
- [ ] Texto final de consentimento + política de privacidade (posso rascunhar quando quiser).

---

## Fora de escopo do piloto (não fazer agora)

- Profissionais além de terapeuta (nutricionista, fono).
- Tela de conectar profissional para quem começou sem nenhum (V2 — via biblioteca pública com autoria).
- Contribuição de usuários ao Livro Vivo público.
- Ambiente claro/escuro por tipo de ação em vez de tela fixa.
- Painel admin sofisticado para a Biblioteca.