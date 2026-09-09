-- P7 (memória longitudinal, integracao-presente-presenca-decisoes.md) —
-- `fechamento_dia` pode disparar uma busca de conexão (participar como
-- origem), mas nunca pode ser o lado candidato/citado de uma conexão pra
-- ninguém, mesmo pra si mesma. Antes desta migration, isso já era verdade
-- na prática (nenhuma entrada de fechamento_dia tinha como ganhar
-- `revisitar = true`, único jeito de entrar no pool hoje), mas só por não
-- existir UI pra isso — não por regra explícita. Torna a garantia
-- permanente e legível na própria função, independente de qualquer UI
-- futura que venha a permitir marcar revisitar num fechamento.
--
-- Motivo do risco que essa exclusão evita: `conteudo` de um fechamento
-- pode ser texto livre influenciado pela lente simbólica do dia. Se ele
-- fosse citado de volta pra outra entrada ("isso conecta com algo que
-- você guardou: ..."), a UI reproduziria linguagem de origem simbólica
-- como se fosse padrão da própria pessoa — exatamente o que a regra
-- "símbolo repetido não conta, experiência repetida conta" proíbe.
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
    and ce.tipo <> 'fechamento_dia'
    and (
      (ce.autor_tipo = 'profissional' and ce.tipo = 'pergunta')
      or ce.revisitar = true
    )
    and (ce.embedding <=> p_embedding) <= p_distancia_maxima
  order by ce.embedding <=> p_embedding asc
  limit 1;
$$;
