# Presença — Planejamento do redesign do Cuida

> Documento de estruturação, não de execução ainda — nenhum prompt foi
> escrito. Objetivo: inventariar o que existe de verdade no Cuida e o que
> nunca foi desenhado, antes de decidir por onde começar.

---

## 1. Decisão de identidade visual

**Cuida mantém sistema próprio — não adota Fraunces + Bitter do Presença.**

O código já documenta essa intenção (`globals.css`): *"mesma família
quente-neutra do Presença... com o teal como cor própria de CTA: sinaliza
'portal diferente' sem virar cinza de SaaS corporativo."* Confirmado em uso
real (não só documentado): Spectral itálico 500 nos títulos
(`page.module.css` em quatro telas diferentes), corpo em sans do sistema.

Tokens reais (de `apps/cuida/app/globals.css`):
```
--bg: #f7f4ee        --card-bg: #fff       --border: #e0d9c9
--text: #2a2118      --text-muted: #7a6f5c --accent: #b6873f
--cta-bg: #2f5d50 (teal)  --cta-text: #fff
--error: #b3432f
--atencao-bg: #fdf1dc --atencao-border: #ecd2a3 --atencao-text: #9a6b1f
```

O que **continua valendo** do trabalho feito no Presença: a disciplina de
ícone (nada de Material Symbols ou biblioteca genérica, traço orgânico) —
isso não é estética contemplativa, é regra de qualidade geral, vale pros
dois lados.

---

## 2. O que já existe (precisa de auditoria/polimento, não redesign do zero)

| Tela | Arquivo | Conteúdo real hoje |
|---|---|---|
| Login | `app/page.tsx` + `LoginForm.tsx` | E-mail/senha do terapeuta |
| Lista de pacientes | `app/pacientes/page.tsx` | Pacientes vinculados, código de convite próprio |
| Detalhe do paciente | `app/pacientes/[id]/page.tsx` | Escrever pergunta/prática/página no Diário do paciente |
| Perfil | `app/perfil/page.tsx` | Trocar a própria senha |

Essas 4 já têm decisão de tipografia/cor madura — o trabalho aqui é mais
auditoria (ícones genéricos escondidos? algo fora do padrão?) do que
redesenhar do zero.

**Achado durante o planejamento das telas novas:** o CSS atual trava
`max-width: 480px` mesmo em desktop (`pacientes/page.module.css`) — ou
seja, o Cuida hoje usa largura de celular mesmo rodando num monitor.
Cuida é majoritariamente usado no navegador, não no app mobile (que é só
o Presença) — vale corrigir isso na auditoria, aproveitando espaço
horizontal de verdade.

---

## 3. O que nunca foi desenhado (Fase 11 — só existe como especificação)

Do `presenca-extensao-terapeutas-biblioteca.md` — decisões de produto já
fechadas, mas sem nenhuma tela desenhada:

1. **Self-signup do terapeuta** — cadastro próprio (hoje só via script
   manual). Campos: tipo/abordagem (TCC, Psicanálise, Gestalt, etc.),
   forma de trabalho, toggle de linguagens simbólicas.
2. **Pré-cadastro de paciente + link pessoal** — terapeuta cadastra nome +
   características/anotações privadas, sistema gera link único.
3. **Tela pública de confirmação** — o que o paciente vê ao abrir o link
   (confirmar nome, criar conta direto, sem passar por conta anônima).
4. **Biblioteca colaborativa — submissão** — terapeuta propõe prática/
   página pro Livro Vivo, escolhe escopo (pública ou só pros próprios
   pacientes).
5. **Painel de aprovação (admin)** — `/admin/biblioteca`, rota separada,
   fora do Cuida — pendentes/aprovados, aprovar/recusar com motivo.

Essas 5 são trabalho novo de verdade, não reskin.

---

## 4. Proposta de sequência (a confirmar com você)

1. Auditoria rápida das 4 telas existentes (ícones, principalmente).
2. As 5 telas novas da Fase 11, provavelmente o grosso do trabalho.

Ainda não escrevi nenhum prompt — isso é só o mapa antes de começar.
