-- Fase 4 — vínculo profissional-paciente via código de convite.
--
-- `vinculos` já existe desde a Fase 0, com policies de SELECT mas nenhuma de
-- INSERT — de propósito (ver scripts/rls-check.mjs). A escrita acontece só
-- através da função `conectar_profissional`, que resolve o código de
-- convite e cria o vínculo com o privilégio do dono da função, nunca por
-- INSERT direto do cliente.

-- Cada profissional ganha um código curto e único pra compartilhar com o
-- paciente (fora do app, hoje). Default gera um código de 8 caracteres a
-- partir de um uuid — colisão é praticamente impossível na escala do piloto.
alter table profissionais
  add column codigo_convite text unique
  default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

update profissionais
  set codigo_convite = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  where codigo_convite is null;

create or replace function conectar_profissional(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paciente_id uuid := auth.uid();
  v_profissional record;
begin
  if v_paciente_id is null then
    raise exception 'não autenticado';
  end if;

  select id, nome into v_profissional
  from profissionais
  where codigo_convite = upper(trim(p_codigo));

  if v_profissional.id is null then
    return jsonb_build_object('ok', false, 'erro', 'código não encontrado');
  end if;

  insert into vinculos (profissional_id, paciente_id, ativo)
  values (v_profissional.id, v_paciente_id, true)
  on conflict (profissional_id, paciente_id)
  do update set ativo = true;

  update profiles set profissional_id = v_profissional.id where id = v_paciente_id;

  return jsonb_build_object('ok', true, 'nome', v_profissional.nome);
end;
$$;

revoke all on function conectar_profissional(text) from public;
grant execute on function conectar_profissional(text) to authenticated;

-- Paciente lê o profissional a que está vinculado (pra mostrar o nome na
-- tela "Terapia" — a policy da Fase 2 só cobria quem já tinha entrada
-- escrita no caderno, aqui cobre o vínculo em si, mesmo sem entrada ainda).
create policy "paciente vê o profissional vinculado"
  on profissionais for select using (
    exists (
      select 1 from vinculos
      where vinculos.profissional_id = profissionais.id
      and vinculos.paciente_id = auth.uid()
      and vinculos.ativo = true
    )
  );

-- Profissional lê o perfil (nome) de pacientes vinculados — pra montar a
-- lista de pacientes no Cuida.
create policy "profissional lê perfil de pacientes vinculados"
  on profiles for select using (
    exists (
      select 1 from vinculos
      join profissionais on profissionais.id = vinculos.profissional_id
      where vinculos.paciente_id = profiles.id
      and profissionais.user_id = auth.uid()
      and vinculos.ativo = true
    )
  );

-- Profissional lê só as próprias entradas escritas no caderno de um
-- paciente — nunca as entradas de tipo 'usuario'. Esse é o limite de
-- privacidade central da Fase 4.
create policy "profissional lê as próprias entradas escritas"
  on caderno_entradas for select using (
    autor_tipo = 'profissional'
    and autor_profissional_id in (
      select id from profissionais where user_id = auth.uid()
    )
  );
