-- Sem isso, o join `profissionais:profissional_autor_id(...)` usado em
-- AutoriaBiblioteca (praticas/[id], livro-vivo/[id]) e na nova Página do
-- Autor (app/autor/[id]) voltava null pra qualquer leitor sem vínculo
-- direto com aquele profissional — só a policy "paciente vê o profissional
-- vinculado" (Fase 4) cobria isso, restrita a quem já está conectado.
-- Conteúdo público na biblioteca precisa da atribuição visível pra
-- qualquer leitor autenticado, conectado ou não.
--
-- ATENÇÃO: RLS é por LINHA, não por coluna — esta policy libera a linha
-- inteira de `profissionais` (não só nome/tipo/forma_de_trabalho) pra
-- quem tem conteúdo público publicado. Nenhuma query do lado Presença
-- pode selecionar `codigo_convite` sob esta policy — isso só é lido hoje
-- em apps/cuida/app/pacientes/page.tsx, pelo próprio profissional lendo o
-- próprio registro (policy separada, "profissional lê e edita o próprio
-- registro"), não afetado por esta mudança.
create policy "autenticado lê profissional com conteúdo público na biblioteca"
  on profissionais for select using (
    exists (
      select 1 from biblioteca
      where biblioteca.profissional_autor_id = profissionais.id
      and biblioteca.publicado = true
      and biblioteca.escopo = 'publico'
    )
  );
