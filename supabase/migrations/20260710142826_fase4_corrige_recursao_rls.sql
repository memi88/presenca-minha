-- Corrige recursão infinita de RLS descoberta testando a Fase 4
-- (scripts/rls-check-fase4.mjs, erro real do Postgres: "infinite recursion
-- detected in policy for relation profissionais").
--
-- A causa: a policy de `vinculos` "profissional vê vínculos onde é o
-- profissional" consulta `profissionais`; a policy nova de `profissionais`
-- "paciente vê o profissional vinculado" consulta `vinculos`. Selecionar em
-- qualquer uma das duas tabelas entra num ciclo profissionais → vinculos →
-- profissionais → ...
--
-- Correção: uma função `security definer` resolve "qual é o profissional_id
-- do usuário logado" rodando como dono da tabela (bypassa RLS de
-- `profissionais` por definição, sem reavaliar as policies dela). Toda
-- policy que precisava fazer `select id from profissionais where user_id =
-- auth.uid()` passa a chamar essa função em vez de consultar a tabela
-- direto — quebra o ciclo sem perder nenhuma checagem de segurança.

create or replace function profissional_id_do_usuario_atual()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from profissionais where user_id = auth.uid();
$$;

revoke all on function profissional_id_do_usuario_atual() from public;
grant execute on function profissional_id_do_usuario_atual() to authenticated;

drop policy "profissional vê vínculos onde é o profissional" on vinculos;
create policy "profissional vê vínculos onde é o profissional"
  on vinculos for select using (profissional_id = profissional_id_do_usuario_atual());

drop policy "profissional lê perfil de pacientes vinculados" on profiles;
create policy "profissional lê perfil de pacientes vinculados"
  on profiles for select using (
    exists (
      select 1 from vinculos
      where vinculos.paciente_id = profiles.id
      and vinculos.profissional_id = profissional_id_do_usuario_atual()
      and vinculos.ativo = true
    )
  );

drop policy "profissional lê as próprias entradas escritas" on caderno_entradas;
create policy "profissional lê as próprias entradas escritas"
  on caderno_entradas for select using (
    autor_tipo = 'profissional'
    and autor_profissional_id = profissional_id_do_usuario_atual()
  );
