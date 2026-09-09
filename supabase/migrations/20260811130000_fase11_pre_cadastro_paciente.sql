-- Fase 11 — pré-cadastro de paciente + link pessoal
-- (docs/presenca-extensao-terapeutas-biblioteca.md seção 3).
--
-- Terapeuta pré-cadastra um paciente (nome + características + anotações)
-- antes dele existir no app, gera um link único, e o paciente confirma os
-- próprios dados ao abrir o link — pulando a etapa de conta anônima, indo
-- direto pra conta permanente (o vínculo com o terapeuta já é certo nesse
-- fluxo). O código de convite genérico (Fase 4, conectar_profissional)
-- continua existindo em paralelo, sem nenhuma mudança.

create table pacientes_pre_cadastro (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid references profissionais(id) not null,
  nome text not null,                 -- confirmável pelo paciente no link
  caracteristicas text,               -- privado, só o terapeuta vê, NUNCA IA, NUNCA paciente
  anotacoes text,                     -- idem
  token_convite text unique not null default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pendente' check (status in ('pendente', 'confirmado')),
  paciente_id uuid references profiles(id), -- nulo até confirmação
  created_at timestamptz default now(),
  confirmado_em timestamptz
);

alter table pacientes_pre_cadastro enable row level security;

-- Reusa profissional_id_do_usuario_atual() (Fase 4) em vez de subquery
-- direta em `profissionais` — mesma prevenção de recursão de RLS já
-- resolvida ali.
create policy "profissional le e escreve os proprios pre-cadastros"
  on pacientes_pre_cadastro for all
  using (profissional_id = profissional_id_do_usuario_atual())
  with check (profissional_id = profissional_id_do_usuario_atual());

-- CRÍTICO: nenhuma policy de select para o paciente, nem depois de
-- confirmado, e nenhum grant pra `anon`. O acesso do paciente ao link passa
-- só pela RPC `validar_token_pre_cadastro` abaixo (security definer), que
-- nunca expõe `caracteristicas`/`anotacoes` — só nome e status.
revoke all on pacientes_pre_cadastro from anon, authenticated, public;
grant select, insert, update, delete on pacientes_pre_cadastro to authenticated;

-- Chamada na tela pública do link (app/convite/[token] no Presença), ANTES
-- de qualquer autenticação — primeira superfície do produto acessível por
-- `anon` (Fase 0 dizia "produto não tem superfície pública/anônima no V1";
-- aqui é intencional e mínima: só nome + status, nunca dado sensível).
create or replace function validar_token_pre_cadastro(p_token text)
returns table(nome text, status text)
language sql
security definer
stable
set search_path = public
as $$
  select nome, status from pacientes_pre_cadastro where token_convite = p_token;
$$;

revoke all on function validar_token_pre_cadastro(text) from public;
grant execute on function validar_token_pre_cadastro(text) to anon, authenticated;

-- Chamada logo após o paciente criar a conta permanente (signUp), pelo
-- próprio usuário recém-criado — cria o vínculo e fecha o pré-cadastro.
-- Mesmo formato de retorno/uso de conectar_profissional (Fase 4): também
-- seta `profiles.profissional_id`, que o resto do app já lê pra saber "tem
-- profissional conectado" (o bloco SQL original do doc não setava essa
-- coluna — ajustado aqui pra bater com o padrão real já em produção).
create or replace function confirmar_pre_cadastro(p_token text, p_paciente_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profissional_id uuid;
begin
  if auth.uid() is null or auth.uid() != p_paciente_id then
    raise exception 'não autorizado';
  end if;

  select profissional_id into v_profissional_id
  from pacientes_pre_cadastro
  where token_convite = p_token and status = 'pendente';

  if v_profissional_id is null then
    raise exception 'token inválido ou já usado';
  end if;

  insert into vinculos (profissional_id, paciente_id, ativo)
  values (v_profissional_id, p_paciente_id, true)
  on conflict (profissional_id, paciente_id) do update set ativo = true;

  update profiles set profissional_id = v_profissional_id where id = p_paciente_id;

  update pacientes_pre_cadastro
  set status = 'confirmado', paciente_id = p_paciente_id, confirmado_em = now()
  where token_convite = p_token;
end;
$$;

revoke all on function confirmar_pre_cadastro(text, uuid) from public;
grant execute on function confirmar_pre_cadastro(text, uuid) to authenticated;
