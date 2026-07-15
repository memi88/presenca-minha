# Presença — Arquitetura de Inteligência

> Documento complementar ao PRD principal (`presenca-prd.md`) e ao documento de voz (`presenca-voz-de-marca.md`). Foco exclusivo em como a IA do Presença pensa, decide e se comporta — modelo por modelo, gatilho por gatilho.

---

## 1. Princípio que governa tudo aqui

O chat não é terapia, e não existe pra reter a pessoa no app. Existe pra acolher, escutar, regular, e devolver a pessoa pra própria vida mais presente do que ela chegou. Sucesso não se mede por tempo dentro do app — mede-se pelos momentos em que a pessoa esteve mais presente *fora* dele.

Isso é comportamento, não só economia de token: a conversa tende à brevidade por design. Depois que a pessoa chega a algum estado de regulação, a IA convida ao fechamento em vez de prolongar ou aprofundar — inclusive contra o instinto comum de produto de maximizar engajamento. Aqui é o oposto de propósito.

Esse princípio é o pilar 5 do documento de voz e restringe toda decisão técnica abaixo.

---

## 2. Configuração de modelos — quem faz o quê

| Etapa | Quem faz | Modelo/serviço |
|---|---|---|
| Selecionar o que recomendar (prática, página, ordem do Livro Vivo) | Busca no banco | Nenhum LLM — SQL + `pgvector` |
| Microcopy (saudação da Home, reentrada, convite de prática, encerramento, resumo, notificações) | Personalização leve | Claude Haiku 4.5, via API Anthropic |
| Conversa principal (acolhimento, regulação, reconhecimento de risco) | Conversa de verdade | Claude Sonnet 5, via API Anthropic |
| Verificação extra de sinal de risco, em paralelo à conversa | Camada de segurança | Llama Guard 3, via Cloudflare Workers AI |
| Cálculo de Human Design + embeddings | Cálculo determinístico | Microsserviço Python próprio (Render/Railway) |

**Por que não Llama pra microcopy:** testamos lado a lado (Llama 3.1 8B/3.3 70B via Cloudflare, Claude Sonnet/Haiku, GPT-4.1/4o-mini) com o mesmo system prompt de voz de marca, rodando cada cenário 3x pra medir consistência, não só uma amostra. O achado decisivo: numa instrução explícita e objetiva ("nunca presuma o gênero da pessoa"), Claude e GPT seguiram 100% das vezes (0 deslizes em 24 amostras combinadas); o Llama ignorou a instrução em 1 a cada 3 chamadas, de forma repetida, inclusive depois do prompt já ter sido ajustado especificamente pra isso. Isso bate com a literatura (benchmarks de detecção de crise e QA médico em português mostram modelos fechados na frente de modelos abertos, com a diferença maior em modelos menores) — mas aqui foi confirmado com teste próprio, não só citação de terceiros. Descartado por enquanto.

**Por que não GPT (OpenAI) em produção:** também testado lado a lado. Qualidade de conteúdo foi genuinamente boa (inclusive ecoando vocabulário do próprio prompt), mas ficou sistematicamente mais verboso que Claude em toda tarefa de personalização (2-4 frases vs. 1-2), contra o princípio de "menos é mais" do documento de voz, e numa amostra usou linguagem técnica explicitamente banida ("técnica 4-7-8"). Ficar num provedor só (Anthropic) também simplifica observabilidade, rate limiting e billing.

**Por que Haiku (não Sonnet) pra microcopy:** mesmo provedor do Sonnet — não há perda de confiabilidade por trocar de fornecedor, só uma escolha de custo/latência dentro da própria Anthropic pra tarefas curtas e de alto volume (saudação, notificação, etc.), onde o risco de erro é baixo porque o conteúdo de base já vem curado da Biblioteca.

---

## 3. O núcleo Presença

Todo o conhecimento que alimenta as sugestões da IA — Livro Vivo, práticas, e as **traduções** (conteúdo autoral que traduz cálculo técnico em insight utilizável: traduções de Design Humano hoje, Kaballah futuramente/V2) — vive na tabela `biblioteca`, com embedding e tags como qualquer outro item.

**Regra de bastidor (crítica, e agora um princípio permanente, não regra ad-hoc):** "O Presença utiliza diferentes linguagens de compreensão humana apenas como referências silenciosas para ampliar a qualidade do cuidado." As traduções (DH, Kaballah, e qualquer linguagem futura que venha a entrar) são conhecimento interno da IA, nunca vocabulário exposto ao usuário. A pessoa recebe o insight, nunca o termo técnico por trás. Isso vale por princípio — não precisa ser redecidido a cada nova linguagem que entrar no núcleo. Nenhuma linguagem possui a verdade: são todas lentes, nunca doutrina.

---

## 4. Como a conversa realmente funciona

A conversa roda, a cada mensagem, com base em três coisas apenas:
1. **Configuração da pessoa** (Human Design, já calculado uma vez, estático).
2. **Momento atual** (capturado no check-in "como está sua presença hoje?").
3. **System prompt da essência** (os cinco pilares do documento de voz).

Isso já é suficiente pra acolher, escutar e regular — **não há busca no núcleo Presença a cada mensagem.** Buscar o tempo todo puxaria a conversa pra um registro mais explicativo/didático, contrário a "acolher levemente". O princípio de fundo aqui: *o cuidado antecede qualquer interpretação* — a conversa nunca espera calcular a resposta "certa" antes de simplesmente estar presente.

A busca no núcleo Presença acontece **só num momento pontual**: quando a conversa chega num ponto de sugerir algo concreto (uma página, uma prática). Nesse momento, uma única busca por proximidade semântica escolhe o material mais relevante pra fundamentar aquela sugestão específica — nunca inventando fora do que está curado.

---

## 5. Gatilhos da recomendação — mapa completo

**Carregamento de tela** (recalculado toda vez que a tela abre):
- Saudação da Home — dia da semana, fase da lua, tempo desde última visita, pergunta em aberto do profissional, últimas entradas do Caderno.
- Ordem do Livro Vivo — tag de momento de vida + proximidade semântica com o momento atual.
- Cena visual (Home/Conversa) — hora do dia, fase da lua, estação.

**Entrada única** (uma vez, no início da sessão):
- Check-in "como está sua presença hoje?" — muda a própria estrutura da tela seguinte, não só o conteúdo (quem responde "confuso" vê só 3 opções; quem responde "em paz" vê o ambiente completo).

**Dentro da conversa** (julgamento do Claude, não regra fixa):
- Convite de prática/meditação — reconhecido pela conversa.
- Convite de dado de nascimento — só se o tema pedir, nunca por entrar numa tela.
- Busca pontual no núcleo Presença — no momento de sugerir algo concreto, não a cada mensagem.
- Reconhecimento de risco → Protocolo — detecção, sempre leva ao mesmo caminho travado (Recursos), verificado em paralelo pelo Llama Guard. **Nunca personalizado, nunca varia por sinal.**

**Por evento** (quando algo é salvo, não quando uma tela abre):
- "A IA percebe conexões" — disparado ao salvar nova entrada do Caderno; compara contra perguntas em aberto do profissional e entradas marcadas `revisitar`; notificação gentil se a similaridade passar do limiar.

---

## 6. Custo estimado (piloto — 3 terapeutas + ~15-20 pacientes)

Preço Sonnet 5: $2/milhão tokens entrada, $10/milhão saída (promocional até 31/08/2026; depois $3/$15). Preço Haiku 4.5: $1/milhão entrada, $5/milhão saída.

- **Claude Sonnet 5 (conversa):** ~$25-35/mês, estimando ~100 mensagens/dia com conversas propositalmente breves.
- **Claude Haiku 4.5 (microcopy — home, reentrada, convite, encerramento, resumo, notificações):** volume bem maior que a conversa (várias chamadas por sessão), mas cada uma é curta. Estimativa inicial ~$3-6/mês nesse volume de piloto — a confirmar com uso real. Cache de prompt ajuda bastante aqui, já que o system prompt de microcopy se repete em toda chamada.
- **Cloudflare Workers AI** (só Llama Guard 3 agora, camada de segurança): dentro do free tier (10.000 neurons/dia) nesse volume — provavelmente **$0**.
- **Microsserviço Python** (Human Design + embeddings): ~$5-7/mês, já orçado independente da IA de conversa.

**Total estimado: ~$35-45/mês pro piloto inteiro.** Ativar cache de prompt no Anthropic reduz ainda mais (os system prompts de conversa e de microcopy são conteúdo repetido, se beneficiam bastante) — vale medir com uso real antes de fechar o número.

**Parâmetro de busca no núcleo (ajustável):** top-k = 3 trechos, ~200 tokens cada, como ponto de partida — ajustável com dado real de uso.

---

## 7. Segurança — não negociável

- Recursos / Protocolo de risco **nunca variam por sinal, nunca são personalizados** — sempre o mesmo caminho, sempre visível, nos dois cenários (com/sem profissional conectado).
- Llama Guard 3 roda em paralelo à conversa principal como segunda camada de verificação — reforço, não substituição do Claude.
- Nenhuma anotação clínica do profissional é acessível via IA — o núcleo Presença e o RAG operam só sobre conteúdo curado (Biblioteca) e sobre o próprio Caderno da pessoa, nunca cruzando entre usuários.
