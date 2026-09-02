-- App mobile (docs/presenca-extensao-app-mobile.md §2) — o app nunca processa
-- nem exibe pagamento; ele só verifica se a conta tem acesso liberado. Como
-- ainda não existe cobrança de verdade (sem Stripe/Asaas implementado), esse
-- campo começa como um interruptor manual: default true preserva o
-- comportamento atual (ninguém é bloqueado), e Guilherme pode virar false
-- numa conta específica quando quiser testar a tela de acesso do app antes
-- de existir um sistema de assinatura real.
alter table profiles add column if not exists acesso_liberado boolean not null default true;
