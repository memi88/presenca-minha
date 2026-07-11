-- Fase 6 — check-in "como está sua presença hoje?". Guarda a última
-- resposta e quando foi dada; "devido" (perguntar de novo) é calculado no
-- app (apps/presenca/lib/checkin.ts), não aqui — é só um par de colunas.
--
-- Sem policy nova: a policy já existente "usuário lê e edita o próprio
-- perfil" (auth.uid() = id, for all) em `profiles` já cobre essas colunas.

alter table profiles add column presenca_hoje text;
alter table profiles add column presenca_hoje_em timestamptz;
