"""
human_design_engine.py

Motor de Design Humano.

STATUS DAS ATIVACOES BRUTAS (Gate.Line): ENGINE_MATCH -- 26/26 valores do
Golden Profile reproduzidos exatamente (13 Personalidade + 13 Design).

STATUS DE TIPO / AUTORIDADE / DEFINICAO / CENTROS / CANAIS / CRUZ (NOME):
NAO IMPLEMENTADO nesta fase -- ver ENGINE_VALIDATION.md, secao "Proxima
camada", para o que falta e por que foi deliberadamente deixado de fora.

DECISAO DE LICENCIAMENTO (Swiss Ephemeris): registrada e ACEITA para o
escopo do laboratorio privado de 4 pessoas -- NAO bloqueia mais esta fase
(decisao tomada pela equipe; ver ENGINE_VALIDATION.md). A observacao sobre
AGPL-3.0 vs. licenca comercial da Astrodienst continua documentada em
TECH_RESEARCH.md para o caso de o projeto crescer além do laboratório.

PRECISAO DAS EFEMERIDES:
Esta validacao usou o modo Moshier (swe.FLG_MOSEPH) porque os arquivos de
efemerides JPL/Swiss (.se1) nao estao disponiveis neste ambiente (nao ha
acesso de rede a astro.com). Moshier e uma efemeride analitica embutida na
propria biblioteca, com precisao de ~1 arco-segundo -- suficiente para
determinar gate/linha corretamente (cada linha tem 0.9375 grau = 3375
arco-segundos de largura), mas MENOS precisa que os arquivos .se1
completos. Para producao, considerar obter os arquivos de efemerides
oficiais (fora do escopo desta fase de validacao).
"""
import swisseph as swe

FLAG = swe.FLG_MOSEPH | swe.FLG_SPEED

# ---------------------------------------------------------------------------
# Roda de portoes do Design Humano (mandala de 64 portoes).
# CONFIRMADO empiricamente: esta sequencia, combinada com o offset abaixo,
# reproduz 26/26 ativacoes do Golden Profile.
# ---------------------------------------------------------------------------
GATE_WHEEL = [
    25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53,
    62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44,
    1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60, 41, 19, 13, 49, 30, 55,
    37, 63, 22, 36,
]
assert len(GATE_WHEEL) == 64

GATE_SIZE = 360.0 / 64.0     # 5.625 graus
LINE_SIZE = GATE_SIZE / 6.0  # 0.9375 grau

# CONFIRMADO empiricamente contra 26 pontos (13 Personalidade + 13 Design):
# offset necessario entre a longitude tropical bruta e o ponto zero da roda
# de portoes do Design Humano. Faixa exata que reproduz todos os 26 pontos:
# [1.676, 1.793] graus. Valor adotado = ponto medio.
#
# ATENCAO: este valor foi ajustado a partir de UM UNICO perfil natal.
# E uma confirmacao forte (26 pontos independentes, incluindo um momento
# ~92 dias depois do nascimento), mas ainda deveria ser cruzado com uma
# segunda fonte publicada antes de ser tratado como constante definitiva.
HD_WHEEL_OFFSET_DEG = 1.7345


def longitude_to_gate_line(lon_deg: float, offset: float = HD_WHEEL_OFFSET_DEG):
    lon = (lon_deg + offset) % 360.0
    idx = int(lon // GATE_SIZE)
    gate = GATE_WHEEL[idx]
    remainder = lon - idx * GATE_SIZE
    line = int(remainder // LINE_SIZE) + 1
    return gate, line


BODY_IDS = {
    'Sol': swe.SUN,
    'Lua': swe.MOON,
    'Mercurio': swe.MERCURY,
    'Venus': swe.VENUS,
    'Marte': swe.MARS,
    'Jupiter': swe.JUPITER,
    'Saturno': swe.SATURN,
    'Urano': swe.URANUS,
    'Netuno': swe.NEPTUNE,
    'Plutao': swe.PLUTO,
}


def get_longitude(jd_ut: float, body_id: int) -> float:
    res, _ = swe.calc_ut(jd_ut, body_id, FLAG)
    return res[0]


def get_all_positions(jd_ut: float) -> dict:
    positions = {}
    sun_lon = get_longitude(jd_ut, swe.SUN)
    positions['Sol'] = sun_lon
    positions['Terra'] = (sun_lon + 180.0) % 360.0
    for name, bid in BODY_IDS.items():
        if name == 'Sol':
            continue
        positions[name] = get_longitude(jd_ut, bid)
    node, _ = swe.calc_ut(jd_ut, swe.TRUE_NODE, FLAG)
    positions['NodoNorte'] = node[0]
    positions['NodoSul'] = (node[0] + 180.0) % 360.0
    return positions


def _angular_diff(a: float, b: float) -> float:
    return (a - b + 180) % 360 - 180


def find_design_jd(jd_birth_ut: float, arc_degrees: float = 88.0) -> float:
    """Encontra o instante (JD, UT) em que o Sol estava `arc_degrees` graus
    de arco solar antes da posicao natal, por busca binaria angular.
    CONFIRMADO: reproduz 13/13 ativacoes de Design do Golden Profile."""
    natal_sun = get_longitude(jd_birth_ut, swe.SUN)
    target = (natal_sun - arc_degrees) % 360.0

    def f(jd):
        return _angular_diff(get_longitude(jd, swe.SUN), target)

    lo = jd_birth_ut - (arc_degrees / 0.9856) * 1.15
    hi = jd_birth_ut - (arc_degrees / 0.9856) * 0.85
    flo = f(lo)
    for _ in range(80):
        mid = (lo + hi) / 2
        fm = f(mid)
        if (flo < 0) == (fm < 0):
            lo, flo = mid, fm
        else:
            hi = mid
    return (lo + hi) / 2


def compute_chart(jd_birth_ut: float):
    """Retorna (ativacoes_personalidade, ativacoes_design) como dicts
    corpo -> (gate, line)."""
    personality_positions = get_all_positions(jd_birth_ut)
    jd_design = find_design_jd(jd_birth_ut)
    design_positions = get_all_positions(jd_design)

    personality = {b: longitude_to_gate_line(lon) for b, lon in personality_positions.items()}
    design = {b: longitude_to_gate_line(lon) for b, lon in design_positions.items()}
    return personality, design


def profile_from_chart(personality: dict, design: dict) -> str:
    """CONFIRMADO: Perfil = linha do Sol na Personalidade / linha do Sol no Design."""
    _, p_line = personality['Sol']
    _, d_line = design['Sol']
    return f"{p_line}/{d_line}"


def cross_gates_from_chart(personality: dict, design: dict) -> str:
    """CONFIRMADO: as 'Portas da Cruz' correspondem aos gates de
    Sol/Terra na Personalidade e no Design, nessa ordem. O NOME da cruz
    (ex.: 'Cruz da Fenix Adormecida') e uma tabela de consulta extensa que
    NAO foi implementada nesta fase -- ver ENGINE_VALIDATION.md."""
    p_sun_gate, _ = personality['Sol']
    p_earth_gate, _ = personality['Terra']
    d_sun_gate, _ = design['Sol']
    d_earth_gate, _ = design['Terra']
    return f"{p_sun_gate}/{p_earth_gate} | {d_sun_gate}/{d_earth_gate}"


# ---------------------------------------------------------------------------
# Grafo de 36 canais / 9 centros e derivacao de Tipo/Autoridade/Definicao:
# ver hd_bodygraph.py (implementado e validado nesta fase — 3/3 contra o
# Golden Profile: Tipo, Autoridade, Definicao).
#
# Transito x natal: ver hd_transit.py (implementado; VALIDACAO EXTERNA
# ainda pendente — ver ENGINE_VALIDATION.md).
#
# AINDA NAO IMPLEMENTADO (ver ENGINE_VALIDATION.md):
#   - Classificacao Angulo Direito / Angulo Esquerdo / Justaposta
#   - Tabela de nomes das Cruzes de Encarnacao (~192 combinacoes, conteudo
#     interpretativo com restricao de IP -- Jovian Archive)
#   - Variaveis (PLL DRL)
# ---------------------------------------------------------------------------
