-- Fase 11 — biblioteca colaborativa: terapeuta propõe práticas/páginas pro
-- Livro Vivo (docs/presenca-extensao-terapeutas-biblioteca.md seção 4). Toda
-- proposta nasce pendente, sem exceção — só admin aprova, recusa ou tira do
-- ar depois. Vale inclusive pra escopo "1 paciente só" — o Diário
-- (caderno_entradas) não é tocado por esta migration, continua sem fila.
--
-- `admins` criada aqui porque o trigger abaixo já depende dela — o painel de
-- aprovação de verdade (rota /admin/biblioteca) é a seção 5, ainda não
-- implementada. Guilherme precisa se inserir manualmente depois de aplicar:
--   insert into admins (user_id) values ('<seu auth.users.id>');

create table admins (
  user_id uuid primary key references auth.users(id)
);

alter table admins enable row level security;

create policy "admin le a propria linha"
  on admins for select using (auth.uid() = user_id);

revoke all on admins from anon, authenticated, public;
grant select on admins to authenticated;

-- ---------------------------------------------------------------------------
-- biblioteca: novas colunas
-- ---------------------------------------------------------------------------
alter table biblioteca add column if not exists status_moderacao text default 'aprovado'
  check (status_moderacao in ('pendente', 'aprovado', 'recusado'));
alter table biblioteca add column if not exists escopo text default 'publico'
  check (escopo in ('publico', 'privado_profissional'));
alter table biblioteca add column if not exists profissional_autor_id uuid references profissionais(id);
alter table biblioteca add column if not exists motivo_recusa text;

-- conteúdo já existente (curado por Guilherme via scripts/cadastrar-biblioteca.mjs,
-- sempre com profissional_autor_id nulo) nasce aprovado/público por padrão —
-- nada muda pra ele.

-- ---------------------------------------------------------------------------
-- trigger — impede terapeuta de se auto-aprovar
-- ---------------------------------------------------------------------------
create or replace function biblioteca_forca_pendente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profissional_autor_id is not null
     and not exists (select 1 from admins where user_id = auth.uid()) then
    new.status_moderacao := 'pendente';
    new.publicado := false;
  end if;
  return new;
end;
$$;

create trigger trg_biblioteca_forca_pendente
before insert on biblioteca
for each row execute function biblioteca_forca_pendente();

-- ---------------------------------------------------------------------------
-- policies — leitura respeita escopo; profissional propõe (nunca lê de volta
-- a própria proposta ainda pendente, por desenho: sem policy de select pra
-- isso, só a confirmação na hora do envio)
-- ---------------------------------------------------------------------------
drop policy "usuário autenticado lê conteúdo publicado" on biblioteca;

create policy "leitura respeita escopo e publicacao"
  on biblioteca for select using (
    publicado = true
    and (
      escopo = 'publico'
      or (
        escopo = 'privado_profissional'
        and exists (
          select 1 from vinculos
          where vinculos.paciente_id = auth.uid()
          and vinculos.profissional_id = biblioteca.profissional_autor_id
          and vinculos.ativo = true
        )
      )
    )
  );

-- profissional_id_do_usuario_atual() (Fase 4) em vez de subquery direta em
-- `profissionais` — mesmo motivo de sempre, evita reabrir a recursão de RLS.
create policy "profissional propoe conteudo"
  on biblioteca for insert with check (
    profissional_autor_id = profissional_id_do_usuario_atual()
    and escopo in ('publico', 'privado_profissional')
  );

-- Primeiro grant de insert pra `authenticated` em `biblioteca` — até aqui
-- toda escrita era só via service_role (Fase 0, nota 4). A policy acima
-- restringe pra "só o próprio profissional, só com profissional_autor_id
-- preenchido"; sem profissional_autor_id (conteúdo curado por admin), o
-- insert client-side continua impossível — só passa pela ferramenta interna
-- de sempre.
grant insert on biblioteca to authenticated;
