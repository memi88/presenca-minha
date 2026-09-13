"""
hd_bodygraph.py

Grafo de 9 centros e 36 canais do Design Humano, e derivacao de
Tipo / Autoridade / Definicao a partir dos gates ativados (Personalidade + Design).

PROVENIENCIA DOS DADOS ESTRUTURAIS (gate->centro, lista de 36 canais):
Este e dado ESTRUTURAL/FACTUAL do sistema de Design Humano (a mesma topologia
usada por qualquer calculadora do mercado) -- nao e conteudo interpretativo
protegido por IP (isso e diferente dos textos/keynotes, que continuam fora
desta implementacao). Para reduzir risco de erro de memorizacao, a
reconstrucao foi CROSS-CHECADA contra o pacote npm de codigo aberto (MIT)
`free-human-design` (src/hd/bodygraph.js) -- o mapeamento gate->centro e a
lista de 36 canais batem exatamente. Uma diferenca real foi encontrada e
corrigida no processo: o gate 33 pertence ao centro Garganta (Throat), nao
ao Baco (Spleen), como uma primeira tentativa por memoria havia sugerido.

A logica de determinacao de Tipo/Autoridade (busca de alcancabilidade de um
centro motor ate a Garganta; prioridade de autoridade Plexo Solar > Sacral >
Baco > Coracao > G-Center > Ambiental) segue a regra padrao documentada pela
comunidade de Design Humano (Ra Uru Hu / Jovian Archive) e foi validada
diretamente contra o Golden Profile abaixo.
"""
from typing import Set, List, Dict, Tuple

CENTERS = ['head', 'ajna', 'throat', 'g', 'heart', 'sacral', 'solarplexus', 'spleen', 'root']

CENTER_LABELS_PT = {
    'head': 'Cabeca (Coroa)',
    'ajna': 'Ajna',
    'throat': 'Garganta',
    'g': 'G (Identidade)',
    'heart': 'Coracao (Ego/Vontade)',
    'sacral': 'Sacral',
    'solarplexus': 'Plexo Solar',
    'spleen': 'Baco',
    'root': 'Raiz',
}

MOTOR_CENTERS = ['sacral', 'heart', 'solarplexus', 'root']

GATE_CENTER: Dict[int, str] = {
    # Cabeca
    64: 'head', 61: 'head', 63: 'head',
    # Ajna
    47: 'ajna', 24: 'ajna', 4: 'ajna', 17: 'ajna', 11: 'ajna', 43: 'ajna',
    # Garganta
    62: 'throat', 23: 'throat', 56: 'throat', 35: 'throat', 12: 'throat', 45: 'throat',
    33: 'throat', 8: 'throat', 31: 'throat', 20: 'throat', 16: 'throat',
    # G (Identidade)
    1: 'g', 13: 'g', 25: 'g', 46: 'g', 2: 'g', 15: 'g', 10: 'g', 7: 'g',
    # Coracao
    21: 'heart', 40: 'heart', 26: 'heart', 51: 'heart',
    # Baco
    48: 'spleen', 57: 'spleen', 44: 'spleen', 50: 'spleen', 32: 'spleen', 28: 'spleen', 18: 'spleen',
    # Sacral
    34: 'sacral', 5: 'sacral', 14: 'sacral', 29: 'sacral', 59: 'sacral', 9: 'sacral',
    3: 'sacral', 42: 'sacral', 27: 'sacral',
    # Plexo Solar
    6: 'solarplexus', 37: 'solarplexus', 30: 'solarplexus', 55: 'solarplexus',
    49: 'solarplexus', 22: 'solarplexus', 36: 'solarplexus',
    # Raiz
    53: 'root', 60: 'root', 52: 'root', 19: 'root', 39: 'root', 41: 'root',
    58: 'root', 38: 'root', 54: 'root',
}
assert len(GATE_CENTER) == 64

CHANNEL_GATE_PAIRS: List[Tuple[int, int]] = [
    (1, 8), (2, 14), (3, 60), (4, 63), (5, 15), (6, 59), (7, 31), (9, 52),
    (10, 20), (10, 34), (10, 57), (11, 56), (12, 22), (13, 33), (16, 48), (17, 62),
    (18, 58), (19, 49), (20, 34), (20, 57), (21, 45), (23, 43), (24, 61), (25, 51),
    (26, 44), (27, 50), (28, 38), (29, 46), (30, 41), (32, 54), (34, 57), (35, 36),
    (37, 40), (39, 55), (42, 53), (47, 64),
]
assert len(CHANNEL_GATE_PAIRS) == 36

CHANNEL_NAMES_PT = {
    (1, 8): 'Inspiracao', (2, 14): 'O Ritmo', (3, 60): 'Mutacao', (4, 63): 'Logica',
    (5, 15): 'Ritmo', (6, 59): 'Uniao Sexual', (7, 31): 'O Alfa', (9, 52): 'Concentracao',
    (10, 20): 'Despertar', (10, 34): 'Exploracao', (10, 57): 'Forma Perfeita',
    (11, 56): 'Curiosidade', (12, 22): 'Abertura', (13, 33): 'O Prodigo',
    (16, 48): 'Comprimento de Onda', (17, 62): 'Aceitacao', (18, 58): 'Julgamento',
    (19, 49): 'Sintese', (20, 34): 'Carisma', (20, 57): 'Onda Cerebral',
    (21, 45): 'Dinheiro', (23, 43): 'Estruturacao', (24, 61): 'Consciencia', (25, 51): 'Iniciacao',
    (26, 44): 'Rendicao', (27, 50): 'Preservacao', (28, 38): 'Luta',
    (29, 46): 'Descoberta', (30, 41): 'Reconhecimento', (32, 54): 'Transformacao',
    (34, 57): 'Poder', (35, 36): 'Transitoriedade', (37, 40): 'Comunidade',
    (39, 55): 'Emocionar', (42, 53): 'Maturacao', (47, 64): 'Abstracao',
}


def _channel_centers(gate_pair: Tuple[int, int]) -> Tuple[str, str]:
    a, b = gate_pair
    return GATE_CENTER[a], GATE_CENTER[b]


CHANNELS = [
    {
        'gates': gp,
        'centers': _channel_centers(gp),
        'name': CHANNEL_NAMES_PT.get(gp),
    }
    for gp in CHANNEL_GATE_PAIRS
]


def defined_channels_from_gates(activated_gates: Set[int]) -> List[dict]:
    return [ch for ch in CHANNELS if ch['gates'][0] in activated_gates and ch['gates'][1] in activated_gates]


def defined_centers_from_channels(channels: List[dict]) -> Set[str]:
    centers = set()
    for ch in channels:
        centers.add(ch['centers'][0])
        centers.add(ch['centers'][1])
    return centers


def _center_adjacency(defined_centers: Set[str], channels: List[dict]) -> Dict[str, Set[str]]:
    adj = {c: set() for c in defined_centers}
    for ch in channels:
        c1, c2 = ch['centers']
        if c1 in adj and c2 in adj:
            adj[c1].add(c2)
            adj[c2].add(c1)
    return adj


def connected_components(defined_centers: Set[str], channels: List[dict]) -> List[Set[str]]:
    """Usado para determinar a Definicao (Simples/Bipartida/Tripartida/Quadripartida):
    numero de grupos de centros conectados entre si por canais definidos."""
    adj = _center_adjacency(defined_centers, channels)
    seen = set()
    components = []
    for start in defined_centers:
        if start in seen:
            continue
        comp = set()
        stack = [start]
        while stack:
            cur = stack.pop()
            if cur in comp:
                continue
            comp.add(cur)
            seen.add(cur)
            for nxt in adj.get(cur, ()):
                if nxt not in comp:
                    stack.append(nxt)
        components.append(comp)
    return components


DEFINITION_NAMES_PT = {
    0: 'Nenhuma (Refletor)',
    1: 'Simples',
    2: 'Bipartida',
    3: 'Tripartida',
    4: 'Quadripartida',
}


def definition_type(defined_centers: Set[str], channels: List[dict]) -> str:
    n = len(connected_components(defined_centers, channels))
    return DEFINITION_NAMES_PT.get(n, f'{n} grupos (nao usual)')


def _reaches_throat(start: str, defined_centers: Set[str], channels: List[dict]) -> bool:
    if 'throat' not in defined_centers or start not in defined_centers:
        return False
    adj = _center_adjacency(defined_centers, channels)
    seen = {start}
    stack = [start]
    while stack:
        cur = stack.pop()
        if cur == 'throat':
            return True
        for nxt in adj.get(cur, ()):
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)
    return False


def any_motor_reaches_throat(defined_centers: Set[str], channels: List[dict]) -> bool:
    return any(_reaches_throat(m, defined_centers, channels) for m in MOTOR_CENTERS if m in defined_centers)


def determine_type(defined_centers: Set[str], channels: List[dict]) -> str:
    """CONFIRMADO contra o Golden Profile (ver test_golden_profile.py)."""
    if len(defined_centers) == 0:
        return 'Refletor'
    sacral = 'sacral' in defined_centers
    motor_to_throat = any_motor_reaches_throat(defined_centers, channels)
    if sacral:
        return 'Gerador Manifestante' if motor_to_throat else 'Gerador'
    return 'Manifestador' if motor_to_throat else 'Projetor'


def determine_authority(defined_centers: Set[str], channels: List[dict]) -> str:
    """CONFIRMADO contra o Golden Profile para o caso Plexo Solar (prioridade
    mais alta -- os demais ramos da prioridade nao foram exercitados por este
    perfil e permanecem nao testados; ver ENGINE_VALIDATION.md)."""
    if len(defined_centers) == 0:
        return 'Lunar (Refletor)'
    if 'solarplexus' in defined_centers:
        return 'Plexo Solar (Emocional)'
    if 'sacral' in defined_centers:
        return 'Sacral'
    if 'spleen' in defined_centers:
        return 'Baco (Esplenica)'
    if 'heart' in defined_centers:
        return 'Coracao (Ego)'
    if 'g' in defined_centers and 'throat' in defined_centers:
        if _reaches_throat('g', defined_centers, channels):
            return 'G Auto-Projetado'
    return 'Mental (Ambiental / Nenhuma)'


def compute_bodygraph(activated_gates: Set[int]) -> dict:
    channels = defined_channels_from_gates(activated_gates)
    centers = defined_centers_from_channels(channels)
    return {
        'defined_channels': channels,
        'defined_centers': centers,
        'open_centers': set(CENTERS) - centers,
        'definition': definition_type(centers, channels),
        'type': determine_type(centers, channels),
        'authority': determine_authority(centers, channels),
    }


# ---------------------------------------------------------------------------
# Assinatura / Tema do Nao-Ser (lookup fixo por Tipo -- vocabulario padrao,
# nao e o texto interpretativo extenso das keynotes, apenas o rotulo curto).
# CONFIRMADO contra o Golden Profile para o caso Gerador Manifestante.
# ---------------------------------------------------------------------------
SIGNATURE_BY_TYPE = {
    'Gerador Manifestante': 'Satisfacao',
    'Gerador': 'Satisfacao',
    'Manifestador': 'Paz',
    'Projetor': 'Sucesso',
    'Refletor': 'Surpresa',
}
NOT_SELF_THEME_BY_TYPE = {
    'Gerador Manifestante': 'Frustracao',
    'Gerador': 'Frustracao',
    'Manifestador': 'Raiva',
    'Projetor': 'Amargura',
    'Refletor': 'Decepcao',
}
STRATEGY_BY_TYPE = {
    'Gerador Manifestante': 'Responder',
    'Gerador': 'Responder',
    'Manifestador': 'Informar',
    'Projetor': 'Esperar o convite',
    'Refletor': 'Esperar um ciclo lunar (~28 dias)',
}
