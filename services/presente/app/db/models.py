"""
models.py

Schema conforme IMPLEMENTATION_PLAN.md secao 2 (v0.4) + PRD_v0.1.md secao 6
(detalhamento de campos por sistema). Roda em Postgres local (Docker) nesta
fase -- a troca para Supabase (Etapa 5) e so a DATABASE_URL, sem mudanca de
modelagem (mesmo Postgres).
"""
import datetime
from typing import Optional

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Participante(Base):
    __tablename__ = "participantes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    nome_completo_nascimento: Mapped[str] = mapped_column(String(255), nullable=False)
    data_nascimento: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    hora_nascimento: Mapped[Optional[datetime.time]] = mapped_column(nullable=True)
    local_nascimento_texto: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    # CONTRATO (formalizado): dois fusos deliberadamente separados, nunca
    # usados de forma intercambiavel.
    #   timezone_nascimento -> usado SO nos calculos natais (data/hora de
    #     nascimento convertida para UTC -- relevante para Design Humano,
    #     que depende do instante exato; Numerologia natal usa so
    #     dia/mes/ano civis e nao consulta este campo). Nunca muda.
    #   timezone_atual -> usado SO para o snapshot de "Hoje" (03:00) e para
    #     o limite de "Semana" (seg-dom) -- ver app/horizons.py,
    #     snapshot_date_hoje(). Muda se o participante mudar de residencia.
    timezone_nascimento: Mapped[str] = mapped_column(String(64), nullable=False)
    timezone_atual: Mapped[str] = mapped_column(String(64), nullable=False)
    confiabilidade_hora: Mapped[str] = mapped_column(String(16), nullable=False)  # alta/media/baixa
    criado_em: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    perfil_numerologia: Mapped[Optional["PerfilNatalNumerologia"]] = relationship(
        back_populates="participante", uselist=False, cascade="all, delete-orphan"
    )
    perfil_dreamspell: Mapped[Optional["PerfilNatalDreamspell"]] = relationship(
        back_populates="participante", uselist=False, cascade="all, delete-orphan"
    )
    perfil_design_humano: Mapped[Optional["PerfilNatalDesignHumano"]] = relationship(
        back_populates="participante", uselist=False, cascade="all, delete-orphan"
    )


class PerfilNatalNumerologia(Base):
    __tablename__ = "perfil_natal_numerologia"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participante_id: Mapped[int] = mapped_column(ForeignKey("participantes.id"), unique=True, nullable=False)

    dia_natalicio: Mapped[int] = mapped_column(Integer, nullable=False)
    numero_psiquico: Mapped[int] = mapped_column(Integer, nullable=False)
    motivacao: Mapped[int] = mapped_column(Integer, nullable=False)
    impressao: Mapped[int] = mapped_column(Integer, nullable=False)
    expressao: Mapped[int] = mapped_column(Integer, nullable=False)
    destino: Mapped[int] = mapped_column(Integer, nullable=False)
    missao: Mapped[int] = mapped_column(Integer, nullable=False)
    licoes_carmicas: Mapped[list] = mapped_column(JSONB, nullable=False)
    tendencias_ocultas: Mapped[list] = mapped_column(JSONB, nullable=False)
    resposta_subconsciente: Mapped[int] = mapped_column(Integer, nullable=False)
    ciclos_de_vida: Mapped[list] = mapped_column(JSONB, nullable=False)
    desafios: Mapped[list] = mapped_column(JSONB, nullable=False)
    momentos_decisivos: Mapped[list] = mapped_column(JSONB, nullable=False)
    # PENDENTE (ver ENGINE_VALIDATION.md) -- hipotese de 1 ponto de dado, nao bloqueia
    talento_oculto_hipotese: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # PENDENTE -- nao resolvido
    debitos_carmicos: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    calculado_em: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    participante: Mapped["Participante"] = relationship(back_populates="perfil_numerologia")


class PerfilNatalDreamspell(Base):
    __tablename__ = "perfil_natal_dreamspell"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participante_id: Mapped[int] = mapped_column(ForeignKey("participantes.id"), unique=True, nullable=False)

    kin: Mapped[int] = mapped_column(Integer, nullable=False)
    selo: Mapped[str] = mapped_column(String(64), nullable=False)
    selo_cor: Mapped[str] = mapped_column(String(32), nullable=False)
    tom: Mapped[str] = mapped_column(String(32), nullable=False)
    tom_numero: Mapped[int] = mapped_column(Integer, nullable=False)
    onda_selo: Mapped[str] = mapped_column(String(64), nullable=False)
    onda_cor: Mapped[str] = mapped_column(String(32), nullable=False)
    # Campos do PRD_v0.1.md sec.6 (Guia/Analogo/Antipoda/Oculto/Familia
    # Terrestre/Plasma/Crono-psi) -- coluna existe (mesmo schema do PRD),
    # mas NAO e populada nesta fase: dreamspell_engine.py ainda nao
    # implementa essa camada de derivacao. Ver Etapa 7.
    guia: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    analogo: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    antipoda: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    oculto: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    familia_terrestre: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    plasma: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    crono_psi: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    calculado_em: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    participante: Mapped["Participante"] = relationship(back_populates="perfil_dreamspell")


class PerfilNatalDesignHumano(Base):
    __tablename__ = "perfil_natal_design_humano"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participante_id: Mapped[int] = mapped_column(ForeignKey("participantes.id"), unique=True, nullable=False)

    ativacoes_personalidade: Mapped[dict] = mapped_column(JSONB, nullable=False)  # corpo -> [gate, linha]
    ativacoes_design: Mapped[dict] = mapped_column(JSONB, nullable=False)
    perfil: Mapped[str] = mapped_column(String(8), nullable=False)  # ex.: "3/5"
    portas_da_cruz: Mapped[str] = mapped_column(String(32), nullable=False)
    tipo: Mapped[str] = mapped_column(String(32), nullable=False)
    autoridade: Mapped[str] = mapped_column(String(32), nullable=False)
    definicao: Mapped[str] = mapped_column(String(32), nullable=False)
    centros_definidos: Mapped[list] = mapped_column(JSONB, nullable=False)
    canais_definidos: Mapped[list] = mapped_column(JSONB, nullable=False)
    # Preservados manualmente, por decisao registrada em ENGINE_VALIDATION.md
    # secao 7 (item 2) -- tabela de ~192 combinacoes NAO implementada.
    nome_cruz: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    angulo_cruz: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    variaveis_codigo: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)  # ex.: "PLL DRL"
    calculado_em: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    participante: Mapped["Participante"] = relationship(back_populates="perfil_design_humano")


class ElementoCalculadoHorizonte(Base):
    """Fotografia congelada de um horizonte (cache/congelamento -- ver
    IMPLEMENTATION_PLAN.md secao 5). A unicidade de
    (participante, sistema, horizonte, chave_periodo) E o mecanismo de
    congelamento: se a linha existe, gerar_horizonte() retorna ela sem
    recalcular."""
    __tablename__ = "elementos_calculados_horizonte"
    __table_args__ = (
        UniqueConstraint(
            "participante_id", "sistema", "horizonte", "chave_periodo",
            name="uq_elemento_horizonte_periodo",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participante_id: Mapped[int] = mapped_column(ForeignKey("participantes.id"), nullable=False)
    sistema: Mapped[str] = mapped_column(String(32), nullable=False)  # numerologia/dreamspell/design_humano
    horizonte: Mapped[str] = mapped_column(String(16), nullable=False)  # ano/mes/semana/hoje
    data_referencia: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    chave_periodo: Mapped[str] = mapped_column(String(32), nullable=False)  # ex.: "2026-08-14", "2026-W33"
    elementos_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    composition_status: Mapped[str] = mapped_column(String(16), nullable=False)  # nativo/experimental
    calculado_em: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MomentoDiario(Base):
    """`daily_moment` da A2 (CLAUDE.md secao 6) -- contrato estavel e
    idempotente por participante/dia da leitura Dreamspell do Alpha,
    separado de `elementos_calculados_horizonte` (que serve a hierarquia
    Pessoa->Ano->Mes->Semana->Hoje dos 3 sistemas, nao o piloto do Alpha).

    Nomes traduzidos do briefing da A2 (ingles) para o padrao Portugues
    do resto do schema, mantendo o contrato 1:1:
      participant_id -> participante_id | reference_date -> data_referencia
      computed_at -> calculado_em | timezone_used -> timezone_usado
      seal -> selo | tone -> tom | day_type -> tipo_dia
      moon/moon_day -> lua/dia_da_lua | engine_version -> versao_motor

    Um desvio deliberado do briefing: `selo_cor` foi adicionado como campo
    extra (o briefing so pedia `seal` unico). Selo e cor sao mantidos
    separados aqui pelo mesmo motivo de PerfilNatalDreamspell/DreamspellAdapter
    -- concatenar em uma string so quebraria a traducao de exibicao com
    genero/acento corretos em Portugues (ver SELO_COR_EXIBICAO em
    app/routes_experiencia.py) quando a tela diaria do Alpha (A6) for construida.

    tipo_dia: um destes tres valores (mesmo vocabulario do Gate 0, ver
    DREAMSPELL_CALENDAR_CONVENTION.md -- nao traduzido, e o token oficial):
      "REGULAR" | "DAY_OUT_OF_TIME" | "HUNAB_KU_0_0"
    Em HUNAB_KU_0_0, kin/selo/tom sao None (o dia nao tem Kin proprio)."""
    __tablename__ = "momentos_diarios"
    __table_args__ = (
        UniqueConstraint(
            "participante_id", "data_referencia",
            name="uq_momento_diario_participante_data",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participante_id: Mapped[int] = mapped_column(ForeignKey("participantes.id"), nullable=False)
    data_referencia: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    # Snapshot do timezone_atual do participante NO MOMENTO do calculo --
    # se a pessoa mudar de fuso depois, este registro congelado nao muda
    # retroativamente (ver regra 3 do briefing da A2).
    timezone_usado: Mapped[str] = mapped_column(String(64), nullable=False)
    kin: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    selo: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    selo_cor: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    tom: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    tipo_dia: Mapped[str] = mapped_column(String(20), nullable=False)
    # Calendario de 13 Luas -- NULL ate a A3 implementar (NOT_IMPLEMENTED,
    # ver ENGINE_VALIDATION.md secao 8).
    lua: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    dia_da_lua: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    versao_motor: Mapped[str] = mapped_column(String(64), nullable=False)
    calculado_em: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ResultadoRelevancia(Base):
    """`relevance_result` da A4 (CLAUDE.md secao 5/6) -- Relevance Engine
    minimo, deterministico: compara o Selo do MomentoDiario de hoje com o
    Selo natal do participante (PerfilNatalDreamspell.selo).

    Nomes traduzidos do briefing (mesmo padrao do MomentoDiario/A2):
      daily_moment_id -> momento_diario_id | participant_id -> participante_id
      nivel_relacao -> nivel_relacao (igual) | detalhe -> detalhe (igual)
      ruleset_version -> versao_ruleset | computed_at -> calculado_em

    nivel_relacao: valores de NIVEL_NONE/NIVEL_SAME_SEAL (app/alpha/
    relevance.py) -- coluna String livre (mesmo padrao de tipo_dia em
    MomentoDiario), NAO um Postgres ENUM, de proposito: o briefing pede o
    enum "aberto para extensao futura" (niveis B/C tematicos, fora do
    escopo da A4) -- um ENUM nativo exigiria migration pra cada nivel novo,
    uma coluna String nao.

    Imutabilidade: a unicidade e por (momento_diario_id, versao_ruleset),
    NAO so por momento_diario_id -- se o ruleset mudar de versao no
    futuro, uma nova linha e criada para a nova versao, e a linha antiga
    (calculada com a versao antiga) nunca e alterada. Mesmo principio de
    `daily_present` (congelamento apos publicacao, ver CLAUDE.md secao 6)."""
    __tablename__ = "resultados_relevancia"
    __table_args__ = (
        UniqueConstraint(
            "momento_diario_id", "versao_ruleset",
            name="uq_resultado_relevancia_momento_versao",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    momento_diario_id: Mapped[int] = mapped_column(ForeignKey("momentos_diarios.id"), nullable=False)
    participante_id: Mapped[int] = mapped_column(ForeignKey("participantes.id"), nullable=False)
    nivel_relacao: Mapped[str] = mapped_column(String(20), nullable=False)
    detalhe: Mapped[dict] = mapped_column(JSONB, nullable=False)  # {selo_natal, selo_hoje, match}
    versao_ruleset: Mapped[str] = mapped_column(String(64), nullable=False)
    calculado_em: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LeituraDiaria(Base):
    """`daily_present` da A5 (CLAUDE.md secao 5/6) -- a leitura publicada
    do dia (reflexao + pergunta + pratica opcional), congelada apos
    publicacao. NAO chamada "Presente" no schema pra nao colidir com o
    nome do produto -- ver app/alpha/interpretation.py pro pipeline que
    preenche esta tabela.

    Nomes traduzidos do briefing (mesmo padrao de MomentoDiario/
    ResultadoRelevancia):
      daily_present -> leitura_diaria (tabela leituras_diarias)
      reference_date -> data_referencia | daily_moment_id -> momento_diario_id
      relevance_result_id -> resultado_relevancia_id
      reflection -> reflexao | question -> pergunta | practice -> pratica
      derivation_summary -> resumo_derivacao | qa_status -> status_qa (igual)
      prompt_version -> versao_prompt | ruleset_version_used -> versao_ruleset_usada
      published_at -> publicado_em

    status_qa: mesmo padrao de tipo_dia/nivel_relacao -- coluna String
    livre (nao Postgres ENUM), valores fixos por convencao (nao
    traduzidos, sao tokens de estado do pipeline, nao prosa):
      APPROVED_FIRST_TRY | APPROVED_AFTER_REWRITE | FALLBACK_CURATED | FIXED_HUNAB_KU

    Imutabilidade: UNIQUE(participante_id, data_referencia) -- uma vez
    publicada, uma leitura do dia nunca e regravada (mesmo principio do
    congelamento de MomentoDiario/ElementoCalculadoHorizonte)."""
    __tablename__ = "leituras_diarias"
    __table_args__ = (
        UniqueConstraint(
            "participante_id", "data_referencia",
            name="uq_leitura_diaria_participante_data",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participante_id: Mapped[int] = mapped_column(ForeignKey("participantes.id"), nullable=False)
    data_referencia: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    momento_diario_id: Mapped[int] = mapped_column(ForeignKey("momentos_diarios.id"), nullable=False)
    resultado_relevancia_id: Mapped[int] = mapped_column(ForeignKey("resultados_relevancia.id"), nullable=False)
    reflexao: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # None quando Hunab Ku
    pergunta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pratica: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # sempre None nesta etapa -- ver CLAUDE.md
    resumo_derivacao: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status_qa: Mapped[str] = mapped_column(String(32), nullable=False)
    versao_prompt: Mapped[str] = mapped_column(String(64), nullable=False)
    versao_ruleset_usada: Mapped[str] = mapped_column(String(64), nullable=False)
    publicado_em: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LeituraDiariaGenerica(Base):
    """Ponte de leitura para o Presenca (produto externo, 29/08/2026) --
    NAO faz parte da experiencia dos 4 participantes do Alpha. Serve
    GET /api/publico/hoje-dreamspell (app/ponte_presenca/), publico e sem
    autenticacao (ver app/auth.py, ROTAS_PUBLICAS).

    Deliberadamente DESACOPLADA de participante_id -- essa leitura nao
    pertence a ninguem (nivel_relacao e sempre NONE, sem Selo natal pra
    comparar), entao nao reusa MomentoDiario/ResultadoRelevancia/
    LeituraDiaria (todas as 3 tem UNIQUE(participante_id, ...) e FK
    obrigatoria pra participantes.id). Kin/Selo/Tom/tipo_dia sao
    calculados e gravados AQUI mesmo, sem tabela auxiliar, porque o unico
    consumidor e esta leitura -- nao ha necessidade de uma segunda tabela
    so pra guardar o momento do dia sem dono.

    Cache/idempotencia: 1 linha por dia civil (UNIQUE em
    data_referencia), corte fixo as 03:00 em America/Sao_Paulo (ver
    TIMEZONE_PONTE_PRESENCA em app/ponte_presenca/pipeline.py -- explicito,
    NAO herdado de participante.timezone_atual, porque essa leitura nao
    tem participante). Mesma protecao de corrida por
    pg_advisory_xact_lock de LeituraDiaria (A5), so que a chave do lock e
    por dia, nao por (participante, dia).

    status_qa/versao_prompt: mesmo vocabulario/mesma versao de prompt em
    producao de LeituraDiaria (PROMPT_VERSION, app/alpha/interpretation.py)
    -- reaproveita o mesmo QA/guardrail/fallback, so publica em tabela
    propria. NUNCA expostos na resposta publica da API (so em log/DB) --
    ver _construir_derivation_summary_publico() em app/ponte_presenca/routes.py --
    allowlist explicita, campo a campo (corrigido apos um vazamento real
    de 30/08/2026, ver CLAUDE.md)."""
    __tablename__ = "leituras_diarias_genericas"
    __table_args__ = (
        UniqueConstraint("data_referencia", name="uq_leitura_diaria_generica_data"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    data_referencia: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    timezone_usado: Mapped[str] = mapped_column(String(64), nullable=False)
    kin: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # None em HUNAB_KU_0_0
    selo: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    selo_cor: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    tom: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    tipo_dia: Mapped[str] = mapped_column(String(32), nullable=False)
    reflexao: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # None quando Hunab Ku
    pergunta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resumo_derivacao: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status_qa: Mapped[str] = mapped_column(String(32), nullable=False)
    versao_prompt: Mapped[str] = mapped_column(String(64), nullable=False)
    versao_engine_dreamspell: Mapped[str] = mapped_column(String(64), nullable=False)
    publicado_em: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ReflexaoDiaria(Base):
    """`DailyReflection` da A7 (CLAUDE.md secao 5) -- fechamento do dia:
    registro livre + marcador rapido + as 8 perguntas de laboratorio
    (docs/handoff_package/03_DAILY_EXPERIENCE.md secao 5). NAO confundir
    com o campo `reflexao` de LeituraDiaria (A5) -- aquele e o texto
    gerado pelo Interpretation Engine de manha; este e o que o
    participante escreve a noite sobre o proprio dia. Duas tabelas
    diferentes, escritas desacopladas de proposito (ver regra abaixo).

    Nomes traduzidos do briefing (mesmo padrao das etapas anteriores):
      DailyReflection -> ReflexaoDiaria (tabela reflexoes_diarias)
      free_text -> texto_livre | quick_marker -> marcador_rapido
      lab_answers -> respostas_laboratorio

    Regra de imutabilidade -- DIFERENTE de LeituraDiaria de proposito
    (briefing da A7): editavel livremente enquanto data_referencia ainda
    e o dia corrente (mesmo corte das 03:00 de snapshot_date_hoje);
    congela quando o dia vira. Nao e "escreve uma vez, nunca mais muda"
    (isso e o padrao de LeituraDiaria) -- e "muda livremente por um
    tempo, depois para de mudar". A checagem fica na camada de escrita
    (app/alpha/reflexao.py), nao e uma constraint de banco -- um freeze
    por tempo nao e algo que uma UniqueConstraint consiga expressar.

    marcador_rapido: coluna String livre (mesmo padrao de tipo_dia/
    nivel_relacao/status_qa), valores fixos por convencao:
      ECO | PERCEPCAO_DIFERENTE | NADA_ESPECIAL
    (correspondem a "Algo encontrou eco." / "Percebi algo de uma maneira
    diferente." / "Nada em especial." -- ver 03_DAILY_EXPERIENCE.md).

    respostas_laboratorio (JSONB) -- as 8 perguntas de
    03_DAILY_EXPERIENCE.md secao 5, chaves: permanencia_espontanea,
    qualidade_percepcao, vies_confirmacao, pergunta_abriu_reflexao,
    practice_done, practice_experience, linguagem_estranha,
    linguagem_estranha_detalhe, valor_do_dia, campo_livre_lab.
    practice_experience so e valido se practice_done == "sim" -- REJEITADO
    (nao ignorado silenciosamente) na escrita se vier junto de
    practice_done != "sim" -- ver app/alpha/reflexao.py."""
    __tablename__ = "reflexoes_diarias"
    __table_args__ = (
        UniqueConstraint(
            "participante_id", "data_referencia",
            name="uq_reflexao_diaria_participante_data",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participante_id: Mapped[int] = mapped_column(ForeignKey("participantes.id"), nullable=False)
    data_referencia: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    texto_livre: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    marcador_rapido: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    respostas_laboratorio: Mapped[dict] = mapped_column(JSONB, nullable=False)
    criado_em: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class BaseConhecimento(Base):
    __tablename__ = "base_conhecimento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sistema: Mapped[str] = mapped_column(String(32), nullable=False)
    tipo_elemento: Mapped[str] = mapped_column(String(32), nullable=False)  # ex.: gate, kin, numero
    chave_elemento: Mapped[str] = mapped_column(String(32), nullable=False)
    texto_curado: Mapped[str] = mapped_column(Text, nullable=False)
    fonte_de_estudo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class RegistroDivergencia(Base):
    __tablename__ = "registro_divergencia"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sistema: Mapped[str] = mapped_column(String(32), nullable=False)
    campo: Mapped[str] = mapped_column(String(64), nullable=False)
    entrada: Mapped[str] = mapped_column(Text, nullable=False)
    resultado_a: Mapped[str] = mapped_column(Text, nullable=False)
    metodologia_a: Mapped[str] = mapped_column(Text, nullable=False)
    resultado_b: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metodologia_b: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    causa_possivel: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decisao_adotada: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
