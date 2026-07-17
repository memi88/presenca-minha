-- Compartilhar entrada do Diário com o terapeuta vinculado — a política de
-- privacidade já promete isso ("você escolhe o que compartilhar no
-- Diário"), mas o mecanismo nunca existiu até agora. Toggle por entrada,
-- reversível, opt-in (default false).
alter table caderno_entradas add column compartilhar boolean not null default false;

-- Nenhuma policy de select existia pra autor_tipo = 'usuario' no lado
-- profissional — esta é aditiva, não substitui nada. Reaproveita
-- profissional_id_do_usuario_atual() (security definer, já existe desde
-- fase4_corrige_recursao_rls) pra evitar recursão de RLS.
create policy "profissional lê entradas compartilhadas por paciente vinculado"
  on caderno_entradas for select using (
    autor_tipo = 'usuario'
    and compartilhar = true
    and exists (
      select 1 from vinculos
      where vinculos.paciente_id = caderno_entradas.paciente_id
      and vinculos.profissional_id = profissional_id_do_usuario_atual()
      and vinculos.ativo = true
    )
  );
