# Presença — Redesign do Sistema Visual: Status e Escopo

> Documento de handoff. Registra o que foi decidido na sessão de redesign
> (construído com Google Stitch, iterado em rodadas) e o que ainda falta
> antes de considerar isso pronto pro Claude Code implementar de verdade.

---

## 1. Decisões fechadas nesta sessão

- **Arquitetura não muda.** Continua Next.js + Capacitor, conforme
  `presenca-extensao-app-mobile.md`. O redesign é só visual/estrutural, não
  reabre a decisão de empacotamento.
- **As 9 telas produzidas no Stitch definem o novo sistema visual pra todo
  o app** — não é um experimento isolado da Home, é o padrão que o resto
  do app precisa migrar para bater.
- **Sequência:** focar 100% em fechar o Presença (todas as telas
  pendentes) antes de começar o redesign do Cuida — não vai entrar em
  paralelo.
- **Cadastro de Prática (admin) fica pra depois, agrupado com trabalho
  administrativo** — mas não é tecnicamente uma tela do Cuida. É mais
  próxima do painel `/admin/biblioteca` já documentado (superfície própria,
  terapeuta não tem acesso). Vai ser feita na mesma leva por conveniência
  de contexto (ambas puxam pra um registro visual mais direto/funcional),
  não porque pertence ao Cuida.

---

## 2. O que mudou, sistema antigo → novo

| | Antes | Depois |
|---|---|---|
| Tipografia | Spectral, família única, sem sans-serif | Fraunces (display/headline/body) + Bitter (label/botão/navegação) |
| Ícones | Não documentados formalmente antes deste processo | Traço único, orgânico, sem preenchimento — nunca biblioteca de ícone padrão (Material Symbols excluído explicitamente) |
| Ambiente claro/escuro | Escuro = Livro Vivo, Diário, Práticas (regra do PRD §6) | Escuro = só Diário e Livro Vivo. Lente do dia, Autor, Práticas passam a claro/híbrido |
| Imagens de cena | "4-6 variações estáticas" cobrindo repetição (PRD §7) | Atmosfera fundida ao fundo (lago na Home, sala no Diário/Livro Vivo), baixa opacidade, sem borda — não são mais fotos emolduradas |
| Navegação mobile | Só um "voltar" discreto no header, sem menu fixo | Barra inferior fixa com 5 itens (Home, Livro Vivo, Diário, Práticas, Conversa), ícone + rótulo |
| Estrutura da Home | Quase em branco, um convite por vez | 6-7 blocos hierárquicos (saudação, lente do dia, terapeuta condicional, prática, diário, livro vivo), cada um "porta, não vitrine" |

---

## 3. Telas desenhadas até agora

**Prontas e conferidas:**
1. Home ✅ — ícones limpos (7→1→0 Material Symbols, confirmado no código)
2. Lente do dia — leitura completa ✅
3. Lente do dia — contexto/"Entenda" ✅
4. Detalhe da Prática ✅
5. Registro no Diário ✅
6. Acervo do Livro Vivo ✅
7. Leitura do Livro Vivo ✅
8. "Do seu terapeuta" (conteúdo recebido) ✅
9. Autor da prática ✅
10. Fechamento do dia (modal) ✅ — corrigido, resumo de atividades removido
11. Conversa (chat) ✅
12. Fechamento da conversa ✅
13. Perfil ✅

**Gerada mas não confirmada como parte do escopo:**
- Biblioteca de práticas — apareceu numa rodada sem ter sido pedida.
  Pendente: você decidir se mantém ou descarta (ver seção 4).

**Ícones:** os 5 do menu inferior (Home, Livro Vivo, Diário, Práticas,
Conversa) já estão prontos como SVG próprio, fora do Stitch —
`presenca-icones-menu.html`. Ícones menores dentro de telas específicas
(reação, salvar, compartilhar) ainda dependem de o Stitch acertar, tela por
tela.


---

## 4. Pendência antes de considerar isto pronto

- [ ] Confirmar que a última correção pedida ao Stitch (bloco "Dr. Arnaldo"
      restaurado na versão com atmosfera + placeholder genérico removido do
      Diário) voltou limpa. Ainda não conferimos o resultado.
- [ ] Decidir o status do **Cuida** (`apps/cuida`) — ele tem identidade
      própria documentada (Spectral nos títulos, teal como cor de
      assinatura, separado esteticamente do Presença). Esse redesign migra
      o Cuida também pro sistema novo (Fraunces/Bitter), ou o Cuida mantém
      a identidade separada que já tinha? **Não decidido ainda.**

---

## 5. Inventário de migração — o que ainda usa o sistema antigo

Rotas hoje existentes em `apps/presenca/app/` e o status de cada uma frente
ao redesign:

| Rota | O que é | Status |
|---|---|---|
| `app/home` | Home atual | 🟡 Substituída pelo design novo — falta implementar |
| `app/conversa` | Chat com a IA | 🟡 Prompt escrito, aguardando Stitch |
| `app/diario` | Diário | ✅ Redesenhada (tela de registro) |
| `app/livro-vivo` | Livro Vivo | ✅ Redesenhada (acervo + leitura) |
| `app/praticas` (~~+ `app/folego`~~) | Práticas — respiração 4-7-8 vira estado interativo de `praticas/[id]`, não rota própria | 🟡 Detalhe pronto; falta desenhar o **estado ativo** (o círculo de respiração de verdade, depois de tocar "Começar") |
| `app/perfil` | Perfil do usuário | 🟡 Prompt escrito, aguardando Stitch |
| `app/terapia` | Conexão com profissional | ⬜ Não iniciado |
| `app/hoje` | Check-in "como está sua presença hoje" | ❌ **Removida por decisão** — absorvida pelo bloco de saudação da Home, a rota separada deixa de existir |
| `app/recursos` | Rede de segurança (CVV/SAMU) | ⬜ Não iniciado — conteúdo é fixo por princípio, mas a casca visual precisa bater |
| `app/chegada`, `app/bem-vindo`, `app/login`, `app/conta` | Onboarding e autenticação | 🟠 Reportadas como geradas, aguardando conferência — Chegada tem uma frase de privacidade que precisa de revisão jurídica antes de virar copy final |
| `app/limites-de-cuidado`, `app/privacidade` | Páginas legais/institucionais | 🟠 **Decisão nova: unificadas numa página só** (antes eram 2 rotas separadas). Reportada como gerada, aguardando conferência — e falta decidir a implicação técnica: uma rota redireciona pra outra, ou as duas passam a renderizar o mesmo conteúdo? |
| *(nova)* Cadastro de Prática | Admin — formulário de entrada de conteúdo, substitui `scripts/cadastrar-biblioteca.mjs` | 🟡 Prompt escrito, aguardando Stitch |

**Novidade sem equivalente na versão antiga** (telas que não existiam antes
e nasceram deste redesign): Lente do dia, Autor da prática, "Do seu
terapeuta" como tela própria, Fechamento do dia, Fechamento da conversa,
Cadastro de Prática (admin).

---

## 7. Onde estamos antes de partir pro Cuida

**Cobertas (prontas ou com prompt escrito, aguardando Stitch):** Home,
Lente do dia (leitura + contexto), Detalhe da Prática, Registro no Diário,
Livro Vivo (acervo + leitura), "Do seu terapeuta", Autor da prática,
Fechamento do dia, Fechamento da conversa, Conversa, Perfil, Cadastro de
Prática (admin) — **12 telas** no total entre prontas e em fila.

**Ainda sem prompt escrito, sem cobertura nenhuma:**
- `app/terapia` — conexão com profissional (fluxo de código de convite)
- `app/recursos` — CVV/SAMU/rede de segurança
- `app/chegada`, `app/bem-vindo`, `app/login`, `app/conta` — onboarding e
  autenticação (4 telas)
- `app/limites-de-cuidado`, `app/privacidade` — páginas legais (2 telas)
- A experiência interativa de respiração em si — ❌ **`/folego` deixa de
  existir como rota própria** (decisão desta sessão). Vira um estado da
  própria tela `praticas/[id]` (a "Detalhe da Prática" já desenhada), não
  uma rota especial só pra essa prática. Ver seção 7 sobre o que falta
  desenhar por causa dessa mudança.

**Removida:** `app/hoje` (por decisão desta sessão).

**Total pendente antes de considerar o Presença "completo" no sistema
novo:** pelo menos 9 telas/fluxos, sem contar o Cuida.

Isso é uma quantidade real de trabalho ainda pela frente — vale decidir se
todas essas passam pelo mesmo processo de prompt+Stitch antes do Cuida
começar, ou se algumas (principalmente as legais/onboarding, que são mais
funcionais que visuais) podem esperar e o Cuida entra em paralelo.

---

## 8. Status

Redesign da Home e telas de profundidade: 9/9 desenhadas, 1 pendência de
correção a confirmar. Migração do resto do app: não iniciada — este
documento é o inventário de referência pra quando isso começar, não uma
tarefa já em andamento.
