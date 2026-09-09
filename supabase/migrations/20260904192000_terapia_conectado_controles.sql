-- Terapia (conectado) — mockup terapia_conectado_controles_padronizados:
-- toggles de compartilhamento por categoria (práticas/Livro Vivo) e botão
-- "desconectar". Nenhum dos dois tinha mecanismo real antes desta
-- migration — só existia compartilhamento por entrada individual do
-- Diário (caderno_entradas.compartilhar, Fase 2) e nenhuma function que
-- permitisse o paciente encerrar o próprio vínculo (só conectar_profissional,
-- Fase 4).
alter table vinculos add column compartilhar_praticas boolean not null default false;
alter table vinculos add column compartilhar_livro_vivo boolean not null default false;

-- Uma function por categoria (em vez de uma só recebendo os 2 valores) —
-- evita que dois toggles clicados em sequência rápida se sobrescrevam um
-- ao outro por causa de round-trips fora de ordem.
create or replace function definir_compartilhar_praticas(p_valor boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;

  update vinculos set compartilhar_praticas = p_valor
  where paciente_id = auth.uid() and ativo = true;
end;
$$;

revoke all on function definir_compartilhar_praticas(boolean) from public;
grant execute on function definir_compartilhar_praticas(boolean) to authenticated;

create or replace function definir_compartilhar_livro_vivo(p_valor boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;

  update vinculos set compartilhar_livro_vivo = p_valor
  where paciente_id = auth.uid() and ativo = true;
end;
$$;

revoke all on function definir_compartilhar_livro_vivo(boolean) from public;
grant execute on function definir_compartilhar_livro_vivo(boolean) to authenticated;

-- Desconectar: soft delete (ativo = false, mesma linha continua existindo
-- — histórico de created_at preservado caso reconecte depois), espelhando
-- o que conectar_profissional faz na criação (Fase 4): também limpa
-- profiles.profissional_id, pra tudo que depende dele (RLS de
-- profissionais, "Do seu terapeuta" na Home etc.) parar de considerar a
-- pessoa conectada imediatamente.
create or replace function desconectar_terapeuta()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paciente_id uuid := auth.uid();
begin
  if v_paciente_id is null then
    raise exception 'não autenticado';
  end if;

  update vinculos set ativo = false where paciente_id = v_paciente_id and ativo = true;
  update profiles set profissional_id = null where id = v_paciente_id;
end;
$$;

revoke all on function desconectar_terapeuta() from public;
grant execute on function desconectar_terapeuta() to authenticated;
