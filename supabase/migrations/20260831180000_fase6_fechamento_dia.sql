-- Fechamento do dia (P6 da integração Presente→Presença) — reaproveita
-- caderno_entradas com tipo = 'fechamento_dia' (sem check constraint na
-- coluna tipo, mesma convenção já usada pra 'reflexao'/'pergunta'/etc —
-- ver docs/integracao-presente-presenca-decisoes.md).
--
-- Coluna nova, separada de `conteudo`: guarda qual das 3 respostas rápidas
-- foi escolhida ("algo_encontrou_eco" | "percebi_de_outra_maneira" |
-- "nada_em_especial"), sem check constraint — mesma convenção informal de
-- `tipo`, documentada em código (lib/fechamento.ts), não no banco.
alter table caderno_entradas add column fechamento_resposta_rapida text;
