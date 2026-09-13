# DESIGN_DIRECTION.md — Direção Visual do Laboratório

**Status:** Direção visual da V1 **decidida** — Variação D aprovada após protótipo funcional na Etapa 4 (ver seção 14). Este documento (seções 1-13) permanece como o registro da proposta original; a seção 14 registra o que foi de fato escolhido, testado com dados reais de Guilherme, e o que ela substitui.
**Versão:** 0.2 (seção 14 adicionada; seções 1-13 preservadas como histórico da proposta pré-Etapa 4)
**Objetivo:** definir a linguagem visual da primeira versão funcional, concreta o bastante para orientar a Etapa 4 do `IMPLEMENTATION_PLAN.md`, sem ser uma especificação de UI final de produto.

Este documento parte diretamente do esboço que Guilherme trouxe — a tela de "Hoje" com os três sistemas como três perspectivas sobre o mesmo momento, a navegação como mudança de lente, e "Pessoa" como base de identidade, visualmente distinta do resto. O que segue formaliza essa direção e preenche o que falta para virar um sistema de componentes implementável.

---

# 1. Princípios visuais

1. **O tempo é o protagonista, não a previsão.** A interface é um instrumento de observação do presente, não um oráculo — sem urgência, sem alarme, sem "novidade" piscando.
2. **Silêncio antes de estímulo.** Muito espaço em branco, poucas bordas, poucos elementos por tela. Se uma tela parece "cheia", ela está errada.
3. **Três vozes, uma casa.** Os três sistemas não competem por atenção visual — dividem a mesma linguagem tipográfica, a mesma paleta, o mesmo ritmo. A diferença entre eles é só um identificador pequeno e o nome do dado central, nunca cor, nunca layout — exatamente como no esboço original.
4. **Números como fato, não como decoração.** Kin 169, Dia Pessoal 7, Gate 4 são resultados de cálculo determinístico já validado. A tipografia trata isso com a seriedade de uma data ou uma hora: grande, claro, sem ornamento em volta.
5. **A tecnologia desaparece.** Sem gradientes, sem sombras pesadas, sem ícones genéricos de dashboard. Se algo parece que poderia estar num app de banco ou de produtividade, está errado.
6. **Honestidade visual sobre nativo vs. composição.** Onde `composition_status = experimental` (`IMPLEMENTATION_PLAN.md` §2), a interface diz isso — discretamente, mas sem esconder.

---

# 2. Atmosfera

**Não é:** horóscopo de revista, tarot esotérico genérico, app místico roxo/dourado, dashboard SaaS, app clínico, calendário corporativo.

**É:** mais perto de um caderno de campo bem-feito, um relógio analógico simples, uma página de diário editorial — o tipo de objeto que alguém folheia com prazer de manhã, não que "checa" como quem checa notificação. Sensação-alvo: **tempo, consciência, ciclos, contemplação, clareza.** Luz de manhã, não neon. Papel, não vidro brilhante.

Concordo com a leitura de Guilherme: **fundo claro levemente quente, bastante espaço, tipografia editorial, poucos contornos, animações muito discretas** — essa é exatamente a temperatura certa.

---

# 3. Tipografia

- **Uma serifada editorial** para títulos, números centrais e a marca do produto — carrega o tom "contemplativo, humano, não corporativo". Precisa de bom peso em tamanhos grandes, sem parecer decorativa.
- **Uma sans-serif neutra e muito legível** para corpo de texto, navegação, e o conteúdo técnico de "Entender o porquê" — prioriza legibilidade em tela pequena acima de personalidade.
- **Hierarquia por tamanho e peso, nunca por cor.**
- **Números recebem tratamento de destaque** onde são o dado central de um card — tamanho grande, peso leve a médio, serifado.

---

# 4. Paleta inicial

Uma paleta única para o produto inteiro — **os três sistemas não recebem cor própria** (confirmando a intuição de Guilherme: "não daria uma cor completamente diferente para cada método").

| Papel | Proposta |
|---|---|
| Fundo | Quase-branco quente (creme muito claro, não branco clínico) |
| Texto principal | Cinza-carvão escuro, não preto puro |
| Texto secundário | Cinza médio — subtítulos, rótulo de composição, metadados |
| Cor de destaque única | Um tom terroso discreto (terracota/ocre) OU um azul-tinta profundo — a decidir olhando os dois lado a lado na Etapa 4, não em documento |
| Rótulo "composição experimental" | Âmbar bem discreto, só no texto do rótulo — nunca colore o card inteiro |

Nada de roxo/dourado místico, nada de gradiente, nada de neon.

---

# 5. Hierarquia visual

Em qualquer tela de horizonte (Ano/Mês/Semana/Hoje), de cima para baixo:

1. **Cabeçalho contextual pequeno** — dia da semana + data (ex.: "SEXTA · 14 AGO"), discreto.
2. **Título do horizonte** + subtítulo curto e contemplativo (ex.: "Hoje" / "O momento que você está vivendo.").
3. **Os cards dos sistemas disponíveis** (1 a 3, nunca 0) — o elemento dominante.
4. **Navegação fixa** entre horizontes — sempre visível, nunca dominante.

Na tela **Pessoa** essa hierarquia muda — ver seção 8.

---

# 6. Navegação Pessoa → Ano → Mês → Semana → Hoje

Barra fixa (rodapé em mobile — alcance do polegar; pode migrar para o topo em telas maiores):

```
Pessoa   Ano   Mês   Semana   ● Hoje
```

Exatamente como no esboço de Guilherme. O ponto ativo (●) marca a posição atual. Sem ícone de calendário, sem seletor de data — a navegação é sobre **mudar de lente sobre o presente** (`PRD_v0.1.md` §4.1), nunca sobre escolher uma data. "Hoje" é o destino padrão ao abrir o app.

---

# 7. Estrutura dos cards dos três sistemas

> **Superseded pela seção 14.** O protótipo funcional (Etapa 4, Variação D) substituiu o card com caixa/borda por uma **linha** dentro de uma lista vertical contínua, sem grandes cards — a estrutura de conteúdo abaixo (símbolo, dado central, subtítulo, rótulo de composição, link) continua válida em espírito, mas a seção 14 é a versão atual do componente, incluindo os slots `Observe` e `Entender` que não existiam nesta proposta original.

Um componente único (`CardSistema`), reutilizado pelos três sistemas em qualquer horizonte que os suporte:

```
[símbolo]  NOME DO SISTEMA
[dado central — tipografia grande, serifada]
[subtítulo curto de contexto — 1 linha]
[rótulo "composição do produto" — só se experimental]
Entender o porquê →
```

Exemplo — Hoje, Design Humano (baseado diretamente no esboço trazido):
```
○  DESIGN HUMANO
Trânsito do dia
Gate 4 · Gate 49 · Gate 64...
Uma pequena leitura no seu desenho hoje.
Entender o porquê →
```

Exemplo — Hoje, Dreamspell:
```
◇  DREAMSPELL
Kin 131
Macaco Magnético Azul
Tom 1 · Magnético
Entender o porquê →
```

Exemplo — Hoje, Numerologia:
```
△  NUMEROLOGIA
Dia Pessoal 7
Número do seu ciclo de hoje.
Entender o porquê →
```

Exemplo — Semana, Numerologia (composição, precisa do rótulo):
```
△  NUMEROLOGIA
Dias Pessoais 6 · 7 · 8 · 9 · 1 · 2 · 3
Sequência da semana — composição do produto
Entender o porquê →
```

A estrutura nunca muda entre sistemas — só o conteúdo. Isso é o que garante "três vozes, uma casa".

---

# 8. Tela "Pessoa" — visualmente distinta, porque é a base, não um período

Concordo integralmente com a leitura de Guilherme: **Pessoa não é mais um período, é a base.** A hierarquia visual muda — o nome do participante funciona como um título de identidade (tratamento tipográfico de "capa", maior e mais deliberado que qualquer card), não como mais um dado entre outros:

```
GUILHERME
Sua configuração de origem.

○ DESIGN HUMANO
Gerador Manifestante
Autoridade Emocional · Perfil 3/5
Cruz da Fênix Adormecida
Explorar meu desenho →

◇ DREAMSPELL
Kin 169
Lua Cósmica Vermelha

△ NUMEROLOGIA
Destino 5 · Expressão 3 · Missão 8
Explorar meu mapa →
```

A tela comunica visualmente a ideia central do `FOUNDATION.md`: **quem eu sou → o ciclo maior que vivo → onde estou agora.** Pessoa é a fundação visual de onde as outras quatro telas partem — abrir Ano/Mês/Semana/Hoje depois de Pessoa deve parecer uma continuação natural, não uma seção separada do produto.

---

# 9. Tratamento visual de "Entender o porquê"

- **Expansível inline** (`<details>`/`<summary>` nativo ou equivalente), nunca modal, nunca nova página.
- Ao abrir, o registro visual muda: tipografia mais técnica/tabular (mesma sans-serif, tratamento tabular para números — ex.: `Sol · Gate 59 · Linha 3`), sinalizando "isto é a prova, não a leitura".
- Mostra os elementos brutos calculados + o rótulo curto da base de conhecimento — nada de prosa interpretativa ainda.

---

# 10. Diferenças visuais entre os três sistemas — sem virar três apps

O único diferenciador visual é:
1. Um **identificador pequeno**, consistente em toda a interface — proposta inicial (a mesma de Guilherme):
   - `○` Design Humano
   - `◇` Dreamspell
   - `△` Numerologia
2. O **nome do dado central** (Gate vs. Kin vs. Dia Pessoal) — que já é inerentemente diferente porque os sistemas são diferentes.

**Nunca usados para diferenciar sistemas**: cor, fonte, layout de card, posição na tela, tom de voz. Isso reforça a ideia mais forte do esboço original: **os sistemas são diferentes, mas todos estão olhando para a mesma pessoa, no mesmo momento.**

Os símbolos `○ ◇ △` são suficientes para a Etapa 4 — podem evoluir para glifos desenhados sob medida numa fase posterior, sem alterar o princípio.

---

# 11. Proposta mobile-first

- Cards empilhados verticalmente, um por vez, largura total, respiro generoso — nunca grid apertado.
- Navegação fixa no rodapé (alcance do polegar).
- Toques grandes, especialmente em "Entender o porquê →".
- Tipografia fluida — testar primeiro em viewport ~375-414px; telas maiores são expansão, não o caso base.
- Nenhuma dependência de hover — tudo funciona por toque desde o início.

---

# 12. Componentes reutilizáveis necessários (Etapa 4 do `IMPLEMENTATION_PLAN.md`)

| Componente | Função |
|---|---|
| `AppShell` | fundo, respiro/margens seguras, container base |
| `NavHorizontes` | barra fixa com os 5 horizontes + ponto ativo |
| `CabecalhoContextual` | dia da semana + data (Ano/Mês/Semana/Hoje) |
| `CardSistema` | símbolo + nome + dado central + subtítulo + rótulo de composição opcional + link "Entender o porquê" |
| `SimboloSistema` | os três glifos (`○ ◇ △`), isolado para reuso consistente |
| `EntenderPorque` | disclosure expansível, tratamento tipográfico técnico/tabular |
| `RotuloComposicao` | selo pequeno e discreto para `composition_status = experimental` |
| `CabecalhoPessoa` | tratamento tipográfico de "capa" para o nome do participante |
| `SeletorParticipante` | necessário a partir da Etapa 10 (4 participantes) — vale desenhar já na Etapa 4 |
| `FormularioCadastro` | utilitário, não segue o mesmo cuidado visual das telas de experiência (`IMPLEMENTATION_PLAN.md` §7) |

---

# 13. O que este documento não decide

A cor de destaque exata (terracota vs. azul-tinta) e os glifos definitivos dos três sistemas ficam como propostas a testar visualmente na Etapa 4 — o momento certo para fechar isso é olhando os componentes renderizados de verdade, não em documento.

> **Resolvido na seção 14.** A Etapa 4 testou quatro variações renderizadas com dados reais de Guilherme; terracota foi a cor de destaque escolhida (dentro da Variação D), e os glifos `○ ◇ △` desta seção 10 foram confirmados sem alteração.

---

# 14. Decisão registrada pós-Etapa 4 — Variação D é a direção visual da V1

## 14.1 O que foi testado

Quatro variações da tela Hoje foram implementadas como HTML funcional (não wireframe), renderizadas com o Dia Pessoal real de Guilherme (14/08/2026), e avaliadas em viewport mobile (~390px):

| Variação | Testava | Veredito |
|---|---|---|
| A — Caderno de Campo | leitura literal desta proposta (cards, fundo creme, terracota) | vencedora na **direção emocional/visual** |
| B — Foco Único | um momento dominante em vez de três blocos equivalentes | **descartada** — cria hierarquia excessiva entre os sistemas, contraria o princípio "três vozes, uma casa" (seção 1.3) |
| C — Lista Editorial | remover a caixa/card, três sistemas no mesmo nível, maior densidade | vencedora na **arquitetura de informação** |
| **D — combinação A + C** | tom/calor de A sobre a arquitetura de C | **aprovada como direção da V1** |

## 14.2 O que a Variação D decide (substitui a proposta original onde conflitar)

**Preservado sem alteração** desta proposta original: paleta (fundo creme quente, texto carvão, terracota como destaque único — seção 4), tipografia serifada editorial + sans neutra (seção 3), os três glifos `○ ◇ △` (seção 10), a barra de navegação fixa Pessoa→Ano→Mês→Semana→Hoje (seção 6), cabeçalho contextual + título + subtítulo (seção 5, itens 1-2).

**Alterado em relação à proposta original:**

1. **Sem `CardSistema` com caixa/borda.** Os três sistemas vivem em uma lista vertical única, separados por fios finos (`separador`), não por cards com fundo/borda própria — mais perto do "caderno de campo" que a seção 2 (Atmosfera) já descrevia em palavras, mas que a proposta original de card ainda não tinha alcançado visualmente.
2. **Dado central é sempre uma unidade semântica**, nunca isolado como métrica alinhada à direita — "Dia Pessoal 1" é uma frase, não um par rótulo/valor. Testado e descartado na Variação C original.
3. **Estrutura de cada linha de sistema, com 5 posições fixas, nesta ordem:**
   ```
   Identificação do sistema (símbolo + nome)
   Dado calculado principal (unidade semântica)
   Leitura curta (factual, não interpretativa — a única camada que existe hoje)
   Observe (componente reservado — ver 14.3)
   Entender (controle de disclosure — ver 14.4)
   ```
   Isso substitui a estrutura de 4 linhas da seção 7 (símbolo/nome, dado, subtítulo, rótulo+link) — a nova estrutura já reserva o lugar de uma camada interpretativa futura (`Observe`) que a proposta original não previa.
4. **`Observe` é um componente visual próprio**, não uma linha de texto solta: régua fina à esquerda + rótulo pequeno versalete "OBSERVE" + texto abaixo. Hoje, para todo participante, ele só existe nesse estado reservado ("Reservado para quando a base de conhecimento curada existir — Etapa 6") — **nenhuma interpretação foi escrita**. O componente existe para que, quando a Etapa 6 chegar, o conteúdo real entre no mesmo encaixe, sem redesenho.
5. **`Entender` é minimizado e passa a ser só o controle.** Não carrega mais texto explicativo ao lado (a proposta anterior testou e descartou "· explicar cálculo" / "· cálculo aberto abaixo" como ruído). É um `<details>/<summary>` nativo rotulado apenas "Entender", com indicador `＋`/`－`; a explicação de cálculo/origem (elementos brutos + chave de período) só aparece depois do toque, nunca antes. A leitura factual acima dele é, deliberadamente, mais proeminente visualmente do que este controle.
6. **Pessoa recebe tratamento tipográfico distinto na navegação** — versalete com leve tracking + um divisor vertical fino entre "PESSOA" e os quatro horizontes temporais (`Ano Mês Semana Hoje`), sem introduzir um ícone genérico novo. Isso é a expressão concreta, na barra de navegação, do princípio já registrado na seção 8: "Pessoa não é mais um período, é a base."

## 14.3 Sobre o componente `Observe`

`Observe` é reservado para uma camada de observação futura — mais próxima de "o que reparar" do que "o que isso significa" (que seria a leitura/interpretação em si, papel do texto principal). Ele não tem conteúdo definido ainda porque:
- depende da base de conhecimento curada (`BaseConhecimento`, Etapa 6), que ainda não existe;
- o princípio "cálculo → conhecimento → interface, sem camada generativa mascarando problemas" (instrução explícita para esta fase) proíbe preencher esse espaço com texto de IA ou interpretação inventada agora.

O componente existe hoje só como **encaixe estrutural testado visualmente** — confirma que a composição comporta uma quarta camada de conteúdo sem quebrar o ritmo da tela, antes de essa camada ter conteúdo real.

## 14.4 Sobre o componente `Entender`

Contrato: **um único controle, rotulado "Entender"**, sem texto adicional visível antes da interação. Ao abrir, mostra os elementos calculados brutos e a chave de período (rastreabilidade mínima da seção 9), em tratamento tipográfico tabular/técnico — isso não muda em relação à proposta original, só a **proeminência visual antes do toque**, que cai.

## 14.5 Onde ver

- Protótipo interativo (4 variações + Variação D refinada): artifact "Hoje, em Três Vozes" (rodado nesta sessão de trabalho).
- Screenshots estáticos: `docs/etapa4-hoje-variacao-a-caderno-de-campo.png`, `-b-foco-unico.png`, `-c-lista-editorial.png`, `-d-combinacao-a-c.png`.

## 14.6 Impacto na tabela de componentes (seção 12)

`CardSistema` é renomeado/redefinido como `LinhaSistema` (lista, não card) e ganha dois sub-componentes novos: `ObserveReservado` e `EntenderDisclosure`. `NavHorizontes` ganha a variação de tratamento para a parada `Pessoa` (versalete + divisor). Os demais componentes da tabela original (`AppShell`, `CabecalhoContextual`, `SimboloSistema`, `RotuloComposicao`, `CabecalhoPessoa`, `SeletorParticipante`, `FormularioCadastro`) não mudam.
