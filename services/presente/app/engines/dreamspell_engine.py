"""
dreamspell_engine.py

Motor de Dreamspell / Sincronario das 13 Luas (Jose Arguelles).

STATUS GERAL: METHODOLOGY_LOCKED / GOLDEN_VALUE_AMBIGUO.
Ver ENGINE_VALIDATION.md, secao Dreamspell, para a divergencia em aberto.

CONFIRMADO (por 2 fontes independentes de pesquisa + reproducao exata das
propriedades derivadas do Golden Profile):
  - Epoca: 26 de julho de 1987 = Kin 34, Mago Galactico Branco
    (Harmonic Convergence).
  - Selo = ((Kin - 1) mod 20) + 1, indexado na sequencia padrao de 20 selos.
  - Tom = ((Kin - 1) mod 13) + 1.
  - Cor do selo = ciclo de 4 (Vermelho, Branco, Azul, Amarelo) pela posicao
    do selo na sequencia de 20.
  - Onda Encantada = o "wavespell" de 13 Kins ao qual o Kin pertence; o
    selo que abre essa onda e o selo do Kin em que o tom = 1 dentro do
    mesmo bloco de 13.

CONVENCAO DE DIAS "VERDES" -- DECIDIDA E CONFIRMADA (ver ENGINE_VALIDATION.md):
  - 29 de fevereiro NAO avanca a contagem de Kin (e um dia "verde"/Hunab Ku,
    sem Kin proprio).
  - 25 de julho (Dia Fora do Tempo) AVANCA a contagem de Kin normalmente
    (ao contrario do que uma primeira leitura popular do conceito sugeria).
  - Confirmado contra o Sincronario da Paz: 25/08/1988 = Kin 169.
  Esta convencao foi validada pela equipe diretamente contra a fonte fisica
  -- nao foi inferida por pesquisa externa (ver ENGINE_VALIDATION.md para o
  raciocinio anterior que motivou a checagem).
"""
import datetime
from dataclasses import dataclass
from typing import Optional

EPOCH = datetime.date(1987, 7, 26)  # CONFIRMADO: Kin 34
EPOCH_KIN = 34

SEALS = [
    "Dragao", "Vento", "Noite", "Semente", "Serpente", "Enlacador de Mundos", "Mao",
    "Estrela", "Lua", "Cao", "Macaco", "Humano", "Caminhante do Ceu", "Mago",
    "Aguia", "Guerreiro", "Terra", "Espelho", "Tempestade", "Sol",
]
SEAL_COLORS = ["Vermelho", "Branco", "Azul", "Amarelo"] * 5

TONES = [
    "Magnetico", "Lunar", "Eletrico", "Auto-Existente", "Overtonal", "Ritmico",
    "Ressonante", "Galactico", "Solar", "Planetario", "Espectral", "Cristal", "Cosmico",
]


def _is_day_out_of_time(d: datetime.date) -> bool:
    return d.month == 7 and d.day == 25


def _is_leap_extra_day(d: datetime.date) -> bool:
    return d.month == 2 and d.day == 29


def kin_for_date(target: datetime.date, skip_dft: bool, skip_leap: bool) -> int:
    """Calcula o Kin para uma data, com a convencao de dias 'verdes'
    (Dia Fora do Tempo / 29-fev) explicitamente parametrizada.

    NENHUM valor default e assumido como 'correto' -- o chamador deve
    escolher explicitamente ate a divergencia ser resolvida (ver
    ENGINE_VALIDATION.md).

    Datas anteriores a EPOCH (26/07/1987) -- ex.: nascimento de qualquer
    participante nascido antes dessa data -- caminham PRA TRAS a partir da
    epoca, revertendo o mesmo passo usado no caminho pra frente (bug real
    encontrado em producao em 19/08/2026: cadastro de alguem nascido antes
    de 1987 caia com NotImplementedError sem tratamento, 500 puro -- ver
    tests/test_kin_pre_epoca.py). kin % 260 + 1 (passo pra frente) tem
    como inversa (kin - 2) % 260 + 1 -- confirmar: kin=34 -> frente=35;
    inversa(35) = (35-2)%260+1 = 34. `skip` continua sendo avaliado no dia
    de CHEGADA (o mesmo dia em ambas direcoes: o dia que se está deixando
    de um lado corresponde ao dia que se chegaria do outro), preservando a
    mesma semantica de Hunab Ku/Dia Fora do Tempo em qualquer direcao."""
    one = datetime.timedelta(days=1)
    if target < EPOCH:
        d = EPOCH
        kin = EPOCH_KIN
        while d > target:
            skip = (_is_day_out_of_time(d) and skip_dft) or (_is_leap_extra_day(d) and skip_leap)
            if not skip:
                kin = (kin - 2) % 260 + 1
            d = d - one
        return kin
    d = EPOCH
    kin = EPOCH_KIN
    while d < target:
        d = d + one
        skip = (_is_day_out_of_time(d) and skip_dft) or (_is_leap_extra_day(d) and skip_leap)
        if not skip:
            kin = kin % 260 + 1
    return kin


def numero_do_tom(nome_tom: str) -> int:
    """Indice 1-13 de um nome de Tom (ex.: 'Cosmico' -> 13) -- usado pela
    A5 pra montar a chave de lookup em base_conhecimento (tipo_elemento
    'tom', chave numerica em string), ja que MomentoDiario so grava o
    nome do Tom, nao o numero (ver app/db/models.py)."""
    return TONES.index(nome_tom) + 1


@dataclass
class DreamspellResult:
    kin: int
    seal: str
    seal_color: str
    tone: str
    tone_number: int
    wavespell_seal: str
    wavespell_color: str


def full_reading(kin: int) -> DreamspellResult:
    seal_idx = (kin - 1) % 20
    tone_idx = (kin - 1) % 13
    # Onda Encantada: bloco de 13 kins ao qual este kin pertence
    wavespell_start_kin = ((kin - 1) // 13) * 13 + 1
    wavespell_seal_idx = (wavespell_start_kin - 1) % 20
    return DreamspellResult(
        kin=kin,
        seal=SEALS[seal_idx],
        seal_color=SEAL_COLORS[seal_idx],
        tone=TONES[tone_idx],
        tone_number=tone_idx + 1,
        wavespell_seal=SEALS[wavespell_seal_idx],
        wavespell_color=SEAL_COLORS[wavespell_seal_idx],
    )


# ---------------------------------------------------------------------------
# GATE 1 -- Dreamspell Structural Relationships (aberto 20/08/2026).
# STATUS: VALIDATED. Fonte metodologica: Foundation for the Law of Time
# (lawoftime.org), "The Fifth Force Oracle" (Guide/Analog/Antipode/Occult)
# e a estrutura de 5 Familias Terrestres (Polar/Cardinal/Core/Signal/
# Gateway). Formulas cross-validadas em 20/08/2026 contra 8 assinaturas
# galacticas publicadas (lawoftime.org + tortuga1320.com, que republica o
# Synchronotron do Law of Time), cobrindo os 5 grupos de offset do Guia e
# formulas de Analogo/Antipoda/Oculto, incluindo os dois casos reais do
# Gate 1 (Kin 1, Kin 40, Kin 245, "5 Moon", "5 Wizard", "3 Dog"/"13 Eagle",
# "2 Dog", "9 Seed"/"5 Seed") -- todas batendo exatamente, zero divergencia
# apos resolver uma transposicao de rotulo (Analog/Antipode trocados) num
# unico snippet de busca, identificada e confirmada como erro do snippet
# (nao da formula) por reconstrucao reversa a partir de Guide+Occult.
# Esta e a UNICA fonte deterministica dessas relacoes no projeto -- nao
# duplicar as tabelas abaixo em prompts do Interpretation Engine nem em
# outro modulo (CLAUDE.md secao 5, pedido explicito do Gate 1).
#
# Familia Terrestre: os 20 Selos se agrupam em 5 familias de 4, por indice
# de Selo (1-20) mod 5. Confirmado que o grupo "Gateway" (Semente, Lua,
# Mago, Tormenta = indices 4,9,14,19, todos ==4 mod 5) bate exatamente com
# a hipotese trazida pelo time e com fontes publicadas independentes.
_EARTH_FAMILY_BY_REMAINDER = {
    1: "Cardinal",  # Dragao, Enlacador de Mundos, Macaco, Guerreiro
    2: "Core",      # Vento, Mao, Humano, Terra
    3: "Signal",    # Noite, Estrela, Caminhante do Ceu, Espelho
    4: "Gateway",   # Semente, Lua, Mago, Tempestade (a.k.a. Portal)
    0: "Polar",     # Serpente, Cao, Aguia, Sol
}


def earth_family_of(selo: str) -> str:
    """Familia Terrestre (Polar/Cardinal/Core/Signal/Gateway) do Selo."""
    indice = SEALS.index(selo) + 1  # 1-20
    return _EARTH_FAMILY_BY_REMAINDER[indice % 5]


def _analog_seal_index(indice: int) -> int:
    """Selo Analogo: indice + analogo = 19 (mod 20). Formula confirmada
    contra 8 assinaturas publicadas (ver comentario do Gate 1 acima)."""
    return ((18 - indice) % 20) + 1


def _antipode_seal_index(indice: int) -> int:
    """Selo Antipoda: sempre +10 (mod 20) a partir do indice -- o Tom nao
    muda (so o Selo desloca meio ciclo de 20)."""
    return ((indice - 1 + 10) % 20) + 1


def _occult_seal_index(indice: int) -> int:
    """Selo Oculto: indice + oculto = 21 (mod 20)."""
    return ((20 - indice) % 20) + 1


# Deslocamento (em indices de Selo, mod 20) do Selo Guia a partir do Tom
# do Kin natal -- tabela literal do Fifth Force Oracle (lawoftime.org),
# convertida das duas formas equivalentes documentadas ("X a frente ou Y
# atras", onde X+Y=20 -- e a mesma rotacao, nao uma ambiguidade) para um
# unico deslocamento com sinal. Cobre os 13 Tons sem sobreposicao.
_GUIDE_OFFSET_BY_TONE = {
    1: 0, 6: 0, 11: 0,      # guiado pelo proprio Selo
    2: 12, 7: 12, 12: 12,   # 12 a frente (ou 8 atras)
    3: 4, 8: 4, 13: 4,      # 4 a frente (ou 16 atras)
    4: 16, 9: 16,           # 4 atras (ou 16 a frente)
    5: 8, 10: 8,            # 8 a frente (ou 12 atras)
}


def _guide_seal_index(indice: int, tom_numero: int) -> int:
    offset = _GUIDE_OFFSET_BY_TONE[tom_numero]
    return ((indice - 1 + offset) % 20) + 1


def analog_seal(selo: str) -> str:
    return SEALS[_analog_seal_index(SEALS.index(selo) + 1) - 1]


def antipode_seal(selo: str) -> str:
    return SEALS[_antipode_seal_index(SEALS.index(selo) + 1) - 1]


def occult_seal(selo: str) -> str:
    return SEALS[_occult_seal_index(SEALS.index(selo) + 1) - 1]


def guide_seal(selo: str, tom_numero: int) -> str:
    return SEALS[_guide_seal_index(SEALS.index(selo) + 1, tom_numero) - 1]


# Convencao OFICIAL, adotada em producao (ver ENGINE_VALIDATION.md):
#   25/jul (Dia Fora do Tempo) avanca o Kin; 29/fev NAO avanca o Kin.
OFFICIAL_CONVENTION = dict(skip_dft=False, skip_leap=True)

# Convencoes alternativas mantidas apenas para referencia historica /
# documentacao de como a ambiguidade foi resolvida -- NAO usar em producao.
REJECTED_CONVENTIONS = {
    "skip_ambos": dict(skip_dft=True, skip_leap=True),
    "skip_so_dft": dict(skip_dft=True, skip_leap=False),
    "skip_nenhum": dict(skip_dft=False, skip_leap=False),
}


def kin_today_or_for(target: datetime.date) -> Optional[int]:
    """Funcao de conveniencia usando a convencao oficial ja decidida.

    Retorna None em Hunab Ku 0.0 (29/02) -- esse dia nao tem Kin proprio
    (DREAMSPELL_CALENDAR_CONVENTION.md). ATE 19/08/2026 esta funcao nao
    fazia essa checagem e devolvia o Kin "pausado" (== o do dia anterior)
    em vez de None -- unico ponto onde havia divergencia real com
    momento_dreamspell(), corrigido delegando para a mesma checagem
    is_hunab_ku() que momento_dreamspell ja usa (ver ENGINE_VALIDATION.md
    secao 8/9). As duas funcoes agora compartilham o mesmo nucleo e nao
    podem mais divergir nesse ponto -- ver test_gate0_dreamspell.py.

    CUIDADO -- consequencia de producao: DreamspellAdapter.compute_pessoa/
    compute_horizonte ("hoje"/"semana") chamam esta funcao e depois passam
    o resultado direto para full_reading(), que nao aceita None. Antes
    desta correcao, um Hunab Ku em producao silenciosamente mostrava um
    Kin errado; agora vai propagar uma excecao (TypeError) ate esses
    call sites, que NAO foram alterados aqui de proposito. Precisa de
    tratamento explicito la antes do proximo 29/02 (2028)."""
    if is_hunab_ku(target):
        return None
    return kin_for_date(target, **OFFICIAL_CONVENTION)


# ENGINE_VERSION -- string bumped manualmente quando a convencao de
# calculo muda (nao um hash automatico do arquivo: um hash mudaria a
# cada edicao cosmetica, mesmo sem mudanca de semantica -- ver A2/
# ENGINE_VALIDATION.md secao 8). Gravado em MomentoDiario.versao_motor
# para rastrear com qual convencao cada registro congelado foi calculado.
ENGINE_VERSION = "dreamspell-1.0.0-gate0"


# --- Extensao A2: day_type explicito (GAP identificado na auditoria A1,
# ver ENGINE_VALIDATION.md secao 8, item 1) ---------------------------------
#
# kin_for_date() (o nucleo generico e parametrizado) continua igual --
# mantem seu contrato de sempre devolver um int, ate para Hunab Ku, porque
# e usada tambem pelas REJECTED_CONVENTIONS para fins de documentacao/
# historico, onde "pausar" e so um dos 4 comportamentos possiveis a
# comparar. kin_today_or_for() (a convencao oficial) agora retorna None em
# Hunab Ku -- ver correcao de 19/08/2026 acima. As funcoes abaixo formam a
# camada A2 (MomentoDiario/Alpha) que precisa do day_type explicito.

def is_hunab_ku(d: datetime.date) -> bool:
    return _is_leap_extra_day(d)


def is_day_out_of_time(d: datetime.date) -> bool:
    return _is_day_out_of_time(d)


def tipo_dia_for(d: datetime.date) -> str:
    if is_hunab_ku(d):
        return "HUNAB_KU_0_0"
    if is_day_out_of_time(d):
        return "DAY_OUT_OF_TIME"
    return "REGULAR"


@dataclass
class MomentoDreamspell:
    tipo_dia: str
    kin: Optional[int]
    selo: Optional[str]
    selo_cor: Optional[str]
    tom: Optional[str]
    tom_numero: Optional[int]


def momento_dreamspell(target: datetime.date) -> MomentoDreamspell:
    """Kin/Selo/Tom com day_type explicito -- None em Hunab Ku 0.0 (o dia
    nao tem Kin proprio, ver DREAMSPELL_CALENDAR_CONVENTION.md). Usada pela
    A2 (app/alpha/daily_moment.py); nao usada pelo DreamspellAdapter.

    O Kin vem de kin_today_or_for() -- mesma funcao usada em producao pelo
    DreamspellAdapter -- em vez de uma checagem de Hunab Ku duplicada aqui.
    Isso e o que torna as duas funcoes estruturalmente incapazes de
    divergir de novo: so existe um lugar que decide "este dia tem Kin ou
    nao" (is_hunab_ku, dentro de kin_today_or_for)."""
    tipo = tipo_dia_for(target)
    kin = kin_today_or_for(target)
    if kin is None:
        return MomentoDreamspell(
            tipo_dia=tipo, kin=None, selo=None, selo_cor=None, tom=None, tom_numero=None,
        )
    r = full_reading(kin)
    return MomentoDreamspell(
        tipo_dia=tipo, kin=r.kin, selo=r.seal, selo_cor=r.seal_color,
        tom=r.tone, tom_numero=r.tone_number,
    )
