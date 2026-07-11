-- Menu Perfil + convite contextual de nascimento (PRD §5). O sinal de
-- "dias consecutivos" é só um gatilho interno pra decidir quando convidar —
-- nunca é exibido como contador pra pessoa (voz-de-marca pilar 3: sem
-- streak/gamificação). Sem policy nova: a policy já existente "usuário lê e
-- edita o próprio perfil" (auth.uid() = id, for all) em `profiles` já cobre.

alter table profiles add column streak_dias_consecutivos int default 0;
alter table profiles add column streak_atualizado_em date;
alter table profiles add column lembrete_nascimento_em timestamptz;
