-- Rate limiting por usuário nas chamadas de embedding disparadas por Server
-- Actions (Presença e Cuida) — complementa o rate limit por IP que já
-- existe em services/ia (ver app/limiter.py lá). Sem isso, um único usuário
-- autenticado ainda podia martelar o serviço compartilhado disparando muitas
-- escritas seguidas (Diário, guardar leitura/prática, entrada do
-- profissional), já que o limite por IP trata todo mundo atrás do mesmo
-- Cloudflare/NAT como uma coisa só.
create table if not exists embedding_rate_limit (
  user_id uuid primary key references auth.users (id) on delete cascade,
  janela_inicio timestamptz not null default now(),
  contagem int not null default 0
);

alter table embedding_rate_limit enable row level security;

create policy "usuário só vê/edita o próprio limite"
  on embedding_rate_limit
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Upsert atômico numa única instrução (evita corrida entre requests
-- concorrentes do mesmo usuário). Reseta a janela quando ela expira;
-- senão incrementa e devolve se ainda está dentro do limite. Usa
-- security invoker (padrão) — auth.uid() resolve pro usuário autenticado
-- da chamada, nunca um id passado pelo cliente.
create or replace function pode_calcular_embedding(
  p_limite int default 20,
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

  insert into embedding_rate_limit (user_id, janela_inicio, contagem)
  values (v_user_id, now(), 1)
  on conflict (user_id) do update set
    janela_inicio = case
      when embedding_rate_limit.janela_inicio < now() - make_interval(secs => p_janela_segundos)
        then now()
      else embedding_rate_limit.janela_inicio
    end,
    contagem = case
      when embedding_rate_limit.janela_inicio < now() - make_interval(secs => p_janela_segundos)
        then 1
      else embedding_rate_limit.contagem + 1
    end
  returning (contagem <= p_limite) into v_permitido;

  return v_permitido;
end;
$$;

grant execute on function pode_calcular_embedding(int, int) to authenticated;
