# Presença — PRD: Experiências Guiadas

> Documento técnico, no mesmo padrão do `presenca-prd.md` principal. Nasce
> do documento conceitual "Experiências Guiadas — Jornadas Conceituais
> para Design" (outra conversa) + das telas já desenhadas (Stitch, Lote A
> em `presenca-stitch-prompts-jornadas-lote-a.md`). **O modelo de dados
> abaixo é proposta, não fato confirmado pela auditoria** — é o ponto de
> partida pro Claude Code validar/ajustar, não uma decisão fechada.

---

## 1. O que é, em uma frase

Uma Experiência Guiada é uma jornada mais longa que uma prática única —
pode durar dias, com etapas — em um de três formatos: **Autoguiada**
(sem espera), **Guiada pelo método** (ramificada, mas dentro de caminhos
já definidos por um especialista) ou **Acompanhada** (um especialista
humano real lê as respostas e decide os próximos passos).

---

## 2. Princípios que restringem este PRD

1. **Autoria sempre visível** — do método ou do especialista, nunca
   escondida atrás da experiência (mesmo princípio já aplicado à
   Biblioteca/Livro Vivo).
2. **A camada básica tem valor por si só** — mesmo a primeira etapa de uma
   jornada longa precisa parecer completa, aprofundamento é convite nunca
   obrigação.
3. **Consentimento é por finalidade, nunca herdado** — o consentimento de
   uma Experiência Acompanhada é específico daquela experiência, não
   reaproveita nenhum consentimento genérico de conta já existente.
4. **Sem promessa que o produto não pode cumprir** — nunca prometer prazo
   de resposta do especialista (SLA não existe ainda).
5. **Notificação só quando há novidade de verdade** — nunca lembrete vazio
   enquanto nada mudou na experiência.

---

## 3. O que já está confirmado (não precisa redecidir)

- **Push é nativo**, via Capacitor (APNs/FCM) — não Web Push. Já previsto
  em `capacitor.config.ts`, ainda não implementado.
- **Consentimento não tem padrão visual a reaproveitar** — os dois
  consentimentos existentes hoje (`ConectarForm`, `ConfirmarConviteForm`)
  são só checkbox+submit, sem registro persistido separado.
- **Fila do especialista não tem precedente** — o Cuida hoje
  (`/pacientes`) é lista plana, só com badge de risco. Fila nasce do zero.

---

## 4. Modelo de dados (proposta)

```sql
-- Conteúdo curado da experiência (parecido com `biblioteca`, mas com
-- etapas em vez de conteúdo único)
create table experiencias_guiadas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null check (tipo in ('autoguiada','guiada_metodo','acompanhada')),
  especialista_id uuid references profissionais(id), -- reaproveita a tabela já existente; a validar se especialista de conteúdo = terapeuta do Cuida ou papel separado (ver seção 6, pergunta aberta)
  descricao text not null,
  estimativa_formato text, -- texto livre, ex: "algumas etapas ao longo de alguns dias" — nunca número de minutos
  publicado boolean default true,
  created_at timestamptz default now()
);
alter table experiencias_guiadas enable row level security;
create policy "usuário autenticado lê experiências publicadas"
  on experiencias_guiadas for select using (publicado = true);

-- Etapas de cada experiência (curadas, não geradas por IA)
create table experiencias_etapas (
  id uuid primary key default gen_random_uuid(),
  experiencia_id uuid references experiencias_guiadas(id) not null,
  ordem int not null,
  conteudo text not null,
  tipo_resposta text default 'texto', -- 'texto' | 'escolha' (pra ramificação de guiada_metodo)
  ramificacoes jsonb, -- mapa de resposta->próxima etapa, só relevante pra guiada_metodo
  created_at timestamptz default now()
);
alter table experiencias_etapas enable row level security;
create policy "usuário autenticado lê etapas de experiências publicadas"
  on experiencias_etapas for select using (
    exists (select 1 from experiencias_guiadas where id = experiencia_id and publicado = true)
  );

-- Progresso de uma pessoa numa experiência específica
create table experiencias_instancias (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references profiles(id) not null,
  experiencia_id uuid references experiencias_guiadas(id) not null,
  etapa_atual_id uuid references experiencias_etapas(id),
  estado text default 'em_andamento' check (estado in ('em_andamento','aguardando_especialista','concluida')),
  iniciado_em timestamptz default now(),
  concluido_em timestamptz
);
alter table experiencias_instancias enable row level security;
create policy "paciente lê e atualiza a própria instância"
  on experiencias_instancias for all using (auth.uid() = paciente_id);
create policy "especialista lê instâncias das próprias experiências acompanhadas"
  on experiencias_instancias for select using (
    exists (
      select 1 from experiencias_guiadas
      where id = experiencia_id
      and especialista_id = (select id from profissionais where user_id = auth.uid())
    )
  );

-- Respostas da pessoa, por etapa
create table experiencias_respostas (
  id uuid primary key default gen_random_uuid(),
  instancia_id uuid references experiencias_instancias(id) not null,
  etapa_id uuid references experiencias_etapas(id) not null,
  conteudo text not null,
  respondido_em timestamptz default now()
);
alter table experiencias_respostas enable row level security;
create policy "paciente lê e escreve as próprias respostas"
  on experiencias_respostas for all using (
    exists (select 1 from experiencias_instancias where id = instancia_id and paciente_id = auth.uid())
  );
create policy "especialista lê respostas das instâncias que acompanha"
  on experiencias_respostas for select using (
    exists (
      select 1 from experiencias_instancias ei
      join experiencias_guiadas eg on eg.id = ei.experiencia_id
      where ei.id = instancia_id
      and eg.especialista_id = (select id from profissionais where user_id = auth.uid())
    )
  );

-- Consentimento — por instância, nunca flag global. Padrão vindo do
-- desenho de Organizações (não implementado lá, só referência de forma).
create table experiencias_consentimentos (
  id uuid primary key default gen_random_uuid(),
  instancia_id uuid references experiencias_instancias(id) not null unique,
  consentido boolean not null default false,
  consentido_em timestamptz,
  revogado_em timestamptz -- nulo enquanto ativo
);
alter table experiencias_consentimentos enable row level security;
create policy "paciente lê e escreve o próprio consentimento"
  on experiencias_consentimentos for all using (
    exists (select 1 from experiencias_instancias where id = instancia_id and paciente_id = auth.uid())
  );

-- Devolutiva escrita do especialista, na conclusão de uma Acompanhada
create table experiencias_devolutivas (
  id uuid primary key default gen_random_uuid(),
  instancia_id uuid references experiencias_instancias(id) not null,
  especialista_id uuid references profissionais(id) not null,
  conteudo text not null,
  criado_em timestamptz default now()
);
alter table experiencias_devolutivas enable row level security;
create policy "paciente lê a própria devolutiva"
  on experiencias_devolutivas for select using (
    exists (select 1 from experiencias_instancias where id = instancia_id and paciente_id = auth.uid())
  );
create policy "especialista escreve devolutiva nas próprias instâncias"
  on experiencias_devolutivas for insert with check (
    especialista_id = (select id from profissionais where user_id = auth.uid())
  );
```

**Fila do especialista (Cuida):** proposta é não ser uma tabela nova — uma
consulta sobre `experiencias_instancias` filtrando
`estado = 'aguardando_especialista'` e `especialista_id` do profissional
logado, ordenada por `respondido_em` da última resposta. A validar na
auditoria se isso escala bem ou se precisa de tabela própria depois.

---

## 5. Telas (referência ao que já foi desenhado)

Esqueleto universal: Descoberta → Início → Andamento → (Espera, só
Acompanhada) → Retomada → Conclusão → Aprofundamento.

- **Lote A (desenhado):** Descoberta, Início, Consentimento, Andamento
  (Autoguiada/Guiada), Andamento (Acompanhada) — ver
  `presenca-stitch-prompts-jornadas-lote-a.md`.
- **Lote B (desenhado — confirmar com o Guilherme se já foi gerado):**
  Espera pelo especialista, Retomada, Conclusão, Aprofundamento humano, 8º
  bloco condicional na Home.
- **Lote C (Cuida):** Fila do especialista — sem precedente visual,
  desenho próprio.

---

## 6. Perguntas em aberto (não bloqueiam começar a implementação)

- **Especialista de Experiências Guiadas é o mesmo `profissionais` do
  Cuida, ou um papel separado?** O schema acima assume que é o mesmo (FK
  direta), mas isso não foi confirmado — um especialista de conteúdo
  guiado pode não ter vínculo de paciente nenhum no Cuida tradicional.
- **Modelo de preço** — Experiências Guiadas entra nos planos existentes
  do Presença, ou é oferta própria? Não discutido em nenhum documento até
  agora.
- **SLA de resposta do especialista** — explicitamente fora de escopo
  desta fase, mas afeta a UX da tela de Espera se não for nunca resolvido.

---

## 7. Fora de escopo (esta fase)

- Pagamento, agenda, SLA — confirmado fora de escopo pelo documento
  conceitual original.
- Layout exato da fila pode ser desenhado agora; a estrutura de dados por
  trás (o que exatamente dispara "precisa de ação") ainda depende de
  validação técnica.

---

## 8. Status

Modelo de dados é proposta inicial, não validada. Telas do Lote A
desenhadas; Lote B e C dependem de confirmação de progresso com o
Guilherme antes de considerar o pacote de design fechado. Pronto pra
Claude Code começar a auditoria/implementação usando este documento como
ponto de partida — não como especificação imutável.
