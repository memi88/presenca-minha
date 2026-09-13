"""
Dreamspell / Sincronário das 13 Luas — motor de cálculo de Kin, Selo, Tom, Lua e Dia-da-Lua.

Convenção implementada (Gate 0, validada em 19/08/2026 contra o Sincronário Perpétuo
13 Luas / Foundation for the Law of Time):

- Ano de 13 Luas começa em 26/07 e termina em 24/07 do ano seguinte (364 dias = 13 luas de 28 dias).
- 25/07 = DIA FORA DO TEMPO (DAY_OUT_OF_TIME): fora das 13 Luas (moon=None, moon_day=None),
  mas o Kin continua avançando normalmente nesse dia (ele TEM um Kin regular).
- 29/02 = HUNAB_KU_0_0: fora da sequência regular das 13 Luas (moon=None, moon_day=None) E
  fora da sequência regular do Kin — não recebe Kin próprio. A progressão do Kin fica
  pausada nesse dia; 01/03 recebe o Kin imediatamente seguinte ao Kin de 28/02.

Esses dois "dias verdes" NÃO são tratados genericamente — são dois tipos distintos
(DAY_OUT_OF_TIME avança o Kin; HUNAB_KU_0_0 pausa o Kin).
"""

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Optional

EPOCH = date(1987, 7, 26)
EPOCH_KIN = 34  # Mago Galáctico Branco (Harmonic Convergence) — ENGINE_MATCH em ENGINE_VALIDATION.md

# Sequência completa dos 20 selos (ordem padrão do Tzolkin/Dreamspell):
SEALS = [
    "Dragão Vermelho", "Vento Branco", "Noite Azul", "Semente Amarela",
    "Serpente Vermelha", "Enlaçador de Mundos Branco", "Mão Azul", "Estrela Amarela",
    "Lua Vermelha", "Cachorro Branco", "Macaco Azul", "Humano Amarelo",
    "Caminhante do Céu Vermelho", "Mago Branco", "Águia Azul", "Guerreiro Amarelo",
    "Terra Vermelha", "Espelho Branco", "Tempestade Azul", "Sol Amarelo",
]

TONES = [
    "Magnético", "Lunar", "Elétrico", "Autoexistente", "Harmônico (Overtone)",
    "Rítmico", "Ressonante", "Galáctico", "Solar", "Planetário",
    "Espectral", "Cristal", "Cósmico",
]

MOON_NAMES = [
    "Magnética", "Lunar", "Elétrica", "Autoexistente", "Harmônica",
    "Rítmica", "Ressonante", "Galáctica", "Solar", "Planetária",
    "Espectral", "Cristal", "Cósmica",
]


def is_hunab_ku(d: date) -> bool:
    return d.month == 2 and d.day == 29


def is_day_out_of_time(d: date) -> bool:
    return d.month == 7 and d.day == 25


@dataclass
class DreamspellMoment:
    date: date
    kin: Optional[int]              # None em Hunab Ku 0.0
    seal: Optional[str]
    tone: Optional[str]
    day_type: str                   # "REGULAR" | "DAY_OUT_OF_TIME" | "HUNAB_KU_0_0"
    moon: Optional[int]             # 1-13, None em DOOT/Hunab Ku
    moon_name: Optional[str]
    moon_day: Optional[int]         # 1-28, None em DOOT/Hunab Ku


def _kin_to_seal_tone(kin: int):
    seal = SEALS[(kin - 1) % 20]
    tone = TONES[(kin - 1) % 13]
    return seal, tone


def compute_kin(target: date) -> Optional[int]:
    """
    Conta dias entre EPOCH e target, avançando o contador de Kin em todo dia,
    EXCETO em 29/02 (Hunab Ku 0.0), que não avança o contador e não recebe Kin.
    25/07 (Dia Fora do Tempo) avança o contador normalmente.
    """
    if is_hunab_ku(target):
        return None

    if target == EPOCH:
        return EPOCH_KIN

    step = 1 if target > EPOCH else -1
    kin = EPOCH_KIN
    d = EPOCH
    while d != target:
        d = d + timedelta(days=step)
        if is_hunab_ku(d):
            # Hunab Ku não avança o contador e não tem Kin — pula sem incrementar.
            if d == target:
                return None
            continue
        kin = kin + step
        # wraparound 1..260
        kin = ((kin - 1) % 260) + 1
    return kin


def _dreamspell_year_start(d: date) -> date:
    """Retorna 26/07 do ano de início do ano-de-13-luas ao qual `d` pertence."""
    if (d.month, d.day) >= (7, 26):
        return date(d.year, 7, 26)
    else:
        return date(d.year - 1, 7, 26)


def compute_moon_and_day(target: date):
    if is_day_out_of_time(target) or is_hunab_ku(target):
        return None, None, None

    year_start = _dreamspell_year_start(target)
    offset = 0
    d = year_start
    while d != target:
        d = d + timedelta(days=1)
        if is_hunab_ku(d):
            continue  # não conta como dia da lua
        if is_day_out_of_time(d):
            continue  # DOOT nunca é alcançado aqui pois já tratado acima, mas defensivo
        offset += 1
    moon = offset // 28 + 1
    moon_day = offset % 28 + 1
    return moon, MOON_NAMES[moon - 1], moon_day


def compute_moment(target: date) -> DreamspellMoment:
    if is_hunab_ku(target):
        return DreamspellMoment(
            date=target, kin=None, seal=None, tone=None,
            day_type="HUNAB_KU_0_0", moon=None, moon_name=None, moon_day=None,
        )

    kin = compute_kin(target)
    seal, tone = _kin_to_seal_tone(kin)

    if is_day_out_of_time(target):
        return DreamspellMoment(
            date=target, kin=kin, seal=seal, tone=tone,
            day_type="DAY_OUT_OF_TIME", moon=None, moon_name=None, moon_day=None,
        )

    moon, moon_name, moon_day = compute_moon_and_day(target)
    return DreamspellMoment(
        date=target, kin=kin, seal=seal, tone=tone,
        day_type="REGULAR", moon=moon, moon_name=moon_name, moon_day=moon_day,
    )
