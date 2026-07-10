-- Bug encontrado testando a Fase 2 (autoria visual diferenciada): a única
-- policy de select em `profissionais` era "o profissional lê o próprio
-- registro" (auth.uid() = user_id). Isso deixava a entrada do caderno
-- visível pro paciente, mas o nome do profissional (o join que a tela usa
-- pra desenhar a borda/fundo slate + nome) ficava bloqueado — a pessoa via
-- a entrada "órfã", sem saber quem escreveu.
--
-- Escopo da policy: só o nome fica visível, e só quando o profissional já
-- escreveu de fato algo no caderno desse paciente específico — não abre
-- select geral em `profissionais` pra qualquer authenticated.

create policy "paciente vê o profissional que escreveu no seu caderno"
  on profissionais for select using (
    exists (
      select 1 from caderno_entradas
      where caderno_entradas.autor_profissional_id = profissionais.id
      and caderno_entradas.paciente_id = auth.uid()
    )
  );
