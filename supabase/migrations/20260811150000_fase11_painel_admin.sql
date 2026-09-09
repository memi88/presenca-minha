-- Fase 11 — painel de aprovação (docs/presenca-extensao-terapeutas-biblioteca.md
-- seção 5). Tabela `admins` já existe (migration fase11_biblioteca_colaborativa,
-- adiantada por causa do trigger de moderação). Aqui: admin passa a gerenciar
-- toda a biblioteca, e precisa também ler o nome de qualquer profissional
-- pra resolver autoria na lista de pendentes (policy que o doc não previu —
-- sem ela, o join profissionais:profissional_autor_id(nome) simplesmente
-- some pra pendências de terapeutas que o admin não está vinculado).

create policy "admin gerencia toda a biblioteca"
  on biblioteca for all using (
    exists (select 1 from admins where user_id = auth.uid())
  );

create policy "admin le qualquer profissional"
  on profissionais for select using (
    exists (select 1 from admins where user_id = auth.uid())
  );

-- Só select+insert estavam liberados pra `authenticated` até aqui — aprovar/
-- recusar/tirar do ar é update (a policy acima restringe pra só admin fazer
-- de fato).
grant update on biblioteca to authenticated;
