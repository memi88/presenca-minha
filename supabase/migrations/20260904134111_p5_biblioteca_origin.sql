-- P5 Fase A (integracao-presente-presenca-decisoes.md) — coluna de
-- origem/tradição, requisito pra uma prática entrar no pool de sugestão
-- do agente. Nenhuma coluna existente serve: `tipo` descreve formato
-- ('pagina_livro_vivo' | 'pratica'), não origem; `ambiente` é coluna
-- morta na prática (nenhuma query do app a lê — o claro/escuro real do
-- app vem de AmbienteShell.tsx, calculado pela rota, não por esta
-- coluna).
--
-- Nullable de propósito: as 22 linhas existentes não têm origin
-- preenchido e não há curadoria retroativa planejada como parte deste
-- deploy (decisão registrada em integracao-presente-presenca-decisoes.md
-- — P5 vai ao ar sem conteúdo real no pool até curadoria manual). Uma
-- constraint NOT NULL quebraria esse conteúdo; em vez disso, "sem origin
-- não entra no pool" é aplicado no WHERE de buscar_pratica_relevante.
alter table biblioteca add column if not exists origin text
  check (origin in (
    'TRADITIONAL_MAYA', 'LAW_OF_TIME', 'HUMAN_DESIGN', 'KABBALAH', 'PRESENTE', 'PRESENCA'
  ));

-- Função de match vetorial pra prática — mesmo espírito de
-- buscar_conexao_caderno (busca_semantica_caderno.sql), mas biblioteca é
-- conteúdo público (policy "usuário autenticado lê conteúdo publicado"),
-- então security invoker funciona sem precisar de security definer.
-- limit 3 (não 1): o agente recebe candidatos e julga, não uma citação
-- única já decidida.
create or replace function buscar_pratica_relevante(
  p_embedding extensions.vector(384),
  p_distancia_maxima float default 0.5
) returns table (
  id uuid,
  titulo text,
  conteudo text,
  origin text,
  slug text,
  distancia float
)
language sql
security invoker
stable
as $$
  select b.id, b.titulo, b.conteudo, b.origin, b.slug, b.embedding <=> p_embedding as distancia
  from biblioteca b
  where b.tipo = 'pratica'
    and b.publicado = true
    and b.origin is not null
    and b.embedding is not null
    and (b.embedding <=> p_embedding) <= p_distancia_maxima
  order by b.embedding <=> p_embedding asc
  limit 3;
$$;

grant execute on function buscar_pratica_relevante(extensions.vector(384), float) to authenticated;
