-- Fase 1 (expandida): convite recorrente de conversão de conta anônima ->
-- permanente. `lembrete_conversao_em`: enquanto for nulo ou estiver no
-- passado, o app mostra o convite gentil na Home; ao dispensar, gravamos
-- "não perguntar de novo antes de X" — é assim que fica recorrente sem virar
-- um pedido a cada visita (a marca não é insistente, ver
-- docs/presenca-voz-de-marca.md).
--
-- Sem RLS/GRANT novos aqui: a coluna vive em `profiles`, que já tem
-- `for all using (auth.uid() = id)` e já está liberada pra authenticated —
-- ambos cobrem update deste campo automaticamente.

alter table profiles
  add column lembrete_conversao_em timestamptz;
