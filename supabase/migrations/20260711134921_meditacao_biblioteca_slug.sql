-- Meditação — hub de práticas curadas (biblioteca.tipo = 'pratica', já
-- previsto desde a Fase 0). `slug` é um identificador estável (não muda se
-- o título for editado) usado pra ligar uma prática cadastrada a uma
-- experiência interativa customizada quando ela existir — hoje só a
-- Respiração 4-7-8 (Fôlego) tem uma; o resto usa a leitura genérica.

alter table biblioteca add column slug text unique;

-- Semeia o Fôlego direto — não depende do serviço de IA nem do script de
-- curadoria pra aparecer na lista (mesmo padrão de graceful-null da
-- página semente do Livro Vivo: embedding fica null até o serviço estar no ar).
insert into biblioteca (tipo, titulo, conteudo, slug, ambiente, publicado)
values (
  'pratica',
  'Respiração 4-7-8',
  'Uma respiração guiada de 4-7-8 — inspire por quatro segundos, segure por sete, expire por oito.',
  'respiracao-4-7-8',
  'escuro',
  true
);
