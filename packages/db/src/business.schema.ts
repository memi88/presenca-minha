import { relations, sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { users } from "./auth.schema";

// Tradução das 11 tabelas de negócio do Supabase (34 migrations lidas por
// completo, `supabase/migrations/*.sql`) pro schema de negócio do D1 —
// Fase 2 da migração Supabase→Cloudflare (ver plano/memória do projeto).
//
// Decisões de tradução, valem pro arquivo inteiro:
// - Toda PK que era `uuid default gen_random_uuid()` vira `text` com
//   `$defaultFn(() => crypto.randomUUID())` — SQLite não tem tipo uuid
//   nem gerador nativo, mas `crypto.randomUUID()` existe tanto no runtime
//   dos Workers quanto em Node, então o formato do id continua o mesmo.
// - FK que era `references auth.users(id)` agora referencia `users.id`
//   (Better Auth, `auth.schema.ts`) — mesma relação, novo dono da tabela
//   de usuário.
// - `boolean` vira `integer(col, { mode: "boolean" })` — mesmo padrão que
//   o gerador do Better Auth já usou em `auth.schema.ts`.
// - `timestamptz` vira `integer(col, { mode: "timestamp_ms" })`; `date`/
//   `time` puros (sem hora ou sem fuso) viram `text` (string
//   "YYYY-MM-DD"/"HH:MM") — não existe tipo date/time nativo no SQLite,
//   e esses campos nunca precisaram de aritmética de data no Postgres
//   também, só armazenar/exibir.
// - `text[]` (array) vira `text(col, { mode: "json" }).$type<string[]>()`
//   — serializado como JSON, sem tipo array nativo no SQLite.
// - `vector(384)` (pgvector) vira `text(col, { mode: "json" }).$type<number[]>()`
//   — decisão já registrada: busca por similaridade roda em memória no
//   Worker (cosine similarity), não um banco vetorial dedicado, dado o
//   volume atual (poucas dezenas de linhas por pessoa).
// - RLS não existe no D1/SQLite — cada tabela abaixo tem um comentário
//   "RLS antiga" resumindo o que a policy do Postgres garantia, pra Fase
//   4 (camada de dados) replicar como checagem explícita em Server
//   Action/Route Handler, não esquecer nenhuma regra no caminho.
// - Colunas confirmadas mortas (sem nenhuma leitura/escrita no código
//   real, já documentado antes desta migração) foram **excluídas** de
//   propósito, aproveitando que é um banco novo do zero, sem dado real
//   pra preservar: `profiles.ultimo_destino` e as 4
//   `profiles.intro_*_vista_em` (headline adaptativo e "sobre este
//   espaço" removidos do app, ver docs/redesign/pendencias-implementacao.md),
//   `biblioteca.ambiente` (a própria migration que criou `origin` já
//   documentava isso como "coluna morta na prática — nenhuma query do
//   app a lê").

// ---------------------------------------------------------------------------
// profissionais (terapeutas hoje; genérico por design)
// ---------------------------------------------------------------------------
export const profissionais = sqliteTable(
  "profissionais",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    nome: text("nome").notNull(),
    // Repropriado na Fase 11: era "categoria de profissão" (terapeuta/
    // nutricionista/fono), virou "abordagem terapêutica". Sem default
    // desde cuida_perfil_gatilho — null é o sinal de "perfil incompleto"
    // que o gatilho de onboarding do Cuida usa.
    tipo: text("tipo"),
    userId: text("user_id").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    codigoConvite: text("codigo_convite")
      .notNull()
      .unique()
      .$defaultFn(() => crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()),
    formaDeTrabalho: text("forma_de_trabalho"),
    usaLinguagensSimbolicas: integer("usa_linguagens_simbolicas", { mode: "boolean" }).notNull().default(true),
    lembretePerfilEm: integer("lembrete_perfil_em", { mode: "timestamp_ms" }),
    // Chave do objeto no bucket R2 `presenca-media` (não a URL pronta —
    // servida via `/imagens/[chave]`, ver apps/*/app/imagens/[...chave]/route.ts).
    // Null = usa o placeholder SVG padrão (mesmo comportamento de antes do upload existir).
    fotoChave: text("foto_chave"),
  },
  (table) => [
    index("profissionais_user_id_idx").on(table.userId),
    check(
      "profissionais_tipo_check",
      sql`${table.tipo} in ('TCC', 'Psicanálise', 'Gestalt-terapia', 'Terapia Sistêmica', 'ACT', 'Humanista', 'Holística/Integrativa', 'Outra')`,
    ),
  ],
);

// RLS antiga: profissional lê/edita só o próprio registro (user_id =
// usuário logado); admin lê qualquer um; paciente lê o profissional
// vinculado (ou o que escreveu no caderno dele, ou o autor de conteúdo
// público na biblioteca) — 4 caminhos de leitura distintos, um só de
// escrita (o dono).

// ---------------------------------------------------------------------------
// profiles (estende a tabela de usuário do Better Auth)
// ---------------------------------------------------------------------------
export const profiles = sqliteTable(
  "profiles",
  {
    // Id PRÓPRIO, não mais o id do usuário — ver nota abaixo sobre por
    // que isso mudou na Fase 4 (camada de dados).
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // FK mutável pro usuário dono (era a própria PK até a Fase 4).
    // Corrigido depois de confirmar na Fase 1 que o plugin `anonymous` do
    // Better Auth TROCA o id do usuário ao promover sessão anônima pra
    // credencial real (diferente do auth.uid() estável do Supabase, que
    // esta tabela foi desenhada em cima). Se `id` continuasse sendo o
    // próprio id do usuário, promover a conta exigiria migrar a PK de
    // `profiles` E de toda tabela filha (`vinculos`, `caderno_entradas`,
    // `alertas_risco`, `lente_reacoes`, `pacientes_pre_cadastro` —
    // todas com FK pra `profiles.id`) numa cascata sem suporte real a FK
    // adiada no D1/SQLite. Desacoplado: `onLinkAccount` (packages/db/src/auth.ts)
    // faz só `update profiles set user_id = novoId where user_id = idAntigo`
    // — uma linha, sem cascata, porque `profiles.id` (o que as tabelas
    // filhas referenciam) nunca muda.
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id),
    nome: text("nome"),
    dataNascimento: text("data_nascimento"), // "YYYY-MM-DD", opcional
    horaNascimento: text("hora_nascimento"), // "HH:MM", opcional
    localNascimento: text("local_nascimento"),
    configuracaoHd: text("configuracao_hd", { mode: "json" }).$type<Record<string, unknown>>(),
    profissionalId: text("profissional_id").references(() => profissionais.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    lembreteConversaoEm: integer("lembrete_conversao_em", { mode: "timestamp_ms" }),
    presencaHoje: text("presenca_hoje"),
    presencaHojeEm: integer("presenca_hoje_em", { mode: "timestamp_ms" }),
    ultimaVisitaEm: integer("ultima_visita_em", { mode: "timestamp_ms" }),
    streakDiasConsecutivos: integer("streak_dias_consecutivos").notNull().default(0),
    streakAtualizadoEm: text("streak_atualizado_em"), // "YYYY-MM-DD"
    lembreteNascimentoEm: integer("lembrete_nascimento_em", { mode: "timestamp_ms" }),
    nascimentoLatitude: text("nascimento_latitude"),
    nascimentoLongitude: text("nascimento_longitude"),
    nascimentoPuladoNoCadastroEm: integer("nascimento_pulado_no_cadastro_em", { mode: "timestamp_ms" }),
    acessoLiberado: integer("acesso_liberado", { mode: "boolean" }).notNull().default(true),
  },
  (table) => [index("profiles_profissional_id_idx").on(table.profissionalId)],
);

// RLS antiga: "usuário lê e edita o próprio perfil" (auth.uid() = id, for
// all) cobre a esmagadora maioria das colunas — praticamente toda coluna
// nova ao longo do produto só reaproveitou essa policy única. Na Fase 4
// isso vira `where profiles.user_id = sessao.user.id` (não mais
// `profiles.id`, ver comentário na coluna `userId` acima). Exceção:
// "profissional lê perfil de pacientes vinculados" (join com vinculos,
// sempre via `profiles.id`, que não muda).

// ---------------------------------------------------------------------------
// vinculos (profissional <-> paciente)
// ---------------------------------------------------------------------------
export const vinculos = sqliteTable(
  "vinculos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profissionalId: text("profissional_id").references(() => profissionais.id),
    pacienteId: text("paciente_id").references(() => profiles.id),
    ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    compartilharPraticas: integer("compartilhar_praticas", { mode: "boolean" }).notNull().default(false),
    compartilharLivroVivo: integer("compartilhar_livro_vivo", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [uniqueIndex("vinculos_profissional_paciente_idx").on(table.profissionalId, table.pacienteId)],
);

// RLS antiga: paciente e profissional só enxergam os próprios vínculos
// (select). NUNCA teve policy de insert/update pro cliente — toda escrita
// era via function security definer (conectar_profissional,
// confirmar_pre_cadastro, definir_compartilhar_*, desconectar_terapeuta)
// — Fase 4 replica isso como Server Actions que fazem a MESMA validação
// antes de escrever, nunca um update direto exposto.

// ---------------------------------------------------------------------------
// biblioteca (Livro Vivo, práticas — curado, com contribuição de
// profissionais desde a Fase 11)
// ---------------------------------------------------------------------------
export const biblioteca = sqliteTable(
  "biblioteca",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tipo: text("tipo").notNull(), // 'pagina_livro_vivo' | 'pratica' | outros nunca usados na prática
    titulo: text("titulo"),
    conteudo: text("conteudo").notNull(),
    tagsMomentoVida: text("tags_momento_vida", { mode: "json" }).$type<string[]>(),
    tagsHd: text("tags_hd", { mode: "json" }).$type<string[]>(),
    // Nullable de propósito (igual ao Postgres original, achado na Fase 4
    // — a Fase 2 tinha marcado como notNull por engano): conteúdo com
    // profissionalAutorId preenchido grava autor=null aqui, distinguindo
    // "escrito por um profissional" de "curado pelo Guilherme" (autor
    // preenchido, profissionalAutorId nulo).
    autor: text("autor").default("Guilherme"),
    publicado: integer("publicado", { mode: "boolean" }).notNull().default(true),
    embedding: text("embedding", { mode: "json" }).$type<number[]>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    slug: text("slug").unique(),
    statusModeracao: text("status_moderacao").notNull().default("aprovado"),
    escopo: text("escopo").notNull().default("publico"),
    profissionalAutorId: text("profissional_autor_id").references(() => profissionais.id),
    motivoRecusa: text("motivo_recusa"),
    categoria: text("categoria"), // 'respiracao' | 'meditacao' | 'movimento' | 'sono' | null (só pratica usa)
    origin: text("origin"), // 'TRADITIONAL_MAYA' | 'LAW_OF_TIME' | 'HUMAN_DESIGN' | 'KABBALAH' | 'PRESENTE' | 'PRESENCA' | null
    // Mesmo padrão de profissionais.fotoChave — chave no R2, não URL pronta.
    // Null = usa o placeholder SVG padrão (mesmo comportamento de antes do upload existir).
    capaChave: text("capa_chave"),
  },
  (table) => [
    index("biblioteca_profissional_autor_id_idx").on(table.profissionalAutorId),
    check("biblioteca_status_moderacao_check", sql`${table.statusModeracao} in ('pendente', 'aprovado', 'recusado')`),
    check("biblioteca_escopo_check", sql`${table.escopo} in ('publico', 'privado_profissional')`),
    check(
      "biblioteca_origin_check",
      sql`${table.origin} is null or ${table.origin} in ('TRADITIONAL_MAYA', 'LAW_OF_TIME', 'HUMAN_DESIGN', 'KABBALAH', 'PRESENTE', 'PRESENCA')`,
    ),
  ],
);

// RLS antiga: leitura respeita `publicado` + `escopo` (público pra
// qualquer autenticado; privado_profissional só quem tem vínculo ativo
// com o autor) — nunca teve select público (`anon`). Insert: só o próprio
// profissional, com profissional_autor_id preenchido (proposta nasce
// pendente/não-publicada via trigger `biblioteca_forca_pendente`, exceto
// se quem insere é admin); sem profissional_autor_id (conteúdo curado
// pelo Guilherme), a escrita nunca passou pelo client-side, sempre por
// ferramenta interna — Fase 4 mantém essa distinção.

// ---------------------------------------------------------------------------
// caderno_entradas (Meu Livro)
// ---------------------------------------------------------------------------
export const cadernoEntradas = sqliteTable(
  "caderno_entradas",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pacienteId: text("paciente_id")
      .notNull()
      .references(() => profiles.id),
    autorTipo: text("autor_tipo").notNull(), // 'usuario' | 'profissional'
    autorProfissionalId: text("autor_profissional_id").references(() => profissionais.id),
    tipo: text("tipo").notNull().default("reflexao"),
    conteudo: text("conteudo").notNull(),
    bibliotecaRefId: text("biblioteca_ref_id").references(() => biblioteca.id),
    revisitar: integer("revisitar", { mode: "boolean" }).notNull().default(false),
    embedding: text("embedding", { mode: "json" }).$type<number[]>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    conexaoConteudo: text("conexao_conteudo"),
    compartilhar: integer("compartilhar", { mode: "boolean" }).notNull().default(false),
    fechamentoRespostaRapida: text("fechamento_resposta_rapida"),
  },
  (table) => [
    index("caderno_entradas_paciente_id_idx").on(table.pacienteId),
    index("caderno_entradas_autor_profissional_id_idx").on(table.autorProfissionalId),
  ],
);

// RLS antiga (a mais elaborada do schema todo — conferir com cuidado na
// Fase 4, já teve 2 bugs de recursão de RLS corrigidos em produção real):
// paciente lê/escreve/apaga as próprias entradas de autor_tipo='usuario';
// paciente também lê (só lê) as que o profissional vinculado escreveu;
// profissional insere só em paciente vinculado ativo, rotulando a própria
// autoria, nunca lê de volta entrada de autor_tipo='usuario' EXCETO
// quando `compartilhar = true` (opt-in por entrada, Diário).

// ---------------------------------------------------------------------------
// alertas_risco
// ---------------------------------------------------------------------------
export const alertasRisco = sqliteTable(
  "alertas_risco",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pacienteId: text("paciente_id")
      .notNull()
      .references(() => profiles.id),
    profissionalId: text("profissional_id")
      .notNull()
      .references(() => profissionais.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (table) => [index("alertas_risco_profissional_id_idx").on(table.profissionalId)],
);

// RLS antiga: paciente insere só pro profissional com quem tem vínculo
// ativo, e só lê os próprios alertas; profissional lê os alertas dos
// próprios pacientes. Nunca teve update/delete pra ninguém — é um log de
// auditoria, não um registro editável.

// ---------------------------------------------------------------------------
// admins
// ---------------------------------------------------------------------------
export const admins = sqliteTable("admins", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
});

// RLS antiga: cada admin só lia a própria linha (só existia pra checagem
// de "sou admin?" via EXISTS em outras policies — nunca uma listagem).
// Inserção sempre manual (SQL Editor), nunca pela API.

// ---------------------------------------------------------------------------
// pacientes_pre_cadastro
// ---------------------------------------------------------------------------
export const pacientesPreCadastro = sqliteTable(
  "pacientes_pre_cadastro",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profissionalId: text("profissional_id")
      .notNull()
      .references(() => profissionais.id),
    nome: text("nome").notNull(),
    // Privado — só o terapeuta vê, NUNCA IA, NUNCA paciente (nem depois
    // de confirmado). Sem policy de select pro paciente em lugar nenhum;
    // Fase 4 precisa manter essa ausência de propósito, não é descuido.
    caracteristicas: text("caracteristicas"),
    anotacoes: text("anotacoes"),
    tokenConvite: text("token_convite")
      .notNull()
      .unique()
      .$defaultFn(() => crypto.randomUUID().replace(/-/g, "")),
    status: text("status").notNull().default("pendente"),
    pacienteId: text("paciente_id").references(() => profiles.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    confirmadoEm: integer("confirmado_em", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("pacientes_pre_cadastro_profissional_id_idx").on(table.profissionalId),
    check("pacientes_pre_cadastro_status_check", sql`${table.status} in ('pendente', 'confirmado')`),
  ],
);

// RLS antiga: só o profissional dono lê/escreve os próprios pré-cadastros
// — CRÍTICO, sem exceção: nenhuma policy de select pro paciente, nem
// grant pra `anon`. O acesso do paciente ao link (antes de logar) passava
// só pela function `validar_token_pre_cadastro` (security definer, só
// devolve nome+status, nunca caracteristicas/anotacoes) — Fase 4 precisa
// de uma Server Action equivalente que faça exatamente essa mesma
// restrição de campos, não um select direto na tabela.

// ---------------------------------------------------------------------------
// lente_reacoes
// ---------------------------------------------------------------------------
export const lenteReacoes = sqliteTable(
  "lente_reacoes",
  {
    pacienteId: text("paciente_id")
      .notNull()
      .references(() => profiles.id),
    data: text("data").notNull(), // "YYYY-MM-DD", dia civil America/Sao_Paulo
    reacao: text("reacao").notNull(),
    criadoEm: integer("criado_em", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (table) => [
    primaryKey({ columns: [table.pacienteId, table.data] }),
    check("lente_reacoes_reacao_check", sql`${table.reacao} in ('gostei', 'nao_gostei')`),
  ],
);

// RLS antiga: cada pessoa só vê/edita a própria reação (auth.uid() =
// paciente_id, for all).

// ---------------------------------------------------------------------------
// conversa_rate_limit / embedding_rate_limit
// ---------------------------------------------------------------------------
export const conversaRateLimit = sqliteTable("conversa_rate_limit", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  janelaInicio: integer("janela_inicio", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  contagem: integer("contagem").notNull().default(0),
});

export const embeddingRateLimit = sqliteTable("embedding_rate_limit", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  janelaInicio: integer("janela_inicio", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  contagem: integer("contagem").notNull().default(0),
});

// RLS antiga (as duas): cada usuário só vê/edita a própria linha. As
// functions `pode_conversar`/`pode_calcular_embedding` (upsert atômico,
// reseta a janela quando expira) viram lógica de aplicação na Fase 4 —
// sem transação real do Postgres, precisa ficar atento a corrida entre
// requisições concorrentes do mesmo usuário (o que a função atômica do
// Postgres resolvia de graça).

// ---------------------------------------------------------------------------
// experiencias_guiadas + etapas/instâncias/respostas/consentimentos/
// devolutivas — categoria nova de conteúdo (percurso com etapas, dias de
// duração), além de Prática (ação pontual) e Livro Vivo (leitura). Nunca
// existiu no Supabase — nasce direto em D1/Drizzle, sem etapa interina em
// Postgres/RLS (ver docs/experiencias-guiadas-decisoes.md). Autorização
// só em Server Action, mesmo padrão do resto do schema (comentário
// "autorização" no lugar de "RLS antiga" porque não há RLS real anterior
// pra documentar).
// ---------------------------------------------------------------------------
export const experienciasGuiadas = sqliteTable(
  "experiencias_guiadas",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    titulo: text("titulo").notNull(),
    tipo: text("tipo").notNull(), // 'autoguiada' | 'guiada_metodo' | 'acompanhada'
    especialistaId: text("especialista_id").references(() => profissionais.id),
    descricao: text("descricao").notNull(),
    // Texto livre, ex: "4 etapas ao longo de alguns dias" — NUNCA número de
    // minutos (regra do PRD: não prometer velocidade que a experiência não tem).
    estimativaFormato: text("estimativa_formato"),
    // Sem coluna de moderação (diferente de biblioteca.statusModeracao) —
    // autoria é admin-direta (app/admin/experiencias-guiadas), não proposta
    // de terceiro que precisa aprovação.
    publicado: integer("publicado", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (table) => [
    index("experiencias_guiadas_especialista_id_idx").on(table.especialistaId),
    check("experiencias_guiadas_tipo_check", sql`${table.tipo} in ('autoguiada', 'guiada_metodo', 'acompanhada')`),
  ],
);

// Autorização: leitura liberada pra qualquer autenticado quando
// `publicado=true` (Descoberta); escrita só pela tela de admin (checagem
// contra a tabela `admins`, mesmo padrão de app/admin/biblioteca).

export const experienciasEtapas = sqliteTable(
  "experiencias_etapas",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    experienciaId: text("experiencia_id")
      .notNull()
      .references(() => experienciasGuiadas.id),
    ordem: integer("ordem").notNull(),
    conteudo: text("conteudo").notNull(),
    tipoResposta: text("tipo_resposta").notNull().default("texto"), // 'texto' | 'escolha'
    // Achado no mockup (docs/stitch_presen_a_home_guiada/
    // presen_a_in_cio_da_experi_ncia_consentimento): nem toda etapa de uma
    // experiência Acompanhada é lida pelo especialista — a Etapa 1 do
    // mockup é explicitamente "sem devolutiva nesta fase". É por etapa,
    // não um flag único pra experiência inteira.
    compartilhadaComEspecialista: integer("compartilhada_com_especialista", { mode: "boolean" })
      .notNull()
      .default(false),
    // Só quando tipoResposta='escolha' — visto no mockup de etapa em
    // andamento (presen_a_etapa_em_andamento_guiada_pelo_m_todo):
    // `orientacao` é o texto que aparece ao escolher aquela opção.
    opcoes: text("opcoes", { mode: "json" }).$type<
      Array<{ valor: string; rotulo: string; descricao?: string; orientacao?: string }>
    >(),
    // Mapa valor->próximaEtapaId, opcional — ausente/null = avança sempre
    // pra próxima etapa por `ordem`, igual ao único mockup que temos.
    ramificacoes: text("ramificacoes", { mode: "json" }).$type<Record<string, string>>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (table) => [
    index("experiencias_etapas_experiencia_id_idx").on(table.experienciaId),
    check("experiencias_etapas_tipo_resposta_check", sql`${table.tipoResposta} in ('texto', 'escolha')`),
  ],
);

// Autorização: leitura segue a mesma regra da experiência-mãe (publicado).

export const experienciasInstancias = sqliteTable(
  "experiencias_instancias",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pacienteId: text("paciente_id")
      .notNull()
      .references(() => profiles.id),
    experienciaId: text("experiencia_id")
      .notNull()
      .references(() => experienciasGuiadas.id),
    etapaAtualId: text("etapa_atual_id").references(() => experienciasEtapas.id),
    estado: text("estado").notNull().default("em_andamento"),
    iniciadoEm: integer("iniciado_em", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    concluidoEm: integer("concluido_em", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("experiencias_instancias_paciente_id_idx").on(table.pacienteId),
    index("experiencias_instancias_experiencia_id_idx").on(table.experienciaId),
    check(
      "experiencias_instancias_estado_check",
      sql`${table.estado} in ('em_andamento', 'aguardando_especialista', 'concluida')`,
    ),
  ],
);

// Autorização: paciente lê/escreve só a própria instância
// (pacienteId = profile.id da sessão); especialista lê só instâncias de
// experiências onde é o especialistaId (join com experiencias_guiadas).

export const experienciasRespostas = sqliteTable(
  "experiencias_respostas",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    instanciaId: text("instancia_id")
      .notNull()
      .references(() => experienciasInstancias.id),
    etapaId: text("etapa_id")
      .notNull()
      .references(() => experienciasEtapas.id),
    // Pra tipoResposta='escolha', serializa `{escolha, nota}` como JSON
    // string em código — sem coluna estruturada extra, mesmo padrão de
    // `caderno_entradas.conteudo` (sempre texto livre na coluna).
    conteudo: text("conteudo").notNull(),
    respondidoEm: integer("respondido_em", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (table) => [index("experiencias_respostas_instancia_id_idx").on(table.instanciaId)],
);

// Autorização: mesma regra da instância-mãe (paciente dono, ou
// especialista da experiência lendo só etapas marcadas
// compartilhadaComEspecialista).

export const experienciasConsentimentos = sqliteTable("experiencias_consentimentos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  instanciaId: text("instancia_id")
    .notNull()
    .unique()
    .references(() => experienciasInstancias.id),
  consentido: integer("consentido", { mode: "boolean" }).notNull().default(false),
  consentidoEm: integer("consentido_em", { mode: "timestamp_ms" }),
  revogadoEm: integer("revogado_em", { mode: "timestamp_ms" }), // nulo enquanto ativo
});

// Autorização: paciente lê/escreve só o próprio consentimento (via
// instância própria) — nunca herdado de outro consentimento (regra do
// PRD, princípio 3: consentimento é por finalidade, nunca genérico).

export const experienciasDevolutivas = sqliteTable(
  "experiencias_devolutivas",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    instanciaId: text("instancia_id")
      .notNull()
      .references(() => experienciasInstancias.id),
    especialistaId: text("especialista_id")
      .notNull()
      .references(() => profissionais.id),
    conteudo: text("conteudo").notNull(),
    criadoEm: integer("criado_em", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (table) => [index("experiencias_devolutivas_instancia_id_idx").on(table.instanciaId)],
);

// Autorização: paciente lê a própria devolutiva (via instância própria);
// só o especialista da experiência escreve.

// ---------------------------------------------------------------------------
// Relations — só o suficiente pra `with: {...}` do Drizzle substituir os
// embeds que o código atual já faz (`profissionais:autor_profissional_id(nome, tipo, ...)`
// etc.) na Fase 4. Não é RLS nem validação, só ergonomia de leitura.
// ---------------------------------------------------------------------------
export const profissionaisRelations = relations(profissionais, ({ one, many }) => ({
  usuario: one(users, { fields: [profissionais.userId], references: [users.id] }),
  vinculos: many(vinculos),
  bibliotecaAutorada: many(biblioteca),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  usuario: one(users, { fields: [profiles.userId], references: [users.id] }),
  profissionalConectado: one(profissionais, { fields: [profiles.profissionalId], references: [profissionais.id] }),
  entradas: many(cadernoEntradas),
  vinculos: many(vinculos),
}));

export const vinculosRelations = relations(vinculos, ({ one }) => ({
  profissional: one(profissionais, { fields: [vinculos.profissionalId], references: [profissionais.id] }),
  paciente: one(profiles, { fields: [vinculos.pacienteId], references: [profiles.id] }),
}));

export const bibliotecaRelations = relations(biblioteca, ({ one }) => ({
  profissionalAutor: one(profissionais, {
    fields: [biblioteca.profissionalAutorId],
    references: [profissionais.id],
  }),
}));

export const cadernoEntradasRelations = relations(cadernoEntradas, ({ one }) => ({
  paciente: one(profiles, { fields: [cadernoEntradas.pacienteId], references: [profiles.id] }),
  autorProfissional: one(profissionais, {
    fields: [cadernoEntradas.autorProfissionalId],
    references: [profissionais.id],
  }),
  bibliotecaRef: one(biblioteca, { fields: [cadernoEntradas.bibliotecaRefId], references: [biblioteca.id] }),
}));

export const pacientesPreCadastroRelations = relations(pacientesPreCadastro, ({ one }) => ({
  profissional: one(profissionais, {
    fields: [pacientesPreCadastro.profissionalId],
    references: [profissionais.id],
  }),
  paciente: one(profiles, { fields: [pacientesPreCadastro.pacienteId], references: [profiles.id] }),
}));

export const experienciasGuiadasRelations = relations(experienciasGuiadas, ({ one, many }) => ({
  especialista: one(profissionais, { fields: [experienciasGuiadas.especialistaId], references: [profissionais.id] }),
  etapas: many(experienciasEtapas),
}));

export const experienciasEtapasRelations = relations(experienciasEtapas, ({ one }) => ({
  experiencia: one(experienciasGuiadas, {
    fields: [experienciasEtapas.experienciaId],
    references: [experienciasGuiadas.id],
  }),
}));

export const experienciasInstanciasRelations = relations(experienciasInstancias, ({ one, many }) => ({
  paciente: one(profiles, { fields: [experienciasInstancias.pacienteId], references: [profiles.id] }),
  experiencia: one(experienciasGuiadas, {
    fields: [experienciasInstancias.experienciaId],
    references: [experienciasGuiadas.id],
  }),
  etapaAtual: one(experienciasEtapas, {
    fields: [experienciasInstancias.etapaAtualId],
    references: [experienciasEtapas.id],
  }),
  respostas: many(experienciasRespostas),
  consentimento: one(experienciasConsentimentos, {
    fields: [experienciasInstancias.id],
    references: [experienciasConsentimentos.instanciaId],
  }),
  devolutivas: many(experienciasDevolutivas),
}));

export const experienciasRespostasRelations = relations(experienciasRespostas, ({ one }) => ({
  instancia: one(experienciasInstancias, {
    fields: [experienciasRespostas.instanciaId],
    references: [experienciasInstancias.id],
  }),
  etapa: one(experienciasEtapas, { fields: [experienciasRespostas.etapaId], references: [experienciasEtapas.id] }),
}));

export const experienciasConsentimentosRelations = relations(experienciasConsentimentos, ({ one }) => ({
  instancia: one(experienciasInstancias, {
    fields: [experienciasConsentimentos.instanciaId],
    references: [experienciasInstancias.id],
  }),
}));

export const experienciasDevolutivasRelations = relations(experienciasDevolutivas, ({ one }) => ({
  instancia: one(experienciasInstancias, {
    fields: [experienciasDevolutivas.instanciaId],
    references: [experienciasInstancias.id],
  }),
  especialista: one(profissionais, {
    fields: [experienciasDevolutivas.especialistaId],
    references: [profissionais.id],
  }),
}));
