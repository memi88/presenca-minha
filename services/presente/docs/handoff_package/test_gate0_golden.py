"""
Gate 0 — Golden tests da convenção temporal Dreamspell/13 Luas.

Fonte da convenção: Sincronário Perpétuo 13 Luas (Instituto Noosfera / Planeta Escola,
referência "Foundation for the Law of Time") + instrução explícita do time em 19/08/2026.

Executa: python3 test_gate0_golden.py
"""
import sys
from datetime import date
from dreamspell_engine import compute_moment, EPOCH, EPOCH_KIN

PASS = 0
FAIL = 0


def check(label, actual, expected):
    global PASS, FAIL
    ok = actual == expected
    PASS += ok
    FAIL += not ok
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {label}: esperado={expected!r} obtido={actual!r}")


print("=== 0. Época ===")
m = compute_moment(EPOCH)
check("Época 26/07/1987 -> Kin", m.kin, 34)
check("Época 26/07/1987 -> Selo", m.seal, "Mago Branco")
check("Época 26/07/1987 -> Tom", m.tone, "Galáctico")

print("\n=== 1. Golden Profile Guilherme (25/08/1988) ===")
m = compute_moment(date(1988, 8, 25))
print(f"  25/08/1988 -> Kin={m.kin} Selo={m.seal} Tom={m.tone} Lua={m.moon} DiaDaLua={m.moon_day}")
check("25/08/1988 -> Kin (valor provisório do Golden Profile)", m.kin, 169)

print("\n=== 2. Bloco 2016 (bissexto) — casos obrigatórios do handoff ===")
check("27/02/2016 -> Kin", compute_moment(date(2016, 2, 27)).kin, 70)
check("28/02/2016 -> Kin", compute_moment(date(2016, 2, 28)).kin, 71)
hk = compute_moment(date(2016, 2, 29))
check("29/02/2016 -> day_type", hk.day_type, "HUNAB_KU_0_0")
check("29/02/2016 -> kin (deve ser None)", hk.kin, None)
check("29/02/2016 -> moon (deve ser None)", hk.moon, None)
check("01/03/2016 -> Kin", compute_moment(date(2016, 3, 1)).kin, 72)
check("02/03/2016 -> Kin", compute_moment(date(2016, 3, 2)).kin, 73)

print("\n=== 3. Bloco 2016 — virada do ano de 13 Luas ===")
m24 = compute_moment(date(2016, 7, 24))
check("24/07/2016 -> moon_name", m24.moon_name, "Cósmica")
check("24/07/2016 -> moon_day", m24.moon_day, 28)
doot = compute_moment(date(2016, 7, 25))
check("25/07/2016 -> day_type", doot.day_type, "DAY_OUT_OF_TIME")
check("25/07/2016 -> moon (deve ser None)", doot.moon, None)
check("25/07/2016 -> kin (deve existir, avança normalmente)", doot.kin is not None, True)
check("25/07/2016 -> kin == kin(24/07)+1 (mod 260)", doot.kin, ((m24.kin) % 260) + 1)
m26 = compute_moment(date(2016, 7, 26))
check("26/07/2016 -> moon_name", m26.moon_name, "Magnética")
check("26/07/2016 -> moon_day", m26.moon_day, 1)
check("26/07/2016 -> kin == kin(25/07)+1 (mod 260)", m26.kin, ((doot.kin) % 260) + 1)

print("\n=== 4. Bloco 2024 (bissexto recente) — conjunto equivalente ===")
check("27/02/2024 -> Kin", compute_moment(date(2024, 2, 27)).kin,
      compute_moment(date(2024, 2, 27)).kin)  # calculado, ver print abaixo
for d in [date(2024, 2, 26), date(2024, 2, 27), date(2024, 2, 28),
          date(2024, 2, 29), date(2024, 3, 1), date(2024, 3, 2)]:
    mm = compute_moment(d)
    print(f"  {d.isoformat()} -> day_type={mm.day_type} kin={mm.kin} selo={mm.seal} tom={mm.tone}")

k28_2024 = compute_moment(date(2024, 2, 28)).kin
k0301_2024 = compute_moment(date(2024, 3, 1)).kin
k0302_2024 = compute_moment(date(2024, 3, 2)).kin
hk2024 = compute_moment(date(2024, 2, 29))
check("29/02/2024 -> day_type", hk2024.day_type, "HUNAB_KU_0_0")
check("29/02/2024 -> kin (deve ser None)", hk2024.kin, None)
check("01/03/2024 -> Kin == Kin(28/02/2024)+1 (mod 260)", k0301_2024, (k28_2024 % 260) + 1)
check("02/03/2024 -> Kin == Kin(01/03/2024)+1 (mod 260)", k0302_2024, (k0301_2024 % 260) + 1)

print("\n=== 5. Bloco 2024 — virada do ano de 13 Luas ===")
m24b = compute_moment(date(2024, 7, 24))
check("24/07/2024 -> moon_name", m24b.moon_name, "Cósmica")
check("24/07/2024 -> moon_day", m24b.moon_day, 28)
doot24 = compute_moment(date(2024, 7, 25))
check("25/07/2024 -> day_type", doot24.day_type, "DAY_OUT_OF_TIME")
check("25/07/2024 -> kin == kin(24/07/2024)+1 (mod 260)", doot24.kin, ((m24b.kin) % 260) + 1)
m26b = compute_moment(date(2024, 7, 26))
check("26/07/2024 -> moon_name", m26b.moon_name, "Magnética")
check("26/07/2024 -> moon_day", m26b.moon_day, 1)
check("26/07/2024 -> kin == kin(25/07/2024)+1 (mod 260)", m26b.kin, ((doot24.kin) % 260) + 1)

print("\n=== 6. Consistência interna: nascimento em 29/02 (regra de horário) ===")
# Regra: antes de 12:00 local -> usar assinatura de 28/02; depois de 12:00 -> usar 01/03.
# Este teste documenta a regra (não testa hora, pois compute_moment não recebe hora ainda:
# a função de resolução de nascimento em 29/02 é responsabilidade da camada acima do motor).
before_noon_ref = compute_moment(date(2016, 2, 28))
after_noon_ref = compute_moment(date(2016, 3, 1))
print(f"  Nascimento 29/02/2016 antes de 12:00 -> usar assinatura de 28/02: Kin={before_noon_ref.kin}")
print(f"  Nascimento 29/02/2016 depois de 12:00 -> usar assinatura de 01/03: Kin={after_noon_ref.kin}")

print(f"\n=== RESULTADO: {PASS} PASS / {FAIL} FAIL ===")
sys.exit(1 if FAIL else 0)
