# Presença — Extensão: Self-signup de Terapeuta, Pré-cadastro de Paciente e Biblioteca Colaborativa

> Documento complementar ao `presenca-prd.md` (produto) e ao `presenca-ia-arquitetura.md` (IA). Registra decisões tomadas em conversa entre Guilherme e Claude sobre três frentes novas do Cuida. **Deve ser adicionado à Project Knowledge** assim que revisado — sem isso, a próxima conversa não tem esse contexto.

---

## 0. Por que essa extensão existe

Hoje o Cuida é limitado: terapeuta é cadastrado manualmente por script, paciente só se conecta por código genérico, e a Biblioteca só cresce por curadoria direta no banco. Essa extensão dá autonomia ao terapeuta em três pontos — sem abrir mão dos princípios que já regem o projeto (voz de marca, privacidade por arquitetura, "nenhuma linguagem possui a verdade").

---

## 1. Princípios que restringem esta extensão (recap, não repetir depois)

- **Dado clínico sobre o paciente nunca alimenta a IA.** Características e anotações que o terapeuta registra são só dele — vale mesmo com o argumento de "personalizar melhor a experiência". Decisão consciente: revisitar só se houver interesse futuro, não fazer agora.
- **Privacidade por arquitetura, não por promessa** (PRD §2.5) — nenhuma policy de RLS pode dar ao paciente, nem depois de confirmar o vínculo, acesso às próprias características/anotações que o terapeuta escreveu sobre ele.
- **Nenhuma prática entra sem curadoria de qualidade** — estendido aqui: nenhuma prática de terapeuta entra sem aprovação de admin (Guilherme).
- **Revelação contextual continua valendo pro fluxo orgânico** — só o fluxo de link pessoal muda o onboarding; quem chega sozinho (`/chegada`, código genérico) mantém o fluxo anônimo→conversão de sempre.

---

## 2. Self-signup do terapeuta

Campos já existem no schema atual (`profissionais.tipo`, `abordagem`, `forma_de_trabalho`, `usa_linguagens_simbolicas`) — não precisa de migration nova aqui, só destravar o fluxo de auto-cadastro no Cuida (hoje é só via `scripts/cadastrar-profissional.mjs`, rodado manualmente por Guilherme).

**Lista de tipos, decidida:** TCC, Psicanálise, Gestalt-terapia, Terapia Sistêmica, ACT, Humanista, Holística/Integrativa, Outra (campo livre, pra quando nenhuma das anteriores encaixar).

```sql
alter table profissionais add constraint profissionais_tipo_check
  check (tipo in ('TCC','Psicanálise','Gestalt-terapia','Terapia Sistêmica','ACT','Humanista','Holística/Integrativa','Outra'));
```
Quando `tipo = 'Outra'`, o campo `forma_de_trabalho` (já existente) carrega a descrição livre — não precisa de coluna nova.

Fluxo: tela de cadastro no Cuida → cria `auth.users` (e-mail/senha) → insere linha em `profissionais` vinculada ao `user_id` → terapeuta já entra logado.

---

## 3. Pré-cadastro de paciente + link pessoal

**Decisão:** terapeuta pode pré-cadastrar um paciente (nome, características, anotações) antes dele existir no app, gerar um link único, e o paciente confirma os próprios dados ao abrir o link — pulando a etapa de conta anônima, indo direto pra conta permanente (porque o vínculo com o terapeuta já é certo nesse fluxo).

**O código de convite genérico continua existindo em paralelo**, sem nenhuma mudança — serve pra quem descobre o app sozinho e quer se conectar por conta própria.

### Schema

```sql
create table pacientes_pre_cadastro (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid references profissionais(id) not null,
  nome text not null,                 -- confirmável pelo paciente no link
  caracteristicas text,               -- privado, só o terapeuta vê, NUNCA IA, NUNCA paciente
  anotacoes text,                     -- idem
  token_convite text unique not null default encode(gen_random_bytes(16), 'hex'),
  status text default 'pendente' check (status in ('pendente','confirmado')),
  paciente_id uuid references profiles(id), -- nulo até confirmação
  created_at timestamptz default now(),
  confirmado_em timestamptz
);
alter table pacientes_pre_cadastro enable row level security;

create policy "profissional le e escreve os proprios pre-cadastros"
  on pacientes_pre_cadastro for all using (
    auth.uid() = (select user_id from profissionais where id = profissional_id)
  );
-- CRÍTICO: nenhuma policy de select para o paciente, nem depois de confirmado.
-- O acesso do paciente ao link passa só pelas RPCs abaixo (security definer),
-- que nunca expõem caracteristicas/anotacoes.
```

### RPCs (security definer, mesmo padrão de `conectar_profissional` já existente)

```sql
-- Chamada na tela pública do link, ANTES de qualquer autenticação —
-- retorna só o que é seguro mostrar (nome, status), nunca as anotações.
create or replace function validar_token_pre_cadastro(p_token text)
returns table(nome text, status text) as $$
  select nome, status from pacientes_pre_cadastro where token_convite = p_token;
$$ language sql security definer;

-- Chamada logo após o paciente criar a conta permanente (signUp),
-- pelo próprio usuário recém-criado — cria o vínculo e fecha o pré-cadastro.
create or replace function confirmar_pre_cadastro(p_token text, p_paciente_id uuid)
returns void as $$
declare v_profissional_id uuid;
begin
  if auth.uid() != p_paciente_id then
    raise exception 'não autorizado';
  end if;

  select profissional_id into v_profissional_id
  from pacientes_pre_cadastro
  where token_convite = p_token and status = 'pendente';

  if v_profissional_id is null then
    raise exception 'token inválido ou já usado';
  end if;

  insert into vinculos (profissional_id, paciente_id)
  values (v_profissional_id, p_paciente_id)
  on conflict (profissional_id, paciente_id) do update set ativo = true;

  update pacientes_pre_cadastro
  set status = 'confirmado', paciente_id = p_paciente_id, confirmado_em = now()
  where token_convite = p_token;
end;
$$ language plpgsql security definer;
```

### Fluxo

1. Terapeuta, no Cuida, cadastra o paciente (nome + características + anotações) → sistema gera `token_convite` → terapeuta compartilha o link fora do app (WhatsApp, etc.).
2. Paciente abre o link → tela pública chama `validar_token_pre_cadastro` → mostra só o nome pra confirmar ("é você, [nome]?").
3. Paciente confirma → cria conta permanente direto ali (e-mail/senha ou Google), **sem passar por conta anônima**.
4. Logo após o `signUp`, o client chama `confirmar_pre_cadastro(token, novo_uid)` → cria o vínculo, marca `confirmado`.
5. Paciente cai na Home já com terapeuta conectado — mesmo comportamento que o fluxo de código genérico já entrega hoje a partir desse ponto.

---

## 4. Biblioteca colaborativa (submissão do terapeuta + moderação)

**Decisão:** terapeuta pode propor práticas/páginas pro Livro Vivo. Toda proposta nasce `pendente`, sem exceção — só Guilherme aprova, recusa ou tira do ar depois. Isso vale inclusive para conteúdo com escopo "1 paciente só" — só o Diário (`caderno_entradas`) continua livre, sem fila de aprovação.

### Schema (altera `biblioteca` existente)

```sql
alter table biblioteca add column status_moderacao text default 'aprovado'
  check (status_moderacao in ('pendente','aprovado','recusado'));
alter table biblioteca add column escopo text default 'publico'
  check (escopo in ('publico','privado_profissional'));
alter table biblioteca add column profissional_autor_id uuid references profissionais(id);
alter table biblioteca add column motivo_recusa text;

-- conteúdo já existente (curado por Guilherme) nasce aprovado/publico por padrão — nada muda pra ele.
```

### Trigger — impede terapeuta de se auto-aprovar

```sql
create or replace function biblioteca_forca_pendente()
returns trigger as $$
begin
  if new.profissional_autor_id is not null
     and not exists (select 1 from admins where user_id = auth.uid()) then
    new.status_moderacao := 'pendente';
    new.publicado := false;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_biblioteca_forca_pendente
before insert on biblioteca
for each row execute function biblioteca_forca_pendente();
```

### Policies (substituem a policy de select atual da biblioteca)

```sql
drop policy if exists "qualquer usuário autenticado lê conteúdo publicado" on biblioteca;

create policy "leitura respeita escopo e publicacao"
  on biblioteca for select using (
    publicado = true
    and (
      escopo = 'publico'
      or (
        escopo = 'privado_profissional'
        and exists (
          select 1 from vinculos
          where vinculos.paciente_id = auth.uid()
          and vinculos.profissional_id = biblioteca.profissional_autor_id
          and vinculos.ativo = true
        )
      )
    )
  );

create policy "profissional propoe conteudo"
  on biblioteca for insert with check (
    profissional_autor_id = (select id from profissionais where user_id = auth.uid())
    and escopo in ('publico','privado_profissional')
  );
```

---

## 5. Painel de aprovação (admin)

**Decisão:** tela de verdade já nessa primeira leva — lista de pendentes (aprovar/recusar) + lista de publicados (tirar do ar). Não fica manual via SQL.

### Schema

```sql
create table admins (
  user_id uuid primary key references auth.users(id)
);
alter table admins enable row level security;
create policy "admin le a propria linha"
  on admins for select using (auth.uid() = user_id);

create policy "admin gerencia toda a biblioteca"
  on biblioteca for all using (
    exists (select 1 from admins where user_id = auth.uid())
  );
```
Guilherme inserido manualmente em `admins` (mesmo padrão de hoje pra tarefas administrativas pontuais).

### Tela — **decidido: rota separada** (`/admin/biblioteca`), protegida por `admins`, fora do Cuida. Evita qualquer chance de um terapeuta comum enxergar submissões de outro terapeuta por engano de UI.

Conteúdo da tela:
- **Pendentes:** autor (nome do profissional), tipo, prévia do conteúdo, escopo escolhido, botões Aprovar / Recusar (com campo de motivo, salvo em `motivo_recusa`).
- **Publicados:** mesma listagem, com ação "tirar do ar" (`publicado = false`, sem mexer no `status_moderacao`).

---

## 6. Atribuição de autoria na Biblioteca

**Decisão:** discreta, sem chamar atenção, mas disponível pra quem se interessar — e funciona como ponte pra quem ainda não tem terapeuta conectado.

- Rodapé da página/prática: "escrito por [nome]" quando `profissional_autor_id` existe (conteúdo de Guilherme continua usando o `autor` texto já existente, sem essa UI).
- Tocar no nome abre um cartão pequeno: nome, tipo/abordagem, breve descrição — mesmos campos do cadastro do terapeuta (seção 2), nada novo.
- CTA "conectar com [nome]" só aparece se `profiles.profissional_id` de quem está lendo for nulo. Quem já tem terapeuta não vê esse convite.
- Em `escopo = 'privado_profissional'`, a atribuição pode aparecer, mas sem CTA (a pessoa já está vinculada).

**Efeito colateral consciente:** isso pode gerar visibilidade desigual entre terapeutas dentro da Biblioteca pública (quem publica mais/melhor aparece mais). Não é bug — é trade-off do design, Guilherme está ciente.

---

## 7. Fora de escopo desta extensão (explícito)

- Anotações do terapeuta alimentando a IA da conversa — decisão consciente de não fazer agora, por envolver dado sensível de saúde. Revisitar só se houver interesse futuro.
- Qualquer mudança no fluxo orgânico de onboarding (`/chegada`, código genérico) — continua exatamente como está hoje.
- Aprovação para conteúdo do Diário (`caderno_entradas`) — continua livre, sem fila.

---

## 8. Status

Todas as decisões desta extensão estão fechadas — nenhuma pendência aberta. Pronto pra virar trabalho de desenvolvimento (ver `presenca-checklist-fase11-terapeutas-biblioteca.md`).
