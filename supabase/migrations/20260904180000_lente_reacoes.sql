-- Reação (gostei/não gostei) à Lente do dia — docs/redesign/
-- lente_do_dia_leitura_ambiente_claro. A reflexão do dia é genérica,
-- compartilhada entre todo mundo (P1-P7, sem personalização por Selo
-- natal ainda — ver DerivationSummary em lib/present.ts), então a reação
-- é uma linha por pessoa por dia civil, não por reflexão individual.
-- `data` usa o mesmo cálculo de "hoje" (America/Sao_Paulo) que o cache da
-- lente (lib/present.ts: dataCivilHoje()) — perto da virada da meia-noite
-- os dois precisam concordar em qual dia é "hoje".
create table lente_reacoes (
  paciente_id uuid references profiles (id) not null,
  data date not null,
  reacao text not null check (reacao in ('gostei', 'nao_gostei')),
  criado_em timestamptz not null default now(),
  primary key (paciente_id, data)
);

alter table lente_reacoes enable row level security;

create policy "paciente só vê/edita a própria reação"
  on lente_reacoes
  for all
  using (auth.uid() = paciente_id)
  with check (auth.uid() = paciente_id);

revoke all on lente_reacoes from anon, authenticated, public;
grant select, insert, update, delete on lente_reacoes to authenticated;
