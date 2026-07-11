-- Fase 7 — sinal "tempo desde a última visita" pra variar a abertura da
-- Home (apps/presenca/lib/abertura.ts). Sem policy nova: a policy já
-- existente "usuário lê e edita o próprio perfil" (auth.uid() = id, for
-- all) em `profiles` já cobre essa coluna.

alter table profiles add column ultima_visita_em timestamptz;
