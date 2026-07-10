-- Presença — Fase 0: schema inicial + RLS
-- Referência: docs/presenca-prd.md, seção 4.
--
-- Decisões tomadas fora do PRD (confirmadas com o time antes desta migration):
--   1. Ordem de criação corrigida: `profissionais` antes de `profiles`, porque
--      `profiles.profissional_id` referencia `profissionais(id)`. O PRD lista
--      na ordem de leitura, não na ordem de execução.
--   2. Supabase (a partir de certa versão) para de auto-expor tabelas novas às
--      roles de API (anon/authenticated/service_role) sem GRANT explícito —
--      RLS sozinha não basta mais para tornar uma tabela alcançável via API.
--      Por isso, cada tabela abaixo tem REVOKE + GRANT explícitos, além das
--      policies. `anon` não recebe grant em nenhuma tabela: o produto não tem
--      superfície pública/anônima no V1.
--   3. `vinculos` não recebe INSERT para `authenticated`. A criação do vínculo
--      profissional-paciente via código de convite é trabalho de Fase 4 (uma
--      função `security definer` que valida o código e cria o vínculo de
--      forma atômica) — não uma policy de insert direta na tabela, que
--      permitiria qualquer usuário se vincular a qualquer profissional_id só
--      sabendo o UUID.
--   4. `biblioteca` só é legível por `authenticated` (não há preview anônimo).
--      Inserts/updates/deletes não têm policy nem grant para roles de
--      cliente — toda escrita passa por uma ferramenta interna autenticada
--      como admin (`service_role`), nunca pelo client-side.

-- ---------------------------------------------------------------------------
-- Extensões
-- ---------------------------------------------------------------------------
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- profissionais (terapeutas hoje; genérico por design)
-- ---------------------------------------------------------------------------
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

revoke all on profissionais from anon, authenticated, public;
grant select, insert, update, delete on profissionais to authenticated;

-- ---------------------------------------------------------------------------
-- profiles (estende auth.users)
-- ---------------------------------------------------------------------------
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

revoke all on profiles from anon, authenticated, public;
grant select, insert, update, delete on profiles to authenticated;

-- ---------------------------------------------------------------------------
-- vinculos (profissional <-> paciente; permite múltiplos pacientes por profissional)
-- ---------------------------------------------------------------------------
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

-- Sem policy nem grant de insert/update/delete para `authenticated` — ver
-- nota 3 no topo do arquivo. Criação do vínculo é Fase 4 (função
-- security definer com código de convite).
revoke all on vinculos from anon, authenticated, public;
grant select on vinculos to authenticated;

-- ---------------------------------------------------------------------------
-- biblioteca (Livro Vivo, práticas, áudios, exercícios — curado, não gerado por usuário)
-- ---------------------------------------------------------------------------
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
  embedding extensions.vector(1536), -- calculado uma vez, no cadastro/edição do conteúdo
  created_at timestamptz default now()
);

alter table biblioteca enable row level security;

create policy "usuário autenticado lê conteúdo publicado"
  on biblioteca for select using (auth.role() = 'authenticated' and publicado = true);

-- Inserts/updates/deletes: sem policy, sem grant para `authenticated`. Toda
-- escrita passa por uma ferramenta interna autenticada como admin
-- (`service_role`, que ignora RLS e grants de tabela), nunca pela API
-- pública. Ver nota 4 no topo do arquivo.
revoke all on biblioteca from anon, authenticated, public;
grant select on biblioteca to authenticated;

-- ---------------------------------------------------------------------------
-- caderno_entradas (Meu Livro) — entradas do usuário e, quando aplicável, do profissional
-- ---------------------------------------------------------------------------
create table caderno_entradas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references profiles(id) not null,
  autor_tipo text not null,        -- 'usuario' | 'profissional'
  autor_profissional_id uuid references profissionais(id), -- nulo se autor_tipo = 'usuario'
  tipo text default 'reflexao',    -- 'reflexao' | 'pergunta' | 'pratica_indicada' | 'pagina_indicada' | 'simbolo'
  conteudo text not null,
  biblioteca_ref_id uuid references biblioteca(id), -- se for uma página/prática indicada
  revisitar boolean default false, -- marcado pela própria pessoa: "quero pensar nisso com mais calma depois"
  embedding extensions.vector(1536), -- calculado no momento em que a entrada é escrita
  created_at timestamptz default now()
);

alter table caderno_entradas enable row level security;

-- Paciente cria, lê, edita (ex: flag `revisitar`) e apaga as próprias
-- entradas de autoria 'usuario'. DELETE é deliberadamente permitido:
-- autonomia da pessoa sobre o que ela escreveu, inclusive para remover algo
-- num momento de arrependimento — decisão de produto confirmada, não default
-- técnico não discutido.
create policy "paciente lê e escreve suas próprias entradas"
  on caderno_entradas for all using (auth.uid() = paciente_id and autor_tipo = 'usuario');

-- Paciente também lê entradas que o profissional escreveu no caderno dele
-- (autor_tipo = 'profissional') — policy adicional de select, permissiva em
-- OR com a de cima.
create policy "paciente lê entradas do profissional vinculado"
  on caderno_entradas for select using (auth.uid() = paciente_id);

-- Profissional insere apenas em pacientes vinculados e ativos, e só
-- rotulando a própria autoria — nunca lê de volta (ele nunca tem select em
-- caderno_entradas de tipo 'usuario', e não há policy de select para ele
-- aqui, só a de insert abaixo).
create policy "profissional insere apenas em pacientes vinculados"
  on caderno_entradas for insert with check (
    autor_tipo = 'profissional'
    and auth.uid() = (select user_id from profissionais where id = autor_profissional_id)
    and exists (
      select 1 from vinculos
      where vinculos.paciente_id = caderno_entradas.paciente_id
      and vinculos.profissional_id = caderno_entradas.autor_profissional_id
      and vinculos.ativo = true
    )
  );

revoke all on caderno_entradas from anon, authenticated, public;
grant select, insert, update, delete on caderno_entradas to authenticated;
