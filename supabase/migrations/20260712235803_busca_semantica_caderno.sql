-- Busca por proximidade semântica (embedding <=>) dentro do Caderno de um
-- único usuário — item da checklist Fase 7 que faltava ("falta escrever a
-- query/RPC em si"). Usada pra detectar quando uma entrada nova conecta com
-- uma pergunta em aberto do profissional ou uma entrada marcada
-- `revisitar = true` (PRD seção 7 — "notificação gentil quando uma entrada
-- nova conecta com pergunta em aberto ou entrada revisitar").
--
-- security invoker (padrão): roda com as policies de RLS do usuário
-- chamador — a mesma proteção que já existe em `caderno_entradas` (paciente
-- só enxerga as próprias entradas) vale aqui também. O filtro explícito por
-- `paciente_id = auth.uid()` é redundante com a RLS, mas deixa a garantia
-- "nunca cruza entre pessoas" (PRD seção 7) legível na própria função, sem
-- depender só da RLS pra quem for ler isso depois.
--
-- `p_distancia_maxima` é um palpite inicial (cosine distance, menor = mais
-- parecido) — sem volume de uso real ainda pra calibrar; ajustar conforme
-- os primeiros resultados do piloto.
create or replace function buscar_conexao_caderno(
  p_embedding extensions.vector(384),
  p_excluir_id uuid default null,
  p_distancia_maxima float default 0.5
) returns table (
  id uuid,
  conteudo text,
  tipo text,
  created_at timestamptz,
  distancia float
)
language sql
security invoker
stable
as $$
  select
    ce.id,
    ce.conteudo,
    ce.tipo,
    ce.created_at,
    ce.embedding <=> p_embedding as distancia
  from caderno_entradas ce
  where ce.paciente_id = auth.uid()
    and ce.embedding is not null
    and (p_excluir_id is null or ce.id <> p_excluir_id)
    and (
      (ce.autor_tipo = 'profissional' and ce.tipo = 'pergunta')
      or ce.revisitar = true
    )
    and (ce.embedding <=> p_embedding) <= p_distancia_maxima
  order by ce.embedding <=> p_embedding asc
  limit 1;
$$;

grant execute on function buscar_conexao_caderno(extensions.vector(384), uuid, float) to authenticated;
