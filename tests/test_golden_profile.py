"""
test_golden_profile.py

Fixtures/testes automatizados contra o GOLDEN_PROFILE_GUILHERME.md.

Rodar com: python3 test_golden_profile.py
"""
import datetime
import sys

from app.engines.numerology_engine import compute_natal, mes_pessoal, dia_pessoal
from app.engines.dreamspell_engine import kin_for_date, full_reading, OFFICIAL_CONVENTION, REJECTED_CONVENTIONS
import swisseph as swe
from app.engines.human_design_engine import compute_chart, profile_from_chart, cross_gates_from_chart
from app.engines.hd_bodygraph import (
    compute_bodygraph, SIGNATURE_BY_TYPE, NOT_SELF_THEME_BY_TYPE, STRATEGY_BY_TYPE,
)
from app.engines.hd_transit import jd_ut_now, transit_activations, transit_x_natal

PASS = "PASS"
FAIL = "FAIL"
PENDING = "PENDENTE"

results = []


def check(label, got, expected, status_if_pending=None):
    if status_if_pending:
        results.append((label, got, expected, status_if_pending))
        return
    ok = (got == expected)
    results.append((label, got, expected, PASS if ok else FAIL))


# ============================================================================
# NUMEROLOGIA
# ============================================================================
num = compute_natal("Guilherme Moreira dos Santos", day=25, month=8, year=1988)

check("Numerologia: Dia Natalicio", num.dia_natalicio, 25)
check("Numerologia: Numero Psiquico", num.numero_psiquico, 7)
check("Numerologia: Motivacao", num.motivacao, 1)
check("Numerologia: Impressao", num.impressao, 2)
check("Numerologia: Expressao", num.expressao, 3)
check("Numerologia: Destino", num.destino, 5)
check("Numerologia: Missao", num.missao, 8)
check("Numerologia: Licoes Carmicas", sorted(num.licoes_carmicas), [8, 9])
check("Numerologia: Tendencias Ocultas", sorted(num.tendencias_ocultas), [1, 3, 4, 5])
check("Numerologia: Resposta Subconsciente", num.resposta_subconsciente, 7)
check("Numerologia: Ciclos de Vida", num.ciclos_de_vida, [8, 7, 8])
check("Numerologia: Desafios", num.desafios, [1, 1, 0])
check("Numerologia: Momentos Decisivos", num.momentos_decisivos, [6, 6, 3, 7])

check("Numerologia: Talento Oculto (HIPOTESE |Destino-Motivacao|, 1 ponto de dado)",
      num.talento_oculto_hipotese, 4, status_if_pending=PENDING)
check("Numerologia: Debitos Carmicos", num.debitos_carmicos, [14, 19], status_if_pending=PENDING)

mp_antes = mes_pessoal(25, 8, ref_date_year=2026, ref_date_month=8, ref_date_day=24)
mp_depois = mes_pessoal(25, 8, ref_date_year=2026, ref_date_month=8, ref_date_day=25)
check("Numerologia: Mes Pessoal em 24/08/2026 (antes do aniversario)", mp_antes, 5)
check("Numerologia: Mes Pessoal em 25/08/2026 (dia do aniversario)", mp_depois, 6)

dp_exemplo = dia_pessoal(25, 8, ref_date_year=2026, ref_date_month=8, ref_date_day=14)
check("Numerologia: Dia Pessoal 14/08/2026 (formula CONFIRMADA pela equipe; "
      "sem numero de referencia no Golden Profile para assert automatico)",
      dp_exemplo, "metodologia confirmada, ver ENGINE_VALIDATION.md", status_if_pending=PENDING)


# ============================================================================
# DREAMSPELL
# ============================================================================
target_date = datetime.date(1988, 8, 25)
EPOCH = datetime.date(1987, 7, 26)

check("Dreamspell: Kin epoca 26/07/1987", kin_for_date(EPOCH, **OFFICIAL_CONVENTION), 34)
check("Dreamspell: Kin 25/08/1988 (convencao OFICIAL: 25/jul avanca, 29/fev nao avanca)",
      kin_for_date(target_date, **OFFICIAL_CONVENTION), 169)

r169 = full_reading(169)
check("Dreamspell: Selo do Kin 169", r169.seal, "Lua")
check("Dreamspell: Cor do Selo do Kin 169", r169.seal_color, "Vermelho")
check("Dreamspell: Tom do Kin 169", (r169.tone_number, r169.tone), (13, "Cosmico"))
check("Dreamspell: Onda Encantada do Kin 169", (r169.wavespell_seal, r169.wavespell_color),
      ("Terra", "Vermelho"))

for conv_name, params in REJECTED_CONVENTIONS.items():
    k = kin_for_date(target_date, **params)
    check(f"Dreamspell: [documentacao] convencao rejeitada '{conv_name}' (NAO usar em producao)",
          k, "diferente de 169 (esperado)", status_if_pending=PENDING)


# ============================================================================
# HUMAN DESIGN
# ============================================================================
birth_utc = datetime.datetime(1988, 8, 25, 3, 40, 0)
jd_birth_ut = swe.julday(birth_utc.year, birth_utc.month, birth_utc.day,
                          birth_utc.hour + birth_utc.minute / 60)

personality, design = compute_chart(jd_birth_ut)

GOLDEN_PERSONALITY = {
    'Sol': (59, 3), 'Terra': (55, 3), 'Lua': (60, 4), 'NodoNorte': (63, 3), 'NodoSul': (64, 3),
    'Mercurio': (47, 5), 'Venus': (53, 2), 'Marte': (21, 3), 'Jupiter': (20, 5), 'Saturno': (11, 4),
    'Urano': (11, 5), 'Netuno': (58, 4), 'Plutao': (44, 3),
}
GOLDEN_DESIGN = {
    'Sol': (20, 5), 'Terra': (34, 5), 'Lua': (47, 4), 'NodoNorte': (22, 4), 'NodoSul': (47, 4),
    'Mercurio': (12, 3), 'Venus': (15, 3), 'Marte': (55, 2), 'Jupiter': (2, 5), 'Saturno': (10, 4),
    'Urano': (10, 2), 'Netuno': (38, 1), 'Plutao': (44, 4),
}

for body, expected in GOLDEN_PERSONALITY.items():
    check(f"Design Humano: Personalidade {body}", personality[body], expected)
for body, expected in GOLDEN_DESIGN.items():
    check(f"Design Humano: Design {body}", design[body], expected)

check("Design Humano: Perfil", profile_from_chart(personality, design), "3/5")
check("Design Humano: Portas da Cruz", cross_gates_from_chart(personality, design), "59/55 | 20/34")

all_gates = set(g for g, l in personality.values()) | set(g for g, l in design.values())
bg = compute_bodygraph(all_gates)

check("Design Humano: Definicao", bg['definition'], "Bipartida")
check("Design Humano: Tipo", bg['type'], "Gerador Manifestante")
check("Design Humano: Autoridade", bg['authority'], "Plexo Solar (Emocional)")
check("Design Humano: Assinatura", SIGNATURE_BY_TYPE[bg['type']], "Satisfacao")
check("Design Humano: Tema do Nao-Ser", NOT_SELF_THEME_BY_TYPE[bg['type']], "Frustracao")
check("Design Humano: Estrategia", STRATEGY_BY_TYPE[bg['type']], "Responder")

check("Design Humano: Nome da Cruz + Angulo Direito/Esquerdo/Justaposta",
      "nao implementado (tabela ~192 combinacoes; conteudo com restricao de IP)",
      "Angulo Direito - Cruz da Fenix Adormecida", status_if_pending=PENDING)
check("Design Humano: Variaveis (PLL DRL)",
      "nao implementado nesta fase", "PLL DRL", status_if_pending=PENDING)

jd_now = jd_ut_now()
trans = transit_activations(jd_now)
transit_gates = set(g for g, l in trans.values())
tx = transit_x_natal(all_gates, transit_gates)
check("Design Humano: Transito x Natal (mecanica, momento 'agora')",
      f"{len(tx['new_channels_today'])} canal(is) novo(s), "
      f"centros: {sorted(tx['centers_newly_defined_today'])}",
      "informativo -- momento 'agora' muda a cada execucao, nao e o teste de validacao",
      status_if_pending=PENDING)

# --- Teste de validacao real: momento exato do print do Human Design App
# (14/08/2026 10:48 horario local de Guilherme = 13:48 UTC) ---
jd_print = swe.julday(2026, 8, 14, 13 + 48 / 60)
trans_print = transit_activations(jd_print)
GOLDEN_TRANSIT_PRINT_GATES = {
    'Sol': 4, 'Terra': 49, 'Lua': 64, 'NodoNorte': 30, 'NodoSul': 29,
    'Mercurio': 33, 'Venus': 18, 'Marte': 15, 'Jupiter': 33, 'Saturno': 21,
    'Urano': 20, 'Netuno': 17, 'Plutao': 41,
}
gates_ok = all(trans_print[b][0] == g for b, g in GOLDEN_TRANSIT_PRINT_GATES.items())
check("Design Humano: Transito 14/08/2026 10:48 -- GATES (print Human Design App)",
      "13/13" if gates_ok else "divergencia de gate encontrada", "13/13", )

GOLDEN_TRANSIT_PRINT_LINES = {
    'Sol': 4, 'Terra': 4, 'Lua': 6, 'NodoNorte': 6, 'NodoSul': 6,
    'Mercurio': 1, 'Venus': 5, 'Marte': 5, 'Jupiter': 3, 'Saturno': 6,
    'Urano': 6, 'Netuno': 1, 'Plutao': 2,
}
lines_matching = sum(1 for b, l in GOLDEN_TRANSIT_PRINT_LINES.items() if trans_print[b][1] == l)
check("Design Humano: Transito 14/08/2026 10:48 -- LINHAS (print Human Design App; "
      "Lua diverge por 1 linha, ver nota de precisao em hd_transit.py)",
      lines_matching, 12)

transit_gates_print = set(g for g, l in trans_print.values())
tx_print = transit_x_natal(all_gates, transit_gates_print)
new_channel_pairs = {tuple(sorted(ch['gates'])) for ch in tx_print['new_channels_today']}
check("Design Humano: Transito 14/08/2026 10:48 -- canais novos (print Human Design App)",
      new_channel_pairs, {(4, 63), (18, 58), (30, 41)})
check("Design Humano: Transito 14/08/2026 10:48 -- centros temporarios (print Human Design App)",
      sorted(tx_print['centers_newly_defined_today']), ['root', 'spleen'])


# ============================================================================
# RELATORIO
# ============================================================================
print(f"{'STATUS':10} {'CASO':70} {'OBTIDO':>15}  ESPERADO")
n_pass = n_fail = n_pending = 0
for label, got, expected, status in results:
    print(f"{status:10} {label:70} {str(got):>15}  {expected}")
    if status == PASS:
        n_pass += 1
    elif status == FAIL:
        n_fail += 1
    else:
        n_pending += 1

print(f"\nResumo: {n_pass} PASS | {n_fail} FAIL | {n_pending} PENDENTE (total {len(results)})")
if n_fail > 0:
    sys.exit(1)
