-- Menu de destinos personalizado da Home — "continue de onde você parou"
-- precisa saber qual foi o último destino visitado. Sem policy nova: a
-- policy já existente "usuário lê e edita o próprio perfil" (auth.uid() =
-- id, for all) em `profiles` já cobre essa coluna.

alter table profiles add column ultimo_destino text;
