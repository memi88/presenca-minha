# Presença — Handoff para Claude Code: Redesign Visual

> **Leia isto primeiro.** Este documento é o ponto de entrada único pra
> tudo que foi decidido na sessão de redesign (planejamento + Stitch). Os
> outros ~20 arquivos gerados durante o processo continuam existindo como
> referência detalhada — este aqui organiza o caminho entre eles.

---

## 1. O que não muda

- **Arquitetura:** Next.js + Capacitor, conforme `presenca-extensao-app-mobile.md`.
  Este redesign é visual/estrutural, não mexe em stack.
- **Checkout:** link de compra externa em navegador embutido, não IAP
  nativo — `presenca-checkout-app-mobile.md`.
- **Princípios de produto:** tudo que já regia o Presença antes (sem
  streak, sem métrica, privacidade por arquitetura) continua valendo.
  O redesign muda a superfície, não a filosofia.

---

## 2. Sistema visual novo — Presença (app do usuário final)

| Token | Valor |
|---|---|
| Tipografia display/headline/body | **Fraunces** |
| Tipografia label/botão/navegação | **Bitter** |
| Ícones | SVG próprios, traço único orgânico — **nunca Material Symbols ou qualquer biblioteca de ícone padrão** |
| Ambiente escuro | Só **Diário** e **Livro Vivo** (redução do escopo anterior — Lente do dia, Autor, Práticas viraram claro/híbrido) |
| Imagem de cena | Atmosfera esmaecida ao fundo, nunca banner com borda — só em Home (lago), Diário e Livro Vivo (sala) |
| Menu inferior | 5 itens fixos: Home, Livro Vivo, Diário, Práticas, Conversa — ícones em `presenca-icones-menu.html`, já validados byte-a-byte no código exportado |

**Sistema antigo que está sendo substituído:** Spectral como família única
(sem sans-serif), sem regra de ícone documentada, ambientes escuro/claro
na distribuição original do PRD §6.

---

## 3. Inventário completo de telas — ver `presenca-redesign-sistema-visual-status.md`

Esse documento tem a lista viva e atualizada de cada tela (✅ pronta, 🟠
reportada aguardando conferência, 🟡 prompt escrito aguardando geração).
Não duplico a lista aqui pra evitar as duas ficarem desalinhadas — sempre
consultar o status file como fonte da verdade.

**Resumo rápido do estado no momento deste handoff:**
- Home: ✅ fechada, ícones confirmados limpos no código.
- Lente do dia, Detalhe da Prática, Diário, Livro Vivo (acervo+leitura),
  Do seu terapeuta, Autor da prática, Fechamento do dia: ✅ desenhadas.
- Prática ativa (2 estados — mídia em tela cheia / descrição com fundo
  claro): ✅ desenhada e aprovada.
- Conversa, Fechamento da conversa, Perfil, Terapia, Recursos: 🟠
  reportadas como prontas, ainda sem arquivo exportado conferido.
- Cadastro de Prática (admin): 🟡 prompt escrito, adiada pra depois —
  não é tela de usuário final, é ferramenta administrativa.
- Onboarding (Bem-vindo/Chegada/Login/Conta) e legal
  (Privacidade+Limites, unificadas numa página só): 🟠 reportadas, com uma
  pendência de revisão jurídica na copy de privacidade da tela de Chegada.

---

## 4. O que falta antes de considerar o pacote 100% fechado

1. Conferir os arquivos exportados (zip) das telas marcadas 🟠 acima —
   ainda não recebi/validei o código delas, só descrição verbal ou imagem.
2. Revisão jurídica da frase de privacidade gerada na tela de Chegada
   ("nunca compartilhamos com terceiros...") antes de virar copy final.
3. Decidir a implicação técnica da unificação de Privacidade + Limites de
   cuidado (uma rota redireciona pra outra, ou as duas servem o mesmo
   conteúdo).

Nenhum desses três bloqueia o Claude Code **começar** a trabalhar nas
telas já fechadas (seção 3) — só não dá pra considerar o pacote inteiro
"pronto" enquanto isso não for resolvido.

---

## 5. Ordem sugerida de implementação

1. Fundação: atualizar `globals.css` do Presença com os tokens novos
   (Fraunces+Bitter, paleta), trocar o menu inferior pelos ícones de
   `presenca-icones-menu.html`.
2. Home (já é a tela mais testada e validada).
3. Diário, Livro Vivo, Conversa, Práticas (núcleo funcional).
4. Perfil, Terapia, Recursos.
5. Onboarding e legal (mais funcional que visual, mas ainda pendente).
6. Cadastro de Prática (admin) — em paralelo ou depois, não bloqueia o
   resto.

O **Cuida** fica de fora dessa ordem — segue meu próprio planejamento em
`presenca-cuida-planejamento.md`, começa só depois do Presença fechado
(decisão já registrada).

---

## 6. Arquivos de referência (todos em Project Knowledge)

**Prompts do Stitch (referência histórica, não precisam ser re-executados
— já geraram o código que está nas telas aprovadas):**
`presenca-stitch-prompts-home.md`, `presenca-stitch-prompts-lote2.md`,
`presenca-stitch-prompt-conversa.md`, `presenca-stitch-prompt-fechamento-conversa.md`,
`presenca-stitch-prompt-perfil.md`, `presenca-stitch-prompt-terapia.md`,
`presenca-stitch-prompt-recursos.md`, `presenca-stitch-prompt-onboarding-1.md`,
`presenca-stitch-prompt-onboarding-2.md`, `presenca-stitch-prompt-legal.md`,
`presenca-stitch-prompt-pratica-ativa.md`, `presenca-stitch-prompt-cadastro-pratica.md`,
`presenca-stitch-prompt-imagens-cena.md`, `presenca-stitch-prompt-icones-home.md`,
`presenca-stitch-prompt-icones-login.md`

**Documentos de decisão/arquitetura:**
`presenca-redesign-sistema-visual-status.md` (inventário vivo — a fonte
mais importante depois deste handoff), `presenca-cuida-planejamento.md`,
`presenca-merge-site-decisoes.md`, `presenca-fusao-site-institucional.md`

**Assets:**
`presenca-icones-menu.html` (os 5 ícones do menu, código SVG pronto pra
copiar)

---

## 7. Status

Handoff inicial pronto. Próximo passo real: você reunir e conferir comigo
os zips das telas 🟠 antes de considerar o pacote fechado — mas o Claude
Code já pode começar pela seção 5 sem esperar isso, já que as telas mais
críticas (Home, núcleo funcional) já estão confirmadas.
