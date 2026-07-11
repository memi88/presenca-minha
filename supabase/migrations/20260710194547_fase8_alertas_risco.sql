-- Fase 8 — protocolo de risco. Como não existe detecção de risco por IA
-- ainda (depende da Conversa, que é stub), o alerta é autoacionado pelo
-- próprio paciente ("avisar minha terapeuta") em vez de vigilância
-- automática — decisão consciente, não um sistema julgando sozinho.
--
-- Reaproveita `profissional_id_do_usuario_atual()` (Fase 4, security
-- definer) pra evitar o mesmo problema de recursão de RLS que já apareceu
-- entre `profissionais` e `vinculos`.

create table alertas_risco (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references profiles(id) not null,
  profissional_id uuid references profissionais(id) not null,
  created_at timestamptz default now()
);
alter table alertas_risco enable row level security;

create policy "paciente cria alerta pro profissional vinculado"
  on alertas_risco for insert with check (
    auth.uid() = paciente_id
    and exists (
      select 1 from vinculos
      where vinculos.paciente_id = alertas_risco.paciente_id
      and vinculos.profissional_id = alertas_risco.profissional_id
      and vinculos.ativo = true
    )
  );

create policy "paciente lê os próprios alertas"
  on alertas_risco for select using (auth.uid() = paciente_id);

create policy "profissional lê alertas dos próprios pacientes"
  on alertas_risco for select using (profissional_id = profissional_id_do_usuario_atual());
