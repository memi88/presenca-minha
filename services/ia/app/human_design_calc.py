# Vendorizado de github.com/geodetheseeker/human-design-py (commit em
# 2026-07, arquivo `chart.py`), licença declarada como MIT pelo autor no
# README do repositório — o repositório não tem um arquivo LICENSE formal,
# só a declaração no README, o que vale registrar como uma nuance de
# proveniência, mas é a intenção clara do autor pra um projeto pequeno e
# recente (4 commits, 1 contribuidor).
#
# Removido do original: o app FastAPI próprio (`app = FastAPI(...)`, rota
# `/generate-chart`) e o bloco de CLI interativo (`if __name__ == "__main__"`)
# — este arquivo é só a lógica de cálculo em si, montada como router próprio
# em `human_design.py`. Lógica de cálculo em si não foi alterada.
#
# Limitações conhecidas herdadas do original (ver docs/presenca-checklist-
# desenvolvimento.md): não expõe canais nem cruz de encarnação como campo
# de saída (embora CHANNELS/CHANNEL_CENTERS sejam usados internamente pra
# determinar centros definidos e tipo).

import swisseph as swe
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder
import pytz
from datetime import datetime

# Efeméride analítico embutido (Moshier) — cobre milhares de anos sem
# precisar baixar arquivo de dados externo, suficiente pra qualquer data
# de nascimento real.
swe.set_ephe_path('')

geolocator = Nominatim(user_agent="presenca_minha_human_design", timeout=8)
tf = TimezoneFinder()


def offset_from_coordinates(lat: float, lng: float, year: int, month: int, day: int, hour: int, minute: int) -> float:
    """Resolve o offset UTC exato pra uma data/hora histórica específica, a
    partir de uma coordenada já conhecida (ex: selecionada no autocomplete
    de local de nascimento — pula o geocoding por texto inteiramente, sem
    a ambiguidade de nomes de cidade repetidos).

    Levanta ValueError se o fuso horário não puder ser determinado a
    partir das coordenadas — quem chama decide o fallback (ver
    human_design.py)."""
    tz_name = tf.timezone_at(lng=lng, lat=lat)
    if not tz_name:
        raise ValueError("Could not determine the timezone for those coordinates.")

    local_tz = pytz.timezone(tz_name)
    dt_naive = datetime(year, month, day, hour, minute)

    try:
        dt_aware = local_tz.localize(dt_naive)
    except pytz.exceptions.AmbiguousTimeError:
        # Raro overlap de 1h na virada do horário de verão (outono).
        dt_aware = local_tz.localize(dt_naive, is_dst=False)

    return dt_aware.utcoffset().total_seconds() / 3600


def get_historical_offset(city: str, year: int, month: int, day: int, hour: int, minute: int) -> float:
    """Converte uma string de cidade no offset UTC exato pra uma data/hora
    histórica específica — geocodifica o texto primeiro, depois reaproveita
    offset_from_coordinates.

    Levanta ValueError se a cidade não puder ser geocodificada ou se o fuso
    horário não puder ser determinado a partir das coordenadas — quem chama
    decide o fallback (ver human_design.py)."""
    location = geolocator.geocode(city)
    if not location:
        raise ValueError(f"Could not locate the city: {city}. Try adding the state or country.")

    return offset_from_coordinates(location.latitude, location.longitude, year, month, day, hour, minute)


# ─────────────────────────────────────────────
# GATE MAP: grau eclíptico → portão de Human Design
# Cada portão ocupa 5.625 graus (360 / 64 portões)
# ─────────────────────────────────────────────

GATE_SEQUENCE = [
    25, 17, 21, 51, 42, 3,   # Aries
    27, 24, 2,  23, 8,  20,  # Taurus
    16, 35, 45, 12, 15, 52,  # Gemini
    39, 53, 62, 56, 31, 33,  # Cancer
    7,  4,  29, 59, 40, 64,  # Leo
    47, 6,  46, 18, 48, 57,  # Virgo+Libra
    32, 50, 28, 44, 1,  43,  # Libra+Scorpio
    14, 34, 9,  5,  26, 11,  # Scorpio+Sag
    10, 58, 38, 54, 61, 60,  # Cap
    41, 19, 13, 49, 30, 55,  # Aquarius
    37, 63, 22, 36            # Pisces
]

HD_START_DEGREE = 358.25  # 28°15' Pisces

CENTERS = {
    "Head":     [61, 63, 64],
    "Ajna":     [4, 11, 17, 24, 43, 47],
    "Throat":   [8, 12, 16, 20, 23, 31, 33, 35, 45, 56, 62],
    "Self":     [1, 2, 7, 10, 13, 15, 25, 46],
    "Sacral":   [3, 5, 9, 14, 27, 29, 34, 42, 59],
    "Root":     [19, 28, 38, 39, 41, 52, 53, 54, 58, 60],
    "Spleen":   [18, 28, 32, 44, 48, 50, 57],
    "Solar Plexus": [6, 22, 30, 36, 37, 49, 55],
    "Heart":    [21, 26, 40, 51]
}

CHANNELS = [
    (1, 8), (2, 14), (3, 60), (4, 63), (5, 15),
    (6, 59), (7, 31), (9, 52), (10, 20), (11, 56),
    (12, 22), (13, 33), (16, 48), (17, 62), (18, 58),
    (19, 49), (20, 34), (20, 57), (21, 45), (23, 43),
    (24, 61), (25, 51), (26, 44), (27, 50), (28, 38),
    (29, 46), (30, 41), (32, 54), (34, 57), (35, 36),
    (37, 40), (39, 55), (42, 53), (47, 64)
]

CHANNEL_CENTERS = {
    (1, 8):   ("Self", "Throat"),
    (2, 14):  ("Self", "Sacral"),
    (3, 60):  ("Sacral", "Root"),
    (4, 63):  ("Ajna", "Head"),
    (5, 15):  ("Sacral", "Self"),
    (6, 59):  ("Solar Plexus", "Sacral"),
    (7, 31):  ("Self", "Throat"),
    (9, 52):  ("Sacral", "Root"),
    (10, 20): ("Self", "Throat"),
    (11, 56): ("Ajna", "Throat"),
    (12, 22): ("Throat", "Solar Plexus"),
    (13, 33): ("Self", "Throat"),
    (16, 48): ("Throat", "Spleen"),
    (17, 62): ("Ajna", "Throat"),
    (18, 58): ("Spleen", "Root"),
    (19, 49): ("Root", "Solar Plexus"),
    (20, 34): ("Throat", "Sacral"),
    (20, 57): ("Throat", "Spleen"),
    (21, 45): ("Heart", "Throat"),
    (23, 43): ("Throat", "Ajna"),
    (24, 61): ("Ajna", "Head"),
    (25, 51): ("Self", "Heart"),
    (26, 44): ("Heart", "Spleen"),
    (27, 50): ("Sacral", "Spleen"),
    (28, 38): ("Spleen", "Root"),
    (29, 46): ("Sacral", "Self"),
    (30, 41): ("Solar Plexus", "Root"),
    (32, 54): ("Spleen", "Root"),
    (34, 57): ("Sacral", "Spleen"),
    (35, 36): ("Throat", "Solar Plexus"),
    (37, 40): ("Solar Plexus", "Heart"),
    (39, 55): ("Root", "Solar Plexus"),
    (42, 53): ("Sacral", "Root"),
    (47, 64): ("Ajna", "Head")
}


def degree_to_gate_line(degree):
    gate_size = 360 / 64
    line_size = gate_size / 6
    adjusted = (degree - HD_START_DEGREE) % 360
    index = int(adjusted / gate_size)
    line = int((adjusted % gate_size) / line_size) + 1
    return GATE_SEQUENCE[index], line


def get_planet_positions(jd):
    """Gate/linha de todos os planetas relevantes pra HD, na ordem padrão Jovian Archive."""
    results = {}

    sun_deg = swe.calc_ut(jd, swe.SUN)[0][0]
    gate, line = degree_to_gate_line(sun_deg)
    results["Sun"] = {"degree": sun_deg, "gate": gate, "line": line}

    earth_deg = (sun_deg + 180) % 360
    gate, line = degree_to_gate_line(earth_deg)
    results["Earth"] = {"degree": earth_deg, "gate": gate, "line": line}

    nn_deg = swe.calc_ut(jd, swe.TRUE_NODE)[0][0]
    gate, line = degree_to_gate_line(nn_deg)
    results["N.Node"] = {"degree": nn_deg, "gate": gate, "line": line}

    sn_deg = (nn_deg + 180) % 360
    gate, line = degree_to_gate_line(sn_deg)
    results["S.Node"] = {"degree": sn_deg, "gate": gate, "line": line}

    planets = {
        "Moon":    swe.MOON,
        "Mercury": swe.MERCURY,
        "Venus":   swe.VENUS,
        "Mars":    swe.MARS,
        "Jupiter": swe.JUPITER,
        "Saturn":  swe.SATURN,
        "Uranus":  swe.URANUS,
        "Neptune": swe.NEPTUNE,
        "Pluto":   swe.PLUTO,
    }

    for name, planet_id in planets.items():
        pos = swe.calc_ut(jd, planet_id)[0][0]
        gate, line = degree_to_gate_line(pos)
        results[name] = {"degree": pos, "gate": gate, "line": line}

    return results


def get_defined_centers(all_gates):
    defined = set()
    gate_set = set(all_gates)

    for g1, g2 in CHANNELS:
        if g1 in gate_set and g2 in gate_set:
            if (g1, g2) in CHANNEL_CENTERS:
                c1, c2 = CHANNEL_CENTERS[(g1, g2)]
                defined.add(c1)
                defined.add(c2)
    return defined


def determine_type(defined_centers, all_gates):
    has_sacral = "Sacral" in defined_centers
    has_throat = "Throat" in defined_centers

    motor_centers = {"Sacral", "Heart", "Solar Plexus", "Root"}
    motor_to_throat = False

    gate_set = set(all_gates)
    graph = {center: set() for center in CENTERS.keys()}

    for g1, g2 in CHANNELS:
        if g1 in gate_set and g2 in gate_set:
            if (g1, g2) in CHANNEL_CENTERS:
                c1, c2 = CHANNEL_CENTERS[(g1, g2)]
                graph[c1].add(c2)
                graph[c2].add(c1)

    if has_throat:
        visited = set()
        queue = ["Throat"]

        while queue:
            current = queue.pop(0)
            if current not in visited:
                visited.add(current)
                if current in motor_centers:
                    motor_to_throat = True
                    break
                queue.extend(list(graph[current] - visited))

    if not defined_centers:
        return "Reflector"
    elif has_sacral and motor_to_throat:
        return "Manifesting Generator"
    elif has_sacral:
        return "Generator"
    elif motor_to_throat:
        return "Manifestor"
    else:
        return "Projector"


def determine_authority(defined_centers):
    priority = [
        ("Solar Plexus", "Emotional"),
        ("Sacral", "Sacral"),
        ("Spleen", "Splenic"),
        ("Heart", "Ego"),
        ("Self", "Self-Projected"),
    ]
    for center, authority in priority:
        if center in defined_centers:
            return authority
    return "Mental/Outer"


def calculate_chart(birth_year, birth_month, birth_day, birth_hour, birth_minute, utc_offset):
    utc_hour = birth_hour - utc_offset
    jd_personality = swe.julday(birth_year, birth_month, birth_day,
                                 utc_hour + birth_minute / 60)

    p_sun_deg = swe.calc_ut(jd_personality, swe.SUN)[0][0]
    target_design_deg = (p_sun_deg - 88) % 360
    jd_low = jd_personality - 100
    jd_high = jd_personality - 80

    jd_design = jd_low
    for _ in range(50):
        jd_mid = (jd_low + jd_high) / 2
        jd_design = jd_mid
        sun_deg = swe.calc_ut(jd_mid, swe.SUN)[0][0]
        diff = (sun_deg - target_design_deg + 180) % 360 - 180
        if abs(diff) < 0.0001:
            break
        if diff > 0:
            jd_high = jd_mid
        else:
            jd_low = jd_mid

    personality = get_planet_positions(jd_personality)
    design = get_planet_positions(jd_design)

    all_gates = set()
    for p in personality.values():
        all_gates.add(p["gate"])
    for p in design.values():
        all_gates.add(p["gate"])

    defined_centers = get_defined_centers(all_gates)

    p_sun_line = personality["Sun"]["line"]
    d_sun_line = design["Sun"]["line"]
    profile = f"{p_sun_line}/{d_sun_line}"

    hd_type = determine_type(defined_centers, all_gates)
    authority = determine_authority(defined_centers)

    return {
        "type": hd_type,
        "profile": profile,
        "authority": authority,
        "defined_centers": sorted(defined_centers),
        "undefined_centers": sorted(set(CENTERS.keys()) - defined_centers),
        "personality": personality,
        "design": design,
        "all_active_gates": sorted(all_gates),
    }
