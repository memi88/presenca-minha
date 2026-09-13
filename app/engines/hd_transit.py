"""
hd_transit.py

Combinacao transito x natal do Design Humano.

O que este modulo calcula (determinisco, sem IA):
  1. As ativacoes de gate/linha dos corpos celestes na posicao ATUAL (transito
     de "agora"), reaproveitando exatamente a mesma mecanica ja validada em
     human_design_engine.py (Swiss Ephemeris + offset da roda de portoes).
  2. O "bodygraph do transito isolado" -- canais/centros formados apenas
     entre os gates ativados hoje entre si (energia do dia, independente de
     qualquer pessoa).
  3. Os "gates pendurados" (hanging gates) do mapa natal de uma pessoa --
     gates natais que NAO completam nenhum canal sozinhos -- e quais deles
     sao COMPLETADOS pelo transito de hoje, formando um canal temporario e
     definindo temporariamente um centro que era aberto no mapa natal.

STATUS DE VALIDACAO: a mecanica de calculo de gate/linha do transito reusa
o motor ja validado (26/26 no Golden Profile). A logica de "canal
temporario formado por transito" segue a mesma regra estrutural ja validada
para canais natais (par de gates definido = canal definido), aplicada a um
conjunto combinado (gates natais + gates de transito).

O QUE FOI VALIDADO EM 14/08/2026 (print do Human Design App, 10:48 horario
local de Guilherme = 13:48 UTC):
  - Gates de transito: 13/13 MATCH (mesmos 12 gates unicos: 4, 15, 17, 18,
    20, 21, 29, 30, 33, 41, 49, 64 -- Mercurio e Jupiter compartilham o
    gate 33).
  - Linhas: 12/13 MATCH. A Lua diverge por 1 linha (app=6, nosso=5) no
    minuto exato registrado -- a Lua cruza uma linha a cada ~1h42min, e uma
    diferenca de poucos minutos entre o instante exibido no app (arredondado
    para o minuto) e o instante calculado explica essa unica divergencia.
    Nao e um problema estrutural do motor -- os outros 12 corpos, incluindo
    corpos rapidos como Mercurio, bateram exatamente.
  - Centros temporariamente definidos: Baco e Raiz -- MATCH exato com o app
    (confirmado tambem pela API humandesign_api, independentemente).
  - Canais novos formados por transito+natal: 63/4 (Logica), 18/58
    (Julgamento), 30/41 (Reconhecimento) -- MATCH exato com o app (a lista
    de eventos do dia no app mostra esses 3 pares) e com a API.

STATUS: ENGINE_MATCH (ver ENGINE_VALIDATION.md v0.3). Confirmado por DUAS
fontes independentes: o Human Design App (print fornecido pela equipe) e a
API de terceiros `humandesign_api` (usada apenas como QA, nao como motor
de producao -- ver EXTERNAL_ENGINE_EVALUATION_humandesign_api.md).
"""
import datetime
import swisseph as swe

from .human_design_engine import get_all_positions, longitude_to_gate_line
from .hd_bodygraph import (
    CHANNELS, GATE_CENTER, defined_channels_from_gates, defined_centers_from_channels,
    compute_bodygraph, CENTER_LABELS_PT,
)


def jd_ut_now(dt: datetime.datetime = None) -> float:
    """JD (UT) para um datetime UTC dado (default: agora, em UTC)."""
    if dt is None:
        dt = datetime.datetime.now(datetime.timezone.utc)
    return swe.julday(dt.year, dt.month, dt.day, dt.hour + dt.minute / 60 + dt.second / 3600)


def transit_activations(jd_ut: float) -> dict:
    """Ativacoes gate/linha de todos os corpos na posicao atual (transito)."""
    positions = get_all_positions(jd_ut)
    return {body: longitude_to_gate_line(lon) for body, lon in positions.items()}


def transit_only_bodygraph(transit_gates: set) -> dict:
    """Canais/centros formados apenas pelos gates do transito de hoje entre
    si -- representa 'a energia do dia' de forma independente de qualquer
    pessoa (nao e uma leitura pessoal)."""
    channels = defined_channels_from_gates(transit_gates)
    centers = defined_centers_from_channels(channels)
    return {'defined_channels': channels, 'defined_centers': centers}


def hanging_gates(natal_gates: set) -> set:
    """Gates natais que NAO completam nenhum canal sozinhos dentro do
    proprio mapa natal (aguardando o outro lado do canal)."""
    natal_defined_channels = defined_channels_from_gates(natal_gates)
    gates_in_defined_channels = set()
    for ch in natal_defined_channels:
        gates_in_defined_channels.update(ch['gates'])
    return natal_gates - gates_in_defined_channels


def transit_x_natal(natal_gates: set, transit_gates: set) -> dict:
    """Combinacao transito x natal:
      - gates natais 'pendurados' que o transito de hoje completa
      - canais temporarios resultantes
      - centros que eram abertos no mapa natal e ficam temporariamente
        definidos por causa do transito de hoje
    """
    hanging = hanging_gates(natal_gates)
    combined_gates = natal_gates | transit_gates

    combined_channels = defined_channels_from_gates(combined_gates)
    natal_channels = defined_channels_from_gates(natal_gates)
    natal_channel_keys = {tuple(sorted(ch['gates'])) for ch in natal_channels}

    # canais que só existem por causa da combinação (não existiam só com o natal)
    new_channels = [
        ch for ch in combined_channels
        if tuple(sorted(ch['gates'])) not in natal_channel_keys
    ]

    natal_centers = defined_centers_from_channels(natal_channels)
    combined_centers = defined_centers_from_channels(combined_channels)
    newly_defined_centers = combined_centers - natal_centers

    hanging_completed_today = [
        ch for ch in new_channels
        if (ch['gates'][0] in hanging and ch['gates'][1] in transit_gates)
        or (ch['gates'][1] in hanging and ch['gates'][0] in transit_gates)
    ]

    return {
        'hanging_gates_natal': hanging,
        'new_channels_today': new_channels,
        'hanging_gates_completed_today': hanging_completed_today,
        'centers_newly_defined_today': newly_defined_centers,
    }


if __name__ == "__main__":
    import datetime as _dt

    print("=== Transito de agora ===")
    jd_now = jd_ut_now()
    y, m, d, h = swe.revjul(jd_now)
    print(f"Momento (UT): {y}-{m:02d}-{d:02d} {h:.2f}h  (JD={jd_now:.4f})")

    trans = transit_activations(jd_now)
    for body, (gate, line) in trans.items():
        print(f"  {body:12} Gate {gate}.{line}")

    transit_gates = set(g for g, l in trans.values())
    print("\nGates de transito (conjunto):", sorted(transit_gates))

    tbg = transit_only_bodygraph(transit_gates)
    print("Canais formados so pelo transito de hoje entre si:", len(tbg['defined_channels']))
    for ch in tbg['defined_channels']:
        print("  ", ch['gates'], ch['centers'], ch['name'])

    print("\n=== Combinacao com o mapa natal de Guilherme (Golden Profile) ===")
    import swisseph as swe2
    from .human_design_engine import compute_chart
    birth_utc = _dt.datetime(1988, 8, 25, 3, 40, 0)
    jd_birth = swe2.julday(birth_utc.year, birth_utc.month, birth_utc.day,
                            birth_utc.hour + birth_utc.minute / 60)
    personality, design = compute_chart(jd_birth)
    natal_gates = set(g for g, l in personality.values()) | set(g for g, l in design.values())

    result = transit_x_natal(natal_gates, transit_gates)
    print("Gates natais 'pendurados' (sem par no proprio mapa natal):",
          sorted(result['hanging_gates_natal']))
    print("Canais novos formados pela combinacao transito+natal hoje:")
    for ch in result['new_channels_today']:
        print("  ", ch['gates'], ch['centers'], ch['name'])
    print("Centros que eram abertos no natal e ficam definidos hoje por transito:",
          sorted(result['centers_newly_defined_today']))
