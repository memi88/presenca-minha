# Presença — PRD (Product Requirements Document)

> Este documento orienta o desenvolvimento técnico. Seu par é o `presenca-voz-de-marca.md` (voz, tom, conteúdo) e o Livro Zero (visão/manifesto). Este aqui existe para que qualquer pessoa — ou o Claude Code — consiga construir sem precisar adivinhar uma decisão sequer.

---

## 1. O que é o Presença, em uma frase técnica

Um app onde uma pessoa mantém um caderno pessoal contínuo (Meu Livro), acompanhado por uma biblioteca curada de conteúdo (Livro Vivo) e, opcionalmente, por um profissional conectado (terapeuta, e no futuro outros). **Presença não substitui nada — ele costura** o intervalo entre os momentos em que a vida acontece.

Não é dois produtos. É um app único que se comporta diferente conforme um atributo do usuário: tem ou não um profissional conectado.

---

## 2. Princípios que restringem toda decisão técnica

Estes princípios vêm do Livro Zero e da voz de marca — toda decisão de arquitetura abaixo foi tomada para servi-los, não apesar deles:

1. **A tecnologia deve desaparecer.** Quanto menos a pessoa perceber o sistema, melhor. → implica revelação contextual no onboarding, nunca formulário-portão.
2. **A IA nunca é protagonista, é companheira.** → implica pipeline determinístico primeiro, IA só na personalização de entrega, nunca gerando conteúdo espiritual/terapêutico do zero.
3. **O reconhecimento não é rótulo.** A IA nunca devolve à pessoa uma afirmação tipo "você está ansioso" — comportamento identificado é sinal interno para curadoria, nunca uma etiqueta mostrada.
4. **Os dois cenários (com/sem profissional) são igualmente válidos.** Nenhum é uma versão incompleta do outro.
5. **Privacidade por arquitetura, não por promessa.** O profissional nunca vê o raciocínio clínico do outro lado nem o app "vaza" dados entre os dois cadernos — o compartilhamento é sempre um ato deliberado e pequeno (uma pergunta, uma prática, uma página), nunca acesso amplo.

---

## 3. Arquitetura do produto

### 3.1 Componentes
- **Presença (o app)** — experiência do usuário final. Ambiente claro (funcional) + ambiente escuro (contemplativo).
- **Cuida** — portal do profissional conectado. Superfície separada, mesmo backend.
- **Entre Cinzas e Fôlego** — Instagram, fora do escopo deste PRD (ver documento de voz).

### 3.2 Stack técnico
**PWA (Progressive Web App), não app nativo.** As telas geradas no Claude Design usam moldura de iPhone só como referência visual de proporção — isso não implica app nativo iOS. Confirmado: Next.js + Supabase, rodando no navegador com manifest + service worker, instalável na tela inicial sem passar por App Store/Play Store. Isso é consistente com o resto do stack de Guilherme (Facilita, brain da Julie) e evita o ciclo de aprovação e as duas codebases nativas que um app iOS/Android exigiria.

Duas peças que seguem em aberto, sem travar o início do código (podem ficar como stub/placeholder até decidir):
- **Modelo de embeddings** — ainda não escolhido especificamente.
- **LLM de entrega** (personalização de saudação, tom, etc.) — ainda não escolhido especificamente.

### 3.3 Os dois cenários
| | Sem profissional conectado | Com profissional conectado |
|---|---|---|
| Quem acompanha | A própria obra (biblioteca pública) | Biblioteca pública + conteúdo indicado pelo profissional |
| Caderno | Só o usuário escreve | Usuário escreve; profissional pode adicionar unidades pequenas (pergunta, prática, página, símbolo, frase) |
| Chat | Usa contexto geral do usuário | Também conhece o que o profissional indicou |

O atributo que decide isso é `profissional_id` no perfil do usuário (nulo ou preenchido) — não é uma escolha de produto, é um dado.

### 3.4 Os três livros
- **Livro Zero** — não é uma tabela no banco. É este conjunto de documentos, vive fora do app.
- **Livro Vivo** — conteúdo curado (autoral, escrito por Guilherme/colaboradores convidados), taggeado por momento de vida, tipo de configuração HD, fase lunar, etc. Todo usuário lê da mesma fonte.
- **Meu Livro (Caderno)** — privado, por usuário. Entradas com autoria clara (usuário vs. profissional conectado), nunca misturadas visualmente.

---

## 4. Modelo de dados (V1 — já com embeddings desde o início)

Banco: **Supabase (Postgres + RLS desde a primeira tabela + `pgvector` habilitado desde o primeiro commit)**. Não há uma "fase sem embeddings" — o cálculo é barato e por item, então liga desde o V1. O que naturalmente amadurece com o tempo não é o mecanismo, é a quantidade de material disponível pra comparar (ver seção 7).

```sql
-- Usuários (estende auth.users do Supabase)
create table profiles (
  id uuid primary key references auth.users(id),
  nome text,
  data_nascimento date,
  hora_nascimento time,          -- opcional, nulo se não informado
  local_nascimento text,          -- opcional
  configuracao_hd jsonb,          -- calculado quando data+hora+local existirem
  profissional_id uuid references profissionais(id),  -- nulo = sem profissional conectado
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "usuário lê e edita o próprio perfil"
  on profiles for all using (auth.uid() = id);

-- Profissionais (terapeutas hoje; genérico por design)
create table profissionais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text default 'terapeuta', -- 'terapeuta' | 'nutricionista' | 'fono' | outros no futuro
  user_id uuid references auth.users(id), -- login do profissional no Cuida
  created_at timestamptz default now()
);
alter table profissionais enable row level security;
create policy "profissional lê e edita o próprio registro"
  on profissionais for all using (auth.uid() = user_id);

-- Vínculo profissional <-> paciente (permite múltiplos pacientes por profissional)
create table vinculos (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid references profissionais(id),
  paciente_id uuid references profiles(id),
  ativo boolean default true,
  created_at timestamptz default now(),
  unique (profissional_id, paciente_id)
);
alter table vinculos enable row level security;
create policy "profissional vê vínculos onde é o profissional"
  on vinculos for select using (
    auth.uid() = (select user_id from profissionais where id = profissional_id)
  );
create policy "paciente vê o próprio vínculo"
  on vinculos for select using (auth.uid() = paciente_id);

-- Biblioteca (Livro Vivo, práticas, áudios, exercícios — curado, não gerado por usuário)
create table biblioteca (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,              -- 'pagina_livro_vivo' | 'pratica' | 'audio' | 'musica' | 'pergunta' | 'exercicio'
  titulo text,
  conteudo text not null,
  tags_momento_vida text[],        -- ex: ['confuso','precisa_coragem','perdeu_alguem']
  tags_hd text[],                  -- opcional, tipos de configuração para quem serve melhor
  ambiente text default 'escuro',  -- 'claro' | 'escuro' — em qual modo essa peça aparece
  autor text default 'Guilherme',
  publicado boolean default true,
  embedding vector(1536),          -- calculado uma vez, no cadastro/edição do conteúdo
  created_at timestamptz default now()
);
alter table biblioteca enable row level security;
create policy "qualquer usuário autenticado lê conteúdo publicado"
  on biblioteca for select using (publicado = true);
-- inserts/updates restritos a um papel de administrador (service_role via painel interno, nunca client-side)

-- Caderno (Meu Livro) — entradas do usuário e, quando aplicável, do profissional
create table caderno_entradas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references profiles(id) not null,
  autor_tipo text not null,        -- 'usuario' | 'profissional'
  autor_profissional_id uuid references profissionais(id), -- nulo se autor_tipo = 'usuario'
  tipo text default 'reflexao',    -- 'reflexao' | 'pergunta' | 'pratica_indicada' | 'pagina_indicada' | 'simbolo'
  conteudo text not null,
  biblioteca_ref_id uuid references biblioteca(id), -- se for uma página/prática indicada
  revisitar boolean default false, -- marcado pela própria pessoa: "quero pensar nisso com mais calma depois"
  embedding vector(1536),          -- calculado no momento em que a entrada é escrita
  created_at timestamptz default now()
);
alter table caderno_entradas enable row level security;
create policy "paciente lê e escreve suas próprias entradas"
  on caderno_entradas for all using (auth.uid() = paciente_id and autor_tipo = 'usuario');
create policy "paciente lê entradas do profissional vinculado"
  on caderno_entradas for select using (auth.uid() = paciente_id);
create policy "profissional insere apenas em pacientes vinculados"
  on caderno_entradas for insert with check (
    autor_tipo = 'profissional'
    and exists (
      select 1 from vinculos
      where vinculos.paciente_id = caderno_entradas.paciente_id
      and vinculos.profissional_id = caderno_entradas.autor_profissional_id
      and vinculos.ativo = true
    )
  );
-- profissional NUNCA tem select em caderno_entradas de tipo 'usuario' — só o que ele mesmo escreveu, se precisar conferir
```

**Nota de segurança explícita:** `service_role` nunca entra em código de frontend nem é acessível por agente de IA durante o desenvolvimento. Toda escrita na `biblioteca` (conteúdo curado) passa por um painel interno autenticado como admin, não pela API pública.

---

## 5. Onboarding (revelação contextual)

Fluxo:
1. **Entrada** (ambiente claro) — Landing + saudação, sem pedir decisão.
2. **Conversa inicial** (ambiente claro ou transição suave para escuro) — primeira interação real, sem pedir dado de nascimento.
3. **Fechamento leve** — pequeno encerramento, sem cobrança.
4. **Convite contextual posterior** — dentro da própria conversa, se o tema pedir (nunca ao entrar numa tela específica — isso reintroduziria formulário-portão). Quando o assunto tocar em algo que se beneficiaria de calibragem, surge o convite: *"posso te acompanhar de um jeito mais calibrado se você quiser me contar sobre sua chegada ao mundo — sem pressa, quando quiser."* Campo de hora tem escape explícito: *"não sabe a hora? sem problema — alguns insights ficam menos precisos, mas você ainda é bem-vindo aqui."*
5. **Conexão com profissional** — nunca no cadastro inicial. É uma ação dentro de "Terapia" (ou equivalente), disponível quando/se a pessoa quiser.

---

## 6. Ambientes: claro e escuro

Não é dark mode de preferência de usuário — é mudança de estado emocional da interface, com transição em fade entre rotas.

- **Claro:** Home, Dashboard, Reconhecimento, Perfil, Evolução, Conversas, Terapia, Configurações.
- **Escuro:** Livro Vivo, diário, meditação.
- **Gatilho na v1:** fixo por tela (mapeamento direto, sem lógica condicional). Evoluir para "por tipo de ação" é refinamento de versão futura.

Implementação: tokens de tema via CSS variables, troca de classe no layout raiz + transição de opacidade (~400–600ms) na troca de rota. Sem dependência de bibliotecas pesadas de animação — CSS transitions resolvem.

---

## 7. Pipeline de recomendação e IA

### De onde vem o "momento atual"
O filtro de recomendação (abaixo) depende de saber o momento de vida da pessoa *agora* — isso não é inferido por IA, é capturado de forma determinística: um check-in simples logo na entrada ("Como está sua presença hoje? — Confuso / Em paz / Cansado / Curioso / Não sei responder") gera diretamente o tag usado no filtro. Esse check-in também muda a própria estrutura da tela seguinte — quem responde "confuso", por exemplo, recebe só três opções (página do Livro Vivo, prática pequena, conversar), em vez do ambiente completo. O conteúdo da conversa em si pode refinar esse tag ao longo da sessão (via classificação leve pelo LLM de entrega), mas o ponto de entrada é sempre esse check-in explícito, nunca adivinhação.

### Como o mecanismo funciona, desde o V1
```
Sinais determinísticos → Filtro por tags + proximidade semântica → LLM personaliza a entrega
```
- Fase da lua: calculada localmente (função de data, sem serviço externo).
- Configuração HD: calculada uma vez no momento em que os dados de nascimento são informados (biblioteca/algoritmo determinístico de Human Design).
- Embedding: calculado por item, no momento em que ele é criado — cada página da biblioteca ao ser cadastrada, cada entrada do Caderno ao ser escrita. Não é "treino", é uma chamada rápida a um modelo de embeddings por peça de texto. Sem custo de esperar volume pra existir.
- Filtro: combina tags (`tags_momento_vida`, `tags_hd`) com proximidade semântica (`embedding <=> `) contra o conteúdo da biblioteca e, dentro do Caderno da própria pessoa, contra perguntas em aberto do profissional e entradas marcadas com `revisitar = true` — sempre dentro do universo de um único usuário, nunca cruzando entre pessoas.
- Entrega: chamada a um modelo de linguagem só para adaptar tom/fraseado ao contexto da conversa recente — nunca para inventar o conteúdo em si.

**O que realmente amadurece com o tempo não é o mecanismo — é o material disponível pra comparar.** No piloto (3 terapeutas, poucos pacientes), cada pessoa terá poucas entradas no próprio Caderno; a comparação semântica funciona desde o primeiro dia, mas a chance de encontrar uma conexão relevante é naturalmente baixa com pouco material. Isso se resolve sozinho conforme o uso cresce — não é um marco de "fase 2" a esperar, é maturação orgânica do mesmo sistema.

**Saídas concretas desse pipeline, usando os mesmos sinais:**
- **Saudação da Home** — varia por dia da semana, fase da lua, tempo desde a última visita, pergunta em aberto do profissional, e últimas entradas do Caderno. Decide o *tipo* de abertura (pergunta neutra / convite a celebrar / silêncio acolhedor / retomada de algo em aberto), nunca repete a mesma fórmula todo dia. **Limite crítico:** personaliza o tom da pergunta, nunca rotula a pessoa de volta (nunca "percebemos que você anda ansioso" — isso é diagnóstico, proibido pelo pilar 3).
- **Cena visual da Home/Conversa** — mesma linguagem estética (lago, luz âmbar), mas a imagem específica varia pelos mesmos sinais determinísticos (hora do dia, fase da lua, estação), evitando repetição da mesma imagem estática a cada acesso. 4-6 variações cobrem isso sem precisar de geração de imagem sob demanda.
- **Convite para Meditação/prática** — mesma lógica: o convite de entrada varia por sinal, nunca fórmula fixa.
- **Livro Vivo** — o conteúdo das páginas é fixo/curado (não personaliza a escrita), a *ordem/seleção* de qual página sobe primeiro varia por tag e por proximidade semântica com o momento atual.
- **Diário** — variação deliberadamente rara e opcional. É o único cômodo "página em branco"; sugestões de abertura recorrentes quebrariam a própria identidade de silêncio do espaço.
- **A IA como companheira, percebendo conexões:** quando uma nova entrada do Caderno se aproxima semanticamente de uma pergunta em aberto do profissional ou de uma entrada marcada `revisitar`, o sistema pode trazer isso à tona com uma notificação gentil — variando a frase conforme a origem: *"isso parece conversar com a pergunta que você recebeu — quer registrar?"* ou *"essa conversa está te lembrando de uma página que você escreveu — quer olhar de novo?"*. Nunca como tarefa, sempre como companhia. Enquanto o limiar de similaridade ainda não estiver bem calibrado (início do piloto), uma lista simples das entradas marcadas pra revisitar já entrega valor sozinha, sem depender do matching automático.
- **"Identificar comportamento":** resumo temático periódico das próprias entradas do usuário, usado só como sinal interno de curadoria — nunca devolvido como rótulo/diagnóstico à pessoa.

**Exceção explícita: Recursos / Protocolo de risco nunca variam por sinal.** Esse é o único lugar do app onde previsibilidade tem prioridade absoluta sobre personalização — o caminho, o texto e a apresentação precisam ser idênticos sempre, independente de lua, hora, embedding ou histórico. Estabilidade aqui é o que protege, não personalização.

---

## 8. Requisitos não funcionais

- **Segurança:** RLS em toda tabela desde o primeiro commit; nenhuma tabela sem policy antes de ir ao ar; `service_role` isolado do frontend e de agentes de IA.
- **Backup:** processo de backup manual configurado antes de qualquer dado real de terapeuta/paciente entrar no banco (plano free não tem backup automático).
- **Privacidade:** anotações clínicas do profissional nunca acessíveis via API pública; qualquer coisa que ele compartilhe passa por uma ação explícita de escrita numa entrada nova, nunca por leitura direta de um caderno externo.
- **Autoria visual:** entradas de profissional no Caderno usam tipografia visivelmente diferente das entradas do próprio usuário.

---

## 9. Fora de escopo (V1)

- Profissionais além de terapeuta (nutricionista, fono) — arquitetura já permite (`tipo` na tabela `profissionais`), mas não é prioridade para o piloto com os 3 terapeutas.
- Contribuição de usuários ao Livro Vivo público — não existe; Livro Vivo é sempre autoral/curado.
- Ambiente claro/escuro por tipo de ação (em vez de por tela fixa) — refinamento futuro.
- Tela de conexão com profissional para quem começou sem nenhum vinculado (V2 — provável via biblioteca pública com autoria).
- Painel admin sofisticado para a Biblioteca — cadastro de conteúdo pode ser direto no banco no V1.

---

## 10. Definição de pronto para o piloto (3 terapeutas)

- [ ] Cadastro + login funcionando.
- [ ] Onboarding com revelação contextual (sem formulário de nascimento na entrada).
- [ ] `pgvector` habilitado e embedding calculado por item (biblioteca ao cadastrar, Caderno ao escrever).
- [ ] Caderno funcionando (criar, ler entradas; marcar `revisitar`; autoria visual diferenciada).
- [ ] Vínculo profissional-paciente funcionando (Cuida básico: profissional vê os próprios pacientes vinculados e consegue escrever uma pergunta/prática/página no caderno de um paciente).
- [ ] Livro Vivo com um conjunto inicial de páginas/práticas cadastradas, já com embedding gerado (curadoria manual, sem precisar de admin panel sofisticado no início — pode ser inserido direto no banco).
- [ ] Ambientes claro/escuro implementados nas telas centrais.
- [ ] RLS testado em todas as tabelas antes do primeiro paciente real.
