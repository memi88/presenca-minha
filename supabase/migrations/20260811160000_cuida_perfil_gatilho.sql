-- Cuida — redesign do onboarding (docs/presenca-extensao-terapeutas-biblioteca copy.md
-- §2, docs/cuida-onboarding-mockup.html): cadastro vira mínimo (nome/e-mail/
-- senha), e abordagem/linguagens simbólicas passam a ser pedidas só no
-- gatilho (antes do primeiro pré-cadastro de paciente), não na entrada.
--
-- `tipo` tinha default 'Outra' (migration fase11_self_signup_terapeuta,
-- pra sempre satisfazer o check constraint) — isso não dá mais um sinal
-- utilizável de "perfil incompleto" pro gate do pré-cadastro. Removendo o
-- default, cadastros novos ficam com tipo = null até o gatilho preencher de
-- verdade (o check constraint já aceita null — CHECK só falha quando a
-- expressão dá false, e `null in (...)` dá null, não false). Os registros
-- já existentes com tipo='Outra' (backfill anterior) não são tocados —
-- ficam "perfil completo" por coincidência; Guilherme pode zerar manualmente
-- se quiser forçá-los a passar pelo gatilho novo também.
alter table profissionais alter column tipo drop default;

-- Doc original (fase11_self_signup_terapeuta) tinha colocado default false
-- por engano — a decisão de sessão foi default true ("acreditamos que toda
-- forma de cuidado que ajuda merece espaço"). Só afeta cadastros novos;
-- registros existentes mantêm o valor que já têm (não é presumido o que a
-- pessoa escolheria).
alter table profissionais alter column usa_linguagens_simbolicas set default true;

-- Banner dispensável "complete seu perfil" na Home do Cuida — mesmo padrão
-- de lembrete_conversao_em/lembrete_nascimento_em já usado no Presença
-- (apps/presenca/app/home/actions.ts): "agora não" adia, nunca silencia de
-- vez.
alter table profissionais add column if not exists lembrete_perfil_em timestamptz;
