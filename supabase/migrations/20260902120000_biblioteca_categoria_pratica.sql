-- Categoria de prática — taxonomia real pro filtro da tela de Práticas
-- (docs/redesign/biblioteca_de_pr_ticas_imersiva_e_padronizada, decisão
-- registrada em docs/redesign/pendencias-implementacao.md). Só se aplica a
-- tipo = 'pratica' — nula em páginas do Livro Vivo. Sem CHECK constraint,
-- de propósito: mesmo padrão que `tipo`/`escopo` já seguiam nesta tabela
-- (validação de valor aceito fica na camada de app, não no banco).
alter table biblioteca
  add column categoria text; -- 'respiracao' | 'meditacao' | 'movimento' | 'sono' | null (só pratica usa)
