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
    ENGINE_VALIDATION.md)."""
    if target < EPOCH:
        raise NotImplementedError("Datas anteriores a epoca nao tratadas nesta versao.")
    d = EPOCH
    kin = EPOCH_KIN
    one = datetime.timedelta(days=1)
    while d < target:
        d = d + one
        skip = (_is_day_out_of_time(d) and skip_dft) or (_is_leap_extra_day(d) and skip_leap)
        if not skip:
            kin = kin % 260 + 1
    return kin


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


def kin_today_or_for(target: datetime.date) -> int:
    """Funcao de conveniencia usando a convencao oficial ja decidida."""
    return kin_for_date(target, **OFFICIAL_CONVENTION)
