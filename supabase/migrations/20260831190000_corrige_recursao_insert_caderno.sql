-- Corrige recursão de RLS na policy de INSERT de caderno_entradas —
-- descoberta testando o P6 (fechamento do dia) de verdade, mas afeta
-- QUALQUER insert com autor_tipo = 'usuario', não só o P6: guardarNoDiario
-- (Conversa) e criarEntrada (Diário) também foram confirmados falhando
-- silenciosamente contra o banco de produção real antes desta correção.
--
-- Causa: esta policy (Fase 0) consulta `profissionais` diretamente —
-- `auth.uid() = (select user_id from profissionais where id =
-- autor_profissional_id)` — sem passar pela função `security definer`
-- `profissional_id_do_usuario_atual()` que a Fase 4
-- (20260710142826_fase4_corrige_recursao_rls.sql) criou especificamente
-- pra quebrar o ciclo profissionais → vinculos → profissionais. As 3
-- policies de SELECT foram corrigidas na época; esta de INSERT ficou de
-- fora e nunca foi re-testada de ponta a ponta depois disso.
--
-- Erro real reproduzido (Postgres, código 42P17):
-- "infinite recursion detected in policy for relation caderno_entradas"
drop policy "profissional insere apenas em pacientes vinculados" on caderno_entradas;
create policy "profissional insere apenas em pacientes vinculados"
  on caderno_entradas for insert with check (
    autor_tipo = 'profissional'
    and autor_profissional_id = profissional_id_do_usuario_atual()
    and exists (
      select 1 from vinculos
      where vinculos.paciente_id = caderno_entradas.paciente_id
      and vinculos.profissional_id = caderno_entradas.autor_profissional_id
      and vinculos.ativo = true
    )
  );
