-- Rate limiting por usuário nas chamadas de conversa (Claude Sonnet 5, via
-- Route Handler). Mesmo espírito de `rate_limit_embedding`, mas separado
-- porque conversa é uma chamada bem mais cara por token que embedding —
-- vale um limite próprio em vez de compartilhar a mesma tabela/janela.
create table if not exists conversa_rate_limit (
  user_id uuid primary key references auth.users (id) on delete cascade,
  janela_inicio timestamptz not null default now(),
  contagem int not null default 0
);

alter table conversa_rate_limit enable row level security;

create policy "usuário só vê/edita o próprio limite"
  on conversa_rate_limit
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Mesmo padrão de `pode_calcular_embedding`: upsert atômico, reseta a janela
-- quando expira, security invoker (auth.uid() resolve pro usuário
-- autenticado da chamada, nunca um id passado pelo cliente).
create or replace function pode_conversar(
  p_limite int default 40,
  p_janela_segundos int default 600
) returns boolean
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
  v_permitido boolean;
begin
  if v_user_id is null then
    return false;
  end if;

  insert into conversa_rate_limit (user_id, janela_inicio, contagem)
  values (v_user_id, now(), 1)
  on conflict (user_id) do update set
    janela_inicio = case
      when conversa_rate_limit.janela_inicio < now() - make_interval(secs => p_janela_segundos)
        then now()
      else conversa_rate_limit.janela_inicio
    end,
    contagem = case
      when conversa_rate_limit.janela_inicio < now() - make_interval(secs => p_janela_segundos)
        then 1
      else conversa_rate_limit.contagem + 1
    end
  returning (contagem <= p_limite) into v_permitido;

  return v_permitido;
end;
$$;

grant execute on function pode_conversar(int, int) to authenticated;
