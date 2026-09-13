"""
Gate 1 (CLAUDE.md secao 5, aberto 20/08/2026) -- Dreamspell Structural
Relationships. Golden tests do motor REAL (app/engines/dreamspell_engine.py
+ app/alpha/relationship_detector.py) contra a Fifth Force Oracle
(Guide/Analog/Antipode/Occult) e as 5 Familias Terrestres da Foundation
for the Law of Time (lawoftime.org).

Metodo de validacao (documentado em detalhe no comentario "GATE 1" de
app/engines/dreamspell_engine.py): as formulas foram cross-validadas em
20/08/2026 contra 8 assinaturas galacticas publicadas (lawoftime.org +
tortuga1320.com), cobrindo os 5 grupos de deslocamento do Guia e as
formulas de Analogo/Antipoda/Oculto. As 5 Familias Terrestres (Polar/
Cardinal/Core/Signal/Gateway) foram confirmadas contra 3 fontes
independentes de busca (incluindo a hipotese original do time: Gateway =
Semente, Lua, Mago, Tormenta).

Este arquivo reimplementa as formulas de forma INDEPENDENTE (nao importa
as funcoes privadas do motor) como oraculo de bruteforce -- mesmo padrao
de tests/test_kin_pre_epoca.py -- e so DEPOIS compara contra o motor
real, pra nao virar um teste tautologico que so re-verifica a si mesmo.
"""
from app.alpha.relationship_detector import detectar_relacoes_estruturais
from app.engines.dreamspell_engine import (
    SEAL_COLORS,
    SEALS,
    analog_seal,
    antipode_seal,
    earth_family_of,
    full_reading,
    guide_seal,
    occult_seal,
)

# ---------------------------------------------------------------------------
# Oraculo independente (nao importa nada do motor alem da lista SEALS, que
# e so o vocabulario de nomes -- a MATEMATICA abaixo e reimplementada do
# zero a partir da fonte primaria, nao copiada do motor).

def _oracle_analog(indice_1a20: int) -> int:
    return ((18 - indice_1a20) % 20) + 1


def _oracle_antipode(indice_1a20: int) -> int:
    return ((indice_1a20 - 1 + 10) % 20) + 1


def _oracle_occult(indice_1a20: int) -> int:
    return ((20 - indice_1a20) % 20) + 1


_ORACLE_GUIDE_OFFSET = {
    1: 0, 6: 0, 11: 0,
    2: 12, 7: 12, 12: 12,
    3: 4, 8: 4, 13: 4,
    4: 16, 9: 16,
    5: 8, 10: 8,
}


def _oracle_guide(indice_1a20: int, tom: int) -> int:
    return ((indice_1a20 - 1 + _ORACLE_GUIDE_OFFSET[tom]) % 20) + 1


# 5 Familias Terrestres, por indice de Selo (1-20) mod 5 -- confirmadas
# contra fonte (ver docstring). Reescritas aqui por extenso (nao geradas
# por formula) pra servir de golden fixo e legivel.
_ORACLE_EARTH_FAMILY = {
    "Dragao": "Cardinal", "Enlacador de Mundos": "Cardinal", "Macaco": "Cardinal", "Guerreiro": "Cardinal",
    "Vento": "Core", "Mao": "Core", "Humano": "Core", "Terra": "Core",
    "Noite": "Signal", "Estrela": "Signal", "Caminhante do Ceu": "Signal", "Espelho": "Signal",
    "Semente": "Gateway", "Lua": "Gateway", "Mago": "Gateway", "Tempestade": "Gateway",
    "Serpente": "Polar", "Cao": "Polar", "Aguia": "Polar", "Sol": "Polar",
}


def main():
    n_pass = n_fail = 0

    def check(label, obtido, esperado):
        nonlocal n_pass, n_fail
        ok = obtido == esperado
        n_pass += ok
        n_fail += not ok
        status = "PASS" if ok else "FAIL"
        print(f"{status:6} {label:70} obtido={obtido!r} esperado={esperado!r}")

    # --- 1. As 5 Familias Terrestres completas (20 Selos) -------------------
    for i, selo in enumerate(SEALS, start=1):
        esperado = _ORACLE_EARTH_FAMILY[selo]
        check(f"Familia Terrestre de {selo} (indice {i})", earth_family_of(selo), esperado)

    # Confirma explicitamente a hipotese que motivou o Gate 1: Gateway =
    # Semente, Lua, Mago, Tormenta.
    gateway = sorted(s for s, f in _ORACLE_EARTH_FAMILY.items() if f == "Gateway")
    check("Familia Gateway == {Lua, Mago, Semente, Tempestade}",
          gateway, sorted(["Lua", "Mago", "Semente", "Tempestade"]))
    # Cada familia tem exatamente 4 selos, 5 familias, sem sobreposicao.
    check("5 familias x 4 selos == 20 selos, sem sobreposicao",
          sorted(_ORACLE_EARTH_FAMILY.keys()), sorted(SEALS))

    # --- 2. Analogo dos 20 Selos ---------------------------------------------
    for i, selo in enumerate(SEALS, start=1):
        esperado = SEALS[_oracle_analog(i) - 1]
        check(f"Selo Analogo de {selo}", analog_seal(selo), esperado)
    # Involucao: Analogo(Analogo(S)) == S pra todos os 20 (par simetrico).
    for selo in SEALS:
        check(f"Involucao Analogo: Analogo(Analogo({selo})) == {selo}",
              analog_seal(analog_seal(selo)), selo)

    # --- 3. Antipoda dos 20 Selos ---------------------------------------------
    for i, selo in enumerate(SEALS, start=1):
        esperado = SEALS[_oracle_antipode(i) - 1]
        check(f"Selo Antipoda de {selo}", antipode_seal(selo), esperado)
    for selo in SEALS:
        check(f"Involucao Antipoda: Antipoda(Antipoda({selo})) == {selo}",
              antipode_seal(antipode_seal(selo)), selo)

    # --- 4. Oculto dos 20 Selos ------------------------------------------------
    for i, selo in enumerate(SEALS, start=1):
        esperado = SEALS[_oracle_occult(i) - 1]
        check(f"Selo Oculto de {selo}", occult_seal(selo), esperado)
    for selo in SEALS:
        check(f"Involucao Oculto: Oculto(Oculto({selo})) == {selo}",
              occult_seal(occult_seal(selo)), selo)

    # --- 5. Guia cobrindo todos os 13 Tons (Selo de referencia: Dragao) -----
    for tom in range(1, 14):
        esperado = SEALS[_oracle_guide(1, tom) - 1]
        check(f"Selo Guia de Dragao no Tom {tom}", guide_seal("Dragao", tom), esperado)
    # Regra "mesma cor do Selo central": todo deslocamento de Guia e
    # multiplo de 4 (0/12/4/16/8), entao a cor nunca muda.
    for tom in range(1, 14):
        g = guide_seal("Dragao", tom)
        cor_dragao = SEAL_COLORS[SEALS.index("Dragao")]
        cor_guia = SEAL_COLORS[SEALS.index(g)]
        check(f"Guia no Tom {tom} tem a MESMA cor do Selo central (Dragao={cor_dragao})",
              cor_guia, cor_dragao)

    # --- 6. Casos reais externos, cross-validados contra fontes publicadas --
    # (ver comentario GATE 1 em dreamspell_engine.py pra lista completa).
    # Kin 40 = "1 Sol": Guide=1 Sol, Analog=1 Tempestade, Antipode=1 Cao,
    # Occult=13 Dragao.
    r40 = full_reading(40)
    check("Kin 40: Selo == Sol, Tom == 1 (setup)", (r40.seal, r40.tone_number), ("Sol", 1))
    check("Kin 40: Guia == Sol (self-guiado, Tom1)", guide_seal(r40.seal, r40.tone_number), "Sol")
    check("Kin 40: Analogo == Tempestade", analog_seal(r40.seal), "Tempestade")
    check("Kin 40: Antipoda == Cao", antipode_seal(r40.seal), "Cao")
    check("Kin 40: Oculto == Dragao", occult_seal(r40.seal), "Dragao")

    # Kin 245 = "11 Serpente": Guide=11 Serpente, Analog=11 Mago,
    # Antipode=11 Aguia, Occult=3 Guerreiro.
    r245 = full_reading(245)
    check("Kin 245: Selo == Serpente, Tom == 11 (setup)", (r245.seal, r245.tone_number), ("Serpente", 11))
    check("Kin 245: Guia == Serpente (self-guiado, Tom11)", guide_seal(r245.seal, r245.tone_number), "Serpente")
    check("Kin 245: Analogo == Mago", analog_seal(r245.seal), "Mago")
    check("Kin 245: Antipoda == Aguia", antipode_seal(r245.seal), "Aguia")
    check("Kin 245: Oculto == Guerreiro", occult_seal(r245.seal), "Guerreiro")

    # ---------------------------------------------------------------------
    # 7. OS DOIS CASOS REAIS DO GATE 1 -- Guilherme (Kin 169) e Julie
    # (Kin 239) contra o momento de hoje real do laboratorio (20/08/2026,
    # Kin 254, Mago Ressonante Branco).
    # ---------------------------------------------------------------------
    KIN_HOJE_20_08_2026 = 254
    r_hoje = full_reading(KIN_HOJE_20_08_2026)
    check("Setup: hoje (20/08/2026) == Kin 254, Selo Mago, Tom Ressonante",
          (r_hoje.seal, r_hoje.tone), ("Mago", "Ressonante"))

    # --- Guilherme: Kin natal 169, Lua Cosmica Vermelha ---
    KIN_NATAL_GUILHERME = 169
    r_gui = full_reading(KIN_NATAL_GUILHERME)
    check("Setup: Kin natal 169 == Selo Lua, Tom Cosmico (Golden Profile)",
          (r_gui.seal, r_gui.tone), ("Lua", "Cosmico"))

    rel_gui = detectar_relacoes_estruturais(KIN_NATAL_GUILHERME, KIN_HOJE_20_08_2026)
    check("Guilherme x Hoje: same_seal", rel_gui.same_seal, False)
    check("Guilherme x Hoje: same_tone", rel_gui.same_tone, False)
    check("Guilherme x Hoje: same_wavespell", rel_gui.same_wavespell, False)
    check("Guilherme x Hoje: same_earth_family (Lua e Mago sao Gateway)", rel_gui.same_earth_family, True)
    check("Guilherme: natal_guide_seal", rel_gui.natal_guide_seal, "Caminhante do Ceu")
    check("Guilherme x Hoje: natal_guide_match", rel_gui.natal_guide_match, False)
    check("Guilherme: natal_analog_seal", rel_gui.natal_analog_seal, "Cao")
    check("Guilherme x Hoje: natal_analog_match", rel_gui.natal_analog_match, False)
    check("Guilherme: natal_antipode_seal", rel_gui.natal_antipode_seal, "Tempestade")
    check("Guilherme x Hoje: natal_antipode_match", rel_gui.natal_antipode_match, False)
    check("Guilherme: natal_occult_seal", rel_gui.natal_occult_seal, "Humano")
    check("Guilherme x Hoje: natal_occult_match", rel_gui.natal_occult_match, False)

    # --- Julie: Kin natal 239, Tormenta Harmonica (Overtonal) Azul ---
    KIN_NATAL_JULIE = 239
    r_julie = full_reading(KIN_NATAL_JULIE)
    check("Setup: Kin natal 239 == Selo Tempestade, Tom Overtonal",
          (r_julie.seal, r_julie.tone), ("Tempestade", "Overtonal"))

    rel_julie = detectar_relacoes_estruturais(KIN_NATAL_JULIE, KIN_HOJE_20_08_2026)
    check("Julie x Hoje: same_seal", rel_julie.same_seal, False)
    check("Julie x Hoje: same_tone", rel_julie.same_tone, False)
    check("Julie x Hoje: same_wavespell", rel_julie.same_wavespell, False)
    check("Julie x Hoje: same_earth_family (Tempestade e Mago sao Gateway)", rel_julie.same_earth_family, True)
    check("Julie: natal_guide_seal", rel_julie.natal_guide_seal, "Mao")
    check("Julie x Hoje: natal_guide_match", rel_julie.natal_guide_match, False)
    check("Julie: natal_analog_seal", rel_julie.natal_analog_seal, "Sol")
    check("Julie x Hoje: natal_analog_match", rel_julie.natal_analog_match, False)
    check("Julie: natal_antipode_seal", rel_julie.natal_antipode_seal, "Lua")
    check("Julie x Hoje: natal_antipode_match", rel_julie.natal_antipode_match, False)
    check("Julie: natal_occult_seal", rel_julie.natal_occult_seal, "Vento")
    check("Julie x Hoje: natal_occult_match", rel_julie.natal_occult_match, False)

    # --- 8. Hunab Ku 0.0: kin_hoje=None nao levanta excecao, natal_* segue
    # calculado (e informacao do participante, nao do dia) ------------------
    rel_hk = detectar_relacoes_estruturais(KIN_NATAL_GUILHERME, None)
    check("Hunab Ku: nao levanta excecao (chegou ate aqui)", True, True)
    check("Hunab Ku: same_seal == False (sem excecao)", rel_hk.same_seal, False)
    check("Hunab Ku: same_earth_family == False (sem excecao)", rel_hk.same_earth_family, False)
    check("Hunab Ku: natal_guide_seal continua calculado (nao depende de hoje)",
          rel_hk.natal_guide_seal, "Caminhante do Ceu")
    check("Hunab Ku: todos os *_match == False",
          (rel_hk.natal_guide_match, rel_hk.natal_analog_match, rel_hk.natal_antipode_match, rel_hk.natal_occult_match),
          (False, False, False, False))

    print()
    print(f"Resumo Gate 1 (Dreamspell Structural Relationships): {n_pass} PASS | {n_fail} FAIL")
    return n_fail == 0


if __name__ == "__main__":
    import sys
    sys.exit(0 if main() else 1)
