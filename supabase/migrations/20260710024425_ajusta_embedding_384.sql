-- Ajusta dimensão do embedding: 1536 (assumia OpenAI) -> 384.
-- Referência: docs/presenca-prd.md, seção 3.2 — modelo decidido:
-- multilingual-e5-small (384 dimensões), auto-hospedado via
-- sentence-transformers, endpoint /embed do microsserviço Python (mesmo
-- serviço que fará o cálculo de Human Design). Não usa o embedding nativo
-- das Supabase Edge Functions (gte-small é só inglês).
--
-- Seguro rodar agora: nenhuma linha real existe em `biblioteca` nem em
-- `caderno_entradas` ainda (o piloto não começou), e nenhum índice
-- ivfflat/hnsw foi criado sobre a coluna — é só um ALTER TYPE direto, sem
-- necessidade de rebuild de índice.

alter table biblioteca
  alter column embedding type extensions.vector(384);

alter table caderno_entradas
  alter column embedding type extensions.vector(384);
