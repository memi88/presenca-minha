-- Frases de intenção por espaço (docs/presenca-frases-intencao-oficial.md):
-- cada um dos 4 espaços principais mostra um bloco de intenção completo na
-- primeira entrada da conta, depois reduz pra um título expansível. Precisa
-- ser por conta no banco (não localStorage) — sessão anônima já se perde ao
-- trocar de aparelho/limpar dados, e não faz sentido reexibir por causa disso.
--
-- Sem policy nova: a policy já existente "usuário lê e edita o próprio
-- perfil" (auth.uid() = id, for all) em `profiles` já cobre.
alter table profiles add column if not exists intro_conversa_vista_em timestamptz;
alter table profiles add column if not exists intro_livro_vivo_vista_em timestamptz;
alter table profiles add column if not exists intro_praticas_vista_em timestamptz;
alter table profiles add column if not exists intro_diario_vista_em timestamptz;
