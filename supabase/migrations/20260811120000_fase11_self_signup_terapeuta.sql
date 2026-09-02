-- Fase 11 — self-signup do terapeuta (docs/presenca-extensao-terapeutas-biblioteca.md
-- seção 2). O doc assumia que `abordagem`, `forma_de_trabalho` e
-- `usa_linguagens_simbolicas` já existiam em `profissionais` — não existiam,
-- só `tipo` (Fase 0, categoria de profissão: 'terapeuta'/'nutricionista'/
-- 'fono', default 'terapeuta', nunca lido em nenhum lugar do app). Reaproveita
-- `tipo` pra guardar a abordagem terapêutica (é o que o check constraint do
-- doc já assume) em vez de criar uma coluna nova redundante — seguro porque
-- nada no código depende do valor antigo.
--
-- Backfill antes do check: os 3 profissionais do piloto (cadastrados via
-- scripts/cadastrar-profissional.mjs, tipo default 'terapeuta') não têm
-- valor válido pra lista nova — viram 'Outra' até serem corrigidos à mão
-- (Guilherme sabe a abordagem real de cada um).
update profissionais
  set tipo = 'Outra'
  where tipo is null or tipo not in (
    'TCC', 'Psicanálise', 'Gestalt-terapia', 'Terapia Sistêmica', 'ACT', 'Humanista',
    'Holística/Integrativa', 'Outra'
  );

alter table profissionais alter column tipo set default 'Outra';

alter table profissionais add constraint profissionais_tipo_check
  check (tipo in (
    'TCC', 'Psicanálise', 'Gestalt-terapia', 'Terapia Sistêmica', 'ACT', 'Humanista',
    'Holística/Integrativa', 'Outra'
  ));

-- Descrição livre quando tipo = 'Outra' (nenhuma das opções fechadas encaixa).
alter table profissionais add column if not exists forma_de_trabalho text;

alter table profissionais add column if not exists usa_linguagens_simbolicas boolean not null default false;

-- Sem policy nova: "profissional lê e edita o próprio registro" (Fase 0,
-- auth.uid() = user_id, for all) já cobre select/insert/update destas
-- colunas — o INSERT do self-signup usa exatamente essa policy (ver
-- scripts/rls-check.mjs, teste "profissional insere o próprio registro").
