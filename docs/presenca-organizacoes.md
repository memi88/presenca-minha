# Presença Organizações — Arquitetura Técnica (v0.1)

> Documento complementar a `Presença Organizações.md` (visão estratégica), `presenca-prd.md` e `presenca-ia-arquitetura.md`. Traduz a visão em schema e mecanismo — mas **herda o status "Exploração" do documento estratégico**: nada aqui deveria virar código de produção antes das entrevistas de descoberta (seção 18 do doc estratégico) e da validação da taxonomia com especialistas (SST, psicologia organizacional, jurídico/LGPD). Isso é o desenho de como a coisa funcionaria, não uma ordem de construir agora.

---

## 0. Decisões de arquitetura fechadas nesta sessão

1. **Classificação de sinais reaproveita `tags_contexto`** (vocabulário fechado já planejado para V1 do Diário: `pai`, `filho`, `trabalho`, `relacionamento`, `comigo mesmo`, `amizades`) — filtrando por `trabalho`. Não cria um sistema de tagueamento paralelo.
2. **Vive no mesmo backend Supabase do Presença**, como tabelas novas — não é um sistema separado, não duplica infraestrutura.
3. **Dependência explícita:** esta extensão pressupõe que `tags_contexto` já esteja implementado em `caderno_entradas` (e idealmente em `conversas`). Hoje isso ainda não existe no código — é pré-requisito técnico, não só conceitual.

---

## 1. Princípios que restringem esta extensão (recap do doc estratégico)

- **A empresa nunca compra acesso à intimidade das pessoas.** Nenhuma policy de RLS pode, em nenhuma circunstância, dar a um papel organizacional acesso a conversa, entrada de diário, ou sinal individual de uma pessoa.
- **Se não for possível preservar privacidade, o dado não é mostrado.** Isso é regra de escrita (o dado agregado só é gravado quando já passa no limiar), não só regra de leitura — evita que um bug de UI exponha algo que nunca deveria ter sido calculado como "visível".
- **Nenhum rótulo/diagnóstico volta pra pessoa** — mesma regra que já vale para "identificar comportamento" no PRD §7, estendida aqui: a classificação por sinal organizacional é tão interna quanto a curadoria pessoal já existente, nunca mostrada a quem escreveu.
- **Consentimento do benefício ≠ consentimento da camada Ambiente.** São dois opt-ins completamente separados, o segundo sempre explícito e revogável a qualquer momento, nunca herdado do primeiro.
- **O Presença não é vendido como conformidade NR-1** — isso é decisão de posicionamento comercial (doc estratégico §8-9), não uma restrição técnica, mas vale registrar aqui porque significa que o sistema não deveria gerar nenhum artefato que pareça um laudo técnico ou documento de PGR.

---

## 2. Entidades novas

```sql
-- Empresa cliente
create table organizacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  plano text default 'cuidado' check (plano in ('cuidado','cuidado_ambiente')),
  ativo boolean default true,
  created_at timestamptz default now()
);
alter table organizacoes enable row level security;

-- Gestor da organização (RH, People, quem administra o contrato)
-- Nunca tem acesso a sinal individual nem a conteúdo de conversa/diário — só
-- gestão de membros/billing e leitura de sinais agregados (quando visíveis).
create table organizacao_gestores (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references organizacoes(id) not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamptz default now(),
  unique (organizacao_id, user_id)
);
alter table organizacao_gestores enable row level security;
create policy "gestor le o proprio registro"
  on organizacao_gestores for select using (auth.uid() = user_id);

-- Vínculo pessoa <-> organização, com os DOIS consentimentos separados
create table organizacao_membros (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references organizacoes(id) not null,
  paciente_id uuid references profiles(id) not null,
  status text default 'convidado' check (status in ('convidado','ativo','inativo')),
  consentiu_beneficio boolean default false,
  consentiu_beneficio_em timestamptz,
  consentiu_ambiente boolean default false,
  consentiu_ambiente_em timestamptz,
  consentiu_ambiente_revogado_em timestamptz, -- nulo enquanto ativo; preenchido ao revogar
  created_at timestamptz default now(),
  unique (organizacao_id, paciente_id)
);
alter table organizacao_membros enable row level security;

create policy "pessoa le e edita o proprio vinculo (consentimento)"
  on organizacao_membros for all using (auth.uid() = paciente_id);

create policy "gestor le membros da propria organizacao, sem sinais"
  on organizacao_membros for select using (
    exists (
      select 1 from organizacao_gestores
      where organizacao_gestores.organizacao_id = organizacao_membros.organizacao_id
      and organizacao_gestores.user_id = auth.uid()
    )
  );
-- Nota: esta policy expõe status/consentiu_beneficio pro gestor (necessário pra
-- billing/gestão de licenças), mas as colunas de consentiu_ambiente também
-- ficam visíveis por essa policy de linha inteira. Se isso for um problema de
-- product, considerar mover consentiu_ambiente pra uma tabela separada,
-- visível só pra pessoa e pro pipeline de agregação (nunca pro gestor).
-- Marcado como ponto a revisar antes de implementar (ver seção 6).

-- Classificação individual (privada, nunca exposta a papel organizacional)
create table sinais_classificacoes (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references profiles(id) not null,
  organizacao_id uuid references organizacoes(id) not null,
  categoria text not null, -- taxonomia da seção 3, a validar com especialistas
  origem_tipo text not null, -- 'caderno_entradas' | 'conversas'
  origem_id uuid not null,
  periodo date not null, -- primeiro dia do período de agregação (ex: mês)
  created_at timestamptz default now()
);
alter table sinais_classificacoes enable row level security;
-- Nenhuma policy de select para paciente_id nem para gestor.
-- Só acessível via service_role, no pipeline de agregação (seção 4).
-- Isso é deliberado: mesmo a própria pessoa não precisa ver o rótulo interno,
-- pelo mesmo princípio de "nenhum rótulo volta pra pessoa" já aplicado ao
-- restante do Presença.

-- Sinais agregados — só o que realmente fica visível pra organização
create table sinais_agregados (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references organizacoes(id) not null,
  categoria text not null,
  periodo date not null,
  contagem_pessoas int not null,
  contagem_ocorrencias int not null,
  created_at timestamptz default now(),
  unique (organizacao_id, categoria, periodo)
);
alter table sinais_agregados enable row level security;
create policy "gestor le sinais agregados da propria organizacao"
  on sinais_agregados for select using (
    exists (
      select 1 from organizacao_gestores
      where organizacao_gestores.organizacao_id = sinais_agregados.organizacao_id
      and organizacao_gestores.user_id = auth.uid()
    )
  );
-- INSERT só via service_role (pipeline de agregação), nunca client-side —
-- mesmo padrão já usado pra biblioteca (PRD §4).
```

**Por que uma linha só existe em `sinais_agregados` se já passou no limiar:** a tabela não guarda linhas "invisíveis pendentes de threshold" — o pipeline de agregação (seção 4) só escreve quando o limiar já foi atingido. Isso é mais seguro que gravar tudo e filtrar na leitura: elimina a categoria de bug "esqueci o filtro numa query nova".

---

## 3. Taxonomia de categorias (placeholder, não final)

Herdada do doc estratégico §5 — listada aqui só para o `check` constraint funcionar, **não é uma lista validada**:

```sql
alter table sinais_classificacoes add constraint sinais_categoria_check
  check (categoria in (
    'sobrecarga','dificuldade_desconexao','falta_autonomia','falta_suporte',
    'conflitos','seguranca_psicologica','reconhecimento','clareza_papel',
    'relacoes_lideranca','ritmo_trabalho','mudancas_organizacionais',
    'equilibrio_demandas_recursos'
  ));
```

Antes de qualquer classificação real rodar em produção: esta lista precisa passar por revisão de especialista em psicologia organizacional/SST (mesma pendência já nomeada no doc estratégico §5 e §18). Trocar essa lista depois é uma migration simples — não é motivo pra atrasar o resto do desenho.

---

## 4. Pipeline de classificação e agregação

```
caderno_entradas / conversas (tag 'trabalho' em tags_contexto)
        ↓ (só se organizacao_membros.consentiu_ambiente = true)
Job periódico (ex: mensal) classifica contra a taxonomia
        ↓
sinais_classificacoes (privado, por pessoa)
        ↓ (agrupa por organização + categoria + período)
Aplica limiar mínimo (contagem_pessoas >= N, contagem_ocorrencias >= M)
        ↓
sinais_agregados (só o que passou do limiar é escrito)
```

**Onde roda a classificação:** proposta é reaproveitar o mesmo padrão de modelo já usado para "identificar comportamento" (PRD §7) — chamada ao Claude (provavelmente Haiku 4.5, pelo mesmo motivo de custo/volume já documentado em `presenca-ia-arquitetura.md` §2) com saída estruturada (JSON: quais categorias da taxonomia se aplicam a um lote de entradas). Roda como job em lote, nunca em tempo real na conversa — mesma lógica de "a conversa não busca a cada mensagem" já estabelecida.

**Escopo do input:** só entradas/conversas de pessoas com `consentiu_ambiente = true`, e só o conteúdo já tagueado `trabalho` via `tags_contexto` — nunca o diário inteiro, nunca conversas fora desse contexto.

**Limiar mínimo — placeholder técnico, não decisão final:**
- `contagem_pessoas >= 5` (mínimo de pessoas distintas contribuindo pra aquela categoria naquele período)
- `contagem_ocorrencias >= 3`

Esses números existem só pra o mecanismo ter algo concreto pra implementar e testar — precisam de validação jurídica (LGPD, risco de reidentificação) antes de valer pra qualquer organização real. Times pequenos (< 5 pessoas na organização inteira) provavelmente nunca deveriam ver `sinais_agregados` nenhum, dado que o denominador é baixo demais pra proteger alguém — vale um teto adicional tipo "organização precisa ter N funcionários vinculados no total" antes do módulo Ambiente ficar disponível, não só o limiar por categoria/período.

**Revogação de consentimento:** ao `consentiu_ambiente` virar `false`, o pipeline deveria:
1. Parar de classificar novo conteúdo dessa pessoa imediatamente.
2. Apagar as linhas de `sinais_classificacoes` já existentes dela (são individualmente identificáveis, diferente de `sinais_agregados`, que já não referencia pessoa nenhuma).
3. Não tentar "desfazer" agregados já publicados — reprocessar um período passado removendo uma pessoa poderia, em tabelas pequenas, vazar por dedução quem revogou. Este é um ponto que precisa de revisão jurídica específica antes de decidir o comportamento certo.

---

## 5. O que o gestor da organização vê (e o que nunca vê)

| | Vê |
|---|---|
| Lista de membros (`organizacao_membros`) | Nome, status (convidado/ativo/inativo), se consentiu ao benefício — pra fins de billing |
| `sinais_agregados` | Categoria, período, contagem de pessoas/ocorrências — só linhas que já passaram no limiar |
| Conversas, diário, `sinais_classificacoes` individuais | **Nunca, em nenhuma circunstância** |
| Quem especificamente consentiu à camada Ambiente | Depende da decisão pendente na seção 2 (nota sobre a policy) — hoje o desenho vaza essa informação pro gestor via `organizacao_membros`; precisa decisão explícita se isso é aceitável ou se `consentiu_ambiente` precisa virar tabela separada |

---

## 6. Pontos em aberto (herdados do doc estratégico + novos desta sessão)

- **Limiar de anonimização** (contagem mínima de pessoas/ocorrências, e teto mínimo de tamanho de organização) — placeholder técnico proposto na seção 4, precisa de validação jurídica.
- **Visibilidade de `consentiu_ambiente` pro gestor** — a policy atual de `organizacao_membros` expõe essa coluna junto com o resto do vínculo. Decidir se isso é um vazamento de informação sensível (saber *quem* optou por não participar pode, em times pequenos, ser tão revelador quanto o próprio sinal) ou se é aceitável por ser só "sim/não participa", sem conteúdo.
- **Taxonomia de categorias** — placeholder da seção 3, precisa de revisão especializada antes de classificar qualquer dado real.
- **O colaborador consegue ver os próprios sinais agregados da organização?** — questão #7 da lista original do doc estratégico, não decidida aqui. O desenho atual não impede tecnicamente (poderia ter uma policy de select adicional pra `sinais_agregados` baseada em `organizacao_membros`), mas é uma decisão de produto separada, não assumida por padrão.
- **Corte por equipe/time** — questão #8-9 do doc estratégico. O schema atual só agrega por `organizacao_id` inteira; segmentar por equipe multiplicaria o risco de reidentificação (denominadores menores) e não está desenhado aqui.
- **Serviço de classificação:** confirmar se cabe no mesmo padrão de chamada Claude já usado no resto do app, ou se o volume/sensibilidade justifica um pipeline próprio — a decidir quando houver volume real de organizações piloto.
- **Dependência de `tags_contexto`:** este documento pressupõe que a V1 dessa feature (mencionada como próximo passo do núcleo Presença) já esteja implementada em `caderno_entradas`. Sem isso, não há sinal de "trabalho" pra filtrar.

---

## 7. Fora de escopo desta arquitetura (explícito)

- Qualquer UI (painel do gestor, tela de consentimento) — este documento é só dado/schema.
- Precificação — hipóteses já registradas no doc estratégico §12, não repetidas aqui.
- Integrações (SSO, exportação pra ferramentas de SST/PGR) — doc estratégico §11, não desenhado tecnicamente ainda.
- Qualquer alegação de conformidade NR-1/PGR no produto — decisão de posicionamento, não algo que este schema resolve ou deveria tentar resolver.
- Entrevistas de descoberta (doc estratégico §18) — **continuam sendo pré-requisito antes de qualquer construção real**, este documento não substitui isso.

---

## 8. Status

Arquitetura desenhada nesta sessão: entidades, consentimento duplo, pipeline de classificação/agregação reaproveitando `tags_contexto`, e limiares de anonimização como placeholder técnico. Nenhuma decisão aqui é final — a maior parte depende de validação jurídica (LGPD) e de especialista em SST/psicologia organizacional antes de virar código de produção, conforme o próprio doc estratégico já previa.