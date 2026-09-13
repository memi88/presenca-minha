"""
relevance.py

A4 (CLAUDE.md secao 5) -- Relevance Engine. Deterministico/rule-based,
sem IA (FOUNDATION.md principio 6). Decide, a partir dos fatos do
Relationship Detector (app/alpha/relationship_detector.py), quais
relacoes estruturais de hoje AUTORIZAM personalizacao no Presente.

Escopo original (A4, ate o Gate 1): SOMENTE NONE + SAME_SEAL. Ampliado no
Gate 1.5 (20/08/2026, ver nota abaixo) pro ruleset atual: SAME_SEAL + as
4 posicoes do Oraculo. nivel_relacao e uma coluna String livre (nao
Postgres ENUM), pra aceitar novos niveis sem migration -- ja usado 2x.

Hunab Ku 0.0: MomentoDiario.selo vem None nesse dia (ver
app/alpha/daily_moment.py, ENGINE_VALIDATION.md secao 8). Isso e
literalmente o mesmo formato de bug corrigido em kin_today_or_for()/
_card_dreamspell() -- comparar/indexar um valor sem checar None primeiro.
calcular_nivel_relacao() trata None explicitamente ANTES de qualquer
comparacao de igualdade, entao nunca ha excecao aqui.

Gate 1 (20/08/2026): este modulo continua sendo SO o Relevance Engine
("essa relacao e forte o suficiente pra entrar no Presente de hoje?").
A deteccao do conjunto AMPLIADO de relacoes estruturais (Familia
Terrestre, Guia/Analogo/Antipoda/Oculto de Oraculo) foi movida pro
Relationship Detector (app/alpha/relationship_detector.py), que so
responde "que relacoes existem?" -- nao decide nada.

Gate 1.5 (20/08/2026, mesmo dia -- ruleset aprovado pelo time): ate aqui
o Gate 1 tinha deixado o Detector rodando SO em modo auditoria (nao
influenciava nivel_relacao). O time revisou os fatos estruturais e
aprovou um ruleset: SAME_SEAL + as 4 posicoes do Oraculo (Guia/Analogo/
Antipoda/Oculto) AUTORIZAM personalizacao; Familia Terrestre/mesmo Tom/
mesma Onda continuam SO contexto (calculadas, persistidas, visiveis no
debug -- nunca autorizam, nem combinadas entre si). calcular_nivel_relacao()
(a funcao pura Selo-a-Selo) continua existindo e testada isoladamente,
mas NAO e mais quem decide a coluna nivel_relacao -- ver
calcular_relacoes_autorizadas() abaixo, a fonte de verdade agora."""
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.alpha.relationship_detector import detectar_relacoes_estruturais
from app.db.models import MomentoDiario, Participante, PerfilNatalDreamspell, ResultadoRelevancia

NIVEL_NONE = "NONE"
NIVEL_SAME_SEAL = "SAME_SEAL"
# Gate 1.5 (20/08/2026) -- ruleset aprovado pelo time: as 4 posicoes do
# Fifth Force Oracle (Gate 1) TAMBEM autorizam personalizacao, cada uma
# com seu proprio token (nunca colapsadas num ORACLE_MATCH generico).
# same_earth_family/same_tone/same_wavespell ficam de fora de proposito
# (ver AUTORIZAM_PERSONALIZACAO e calcular_relacoes_autorizadas abaixo).
NIVEL_GUIDE_MATCH = "GUIDE_MATCH"
NIVEL_ANALOG_MATCH = "ANALOG_MATCH"
NIVEL_ANTIPODE_MATCH = "ANTIPODE_MATCH"
NIVEL_OCCULT_MATCH = "OCCULT_MATCH"

# Ordem SO pra escolher o "nivel_relacao" de 1 valor (coluna legada,
# String(20), pre-existente) quando mais de uma relacao autorizada dispara
# no mesmo dia -- caso raro mas real (ex.: Tom em {1,6,11} faz Selo Guia
# coincidir com o proprio Selo natal, entao SAME_SEAL e GUIDE_MATCH ficam
# verdadeiros juntos). NAO e ranking de importancia simbolica -- e so pra
# a coluna ter 1 valor. TODAS as relacoes autorizadas do dia, sem exceção,
# ficam em detalhe["relacoes_autorizadas"] (lista) -- e o que o
# Interpretation Engine e o payload de verdade devem usar, nunca so
# nivel_relacao sozinho, pra nao apagar qual posicao ocorreu (pedido
# explicito do time no Gate 1.5).
_ORDEM_NIVEL_RELACAO = [NIVEL_SAME_SEAL, NIVEL_GUIDE_MATCH, NIVEL_ANALOG_MATCH, NIVEL_ANTIPODE_MATCH, NIVEL_OCCULT_MATCH]

# Campo correspondente em RelacoesEstruturais.to_dict() (app/alpha/
# relationship_detector.py) pra cada nivel autorizante -- unica fonte,
# nao duplicar os nomes de campo em outro lugar.
_CAMPO_DETECTOR_POR_NIVEL = {
    NIVEL_SAME_SEAL: "same_seal",
    NIVEL_GUIDE_MATCH: "natal_guide_match",
    NIVEL_ANALOG_MATCH: "natal_analog_match",
    NIVEL_ANTIPODE_MATCH: "natal_antipode_match",
    NIVEL_OCCULT_MATCH: "natal_occult_match",
}

# Relacoes que EXISTEM (calculadas e persistidas pelo Gate 1) mas NAO
# autorizam personalizacao nesta fase, por decisao explicita do time
# (Gate 1.5): continuam em detalhe["relationships_checked"] pro modo
# Alpha/debug, e same_earth_family pode virar contexto de fundo/Entender
# no futuro -- mas nenhuma delas cria um bloco de personalizacao sozinha,
# e NAO HA logica de combinacao aqui pra soma-las numa relacao forte
# (ex.: same_earth_family + same_tone continua sem autorizar nada).
RELACOES_SO_CONTEXTO_NAO_AUTORIZAM = ("same_earth_family", "same_tone", "same_wavespell")


def calcular_relacoes_autorizadas(relacoes_checked: Optional[dict]) -> list[str]:
    """Pura, sem efeitos colaterais. Devolve a lista (pode ser vazia) de
    todos os niveis autorizantes verdadeiros hoje, na ordem de
    _ORDEM_NIVEL_RELACAO -- NUNCA colapsada num unico "ORACLE_MATCH"."""
    if not relacoes_checked:
        return []
    return [nivel for nivel in _ORDEM_NIVEL_RELACAO if relacoes_checked.get(_CAMPO_DETECTOR_POR_NIVEL[nivel])]


# RULESET_VERSION -- string bumped manualmente quando a REGRA de relevancia
# muda (mesmo raciocinio de ENGINE_VERSION em dreamspell_engine.py: um
# hash automatico mudaria a cada edicao cosmetica). Uma mudanca de versao
# nao reescreve ResultadoRelevancia ja gravados -- ver UniqueConstraint em
# (momento_diario_id, versao_ruleset) no modelo.
RULESET_VERSION_1_0 = "relevance-1.0.0-none-same_seal"  # legado, ver Gate 1.5
RULESET_VERSION = "relevance-1.1.0-same_seal-and-oracle"  # default desde o Gate 1.5


def calcular_nivel_relacao(selo_natal: Optional[str], selo_hoje: Optional[str]) -> str:
    """Pura, sem efeitos colaterais. None em qualquer lado (o caso real:
    selo_hoje=None em Hunab Ku 0.0) resolve para NONE de forma limpa --
    checagem explicita ANTES da comparacao de igualdade, nao um
    "if a == b" que dependeria de None == None ser verdadeiro por
    coincidencia (o que ate seria, em Python, mas nao expressa a intencao:
    "nao da pra comparar" e diferente de "comparei e nao bateu")."""
    if selo_natal is None or selo_hoje is None:
        return NIVEL_NONE
    if selo_natal == selo_hoje:
        return NIVEL_SAME_SEAL
    return NIVEL_NONE


def _buscar(session: Session, momento_diario_id: int, versao_ruleset: str) -> Optional[ResultadoRelevancia]:
    return (
        session.query(ResultadoRelevancia)
        .filter_by(momento_diario_id=momento_diario_id, versao_ruleset=versao_ruleset)
        .first()
    )


def obter_ou_criar_resultado_relevancia(
    session: Session,
    participante: Participante,
    momento: MomentoDiario,
    versao_ruleset: str = RULESET_VERSION,
) -> ResultadoRelevancia:
    """Get-or-create idempotente por (momento_diario_id, versao_ruleset),
    com a mesma protecao real contra corrida de app/alpha/daily_moment.py
    (catch de IntegrityError + re-select, nao SELECT-then-INSERT torcendo).
    `versao_ruleset` e injetavel para testar o cenario de versionamento
    sem precisar editar RULESET_VERSION de verdade."""
    existente = _buscar(session, momento.id, versao_ruleset)
    if existente is not None:
        return existente

    perfil = (
        session.query(PerfilNatalDreamspell)
        .filter_by(participante_id=participante.id)
        .first()
    )
    selo_natal = perfil.selo if perfil is not None else None
    selo_hoje = momento.selo

    relacoes_checked = (
        detectar_relacoes_estruturais(perfil.kin, momento.kin).to_dict()
        if perfil is not None
        else None
    )
    # Gate 1.5: nivel_relacao (coluna de 1 valor) e so um resumo pra
    # compat/exibicao -- a fonte de verdade pra "o que autoriza
    # personalizacao hoje" e SEMPRE detalhe["relacoes_autorizadas"] (lista
    # completa, sem colapsar). calcular_nivel_relacao() continua existindo
    # como utilitario puro (testado em isolado), mas nao e mais quem
    # decide nivel_relacao aqui -- fica redundante com
    # relacoes_checked["same_seal"] por construcao (mesma comparacao de
    # Selo), entao usar uma unica fonte evita 2 caminhos calculando o
    # mesmo fato de jeitos diferentes.
    autorizadas = calcular_relacoes_autorizadas(relacoes_checked)
    nivel = autorizadas[0] if autorizadas else NIVEL_NONE
    linha = ResultadoRelevancia(
        momento_diario_id=momento.id,
        participante_id=participante.id,
        nivel_relacao=nivel,
        detalhe={
            "selo_natal": selo_natal,
            "selo_hoje": selo_hoje,
            "match": nivel == NIVEL_SAME_SEAL,
            "relationships_checked": relacoes_checked,
            "relacoes_autorizadas": autorizadas,
        },
        versao_ruleset=versao_ruleset,
    )
    session.add(linha)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        existente = _buscar(session, momento.id, versao_ruleset)
        if existente is None:
            raise
        return existente

    session.refresh(linha)
    return linha
