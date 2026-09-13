"""
Gate 0 (CLAUDE.md secao 4/5, Etapa A1) -- auditoria do motor Dreamspell REAL
(app/engines/dreamspell_engine.py) contra a convencao de dias verdes fechada
em 19/08/2026 (ver docs/handoff_package/DREAMSPELL_CALENDAR_CONVENTION.md).

Adaptado de docs/handoff_package/test_gate0_golden.py: aquele arquivo importa
`compute_moment` de uma implementacao de referencia que nao existe no motor
real (kin_for_date/full_reading, sem conceito de day_type/lua/dia-da-lua).
Este arquivo testa o que o motor real de fato calcula -- a contagem de Kin --
e reporta como GAP (nao FAIL) o que esta fora do escopo atual do motor:
day_type explicito, calendario de 13 luas (ja documentado como NOT_IMPLEMENTED
em `docs/ENGINE_VALIDATION (1).md`) e a regra de assinatura de nascimento em
29/02 antes/depois de meio-dia (camada de perfil natal, nao do motor).
"""
import datetime

from app.engines.dreamspell_engine import (
    EPOCH,
    OFFICIAL_CONVENTION,
    full_reading,
    is_hunab_ku,
    kin_today_or_for,
    momento_dreamspell,
)


def main():
    n_pass = n_fail = n_gap = 0

    def check(label, obtido, esperado):
        nonlocal n_pass, n_fail
        ok = obtido == esperado
        n_pass += ok
        n_fail += not ok
        print(f"{'PASS' if ok else 'FAIL':6} {label:55} obtido={obtido!r:12} esperado={esperado!r}")

    def gap(label, motivo):
        nonlocal n_gap
        n_gap += 1
        print(f"GAP    {label:55} {motivo}")

    assert OFFICIAL_CONVENTION == {"skip_dft": False, "skip_leap": True}, (
        "Convencao oficial do motor divergiu do Gate 0 (skip_dft=False / skip_leap=True)."
    )

    print("=== 0. Epoca ===")
    kin = kin_today_or_for(EPOCH)
    check("Epoca 26/07/1987 -> Kin", kin, 34)
    r = full_reading(kin)
    check("Epoca 26/07/1987 -> Selo+cor", (r.seal, r.seal_color), ("Mago", "Branco"))
    check("Epoca 26/07/1987 -> Tom", r.tone, "Galactico")

    print("\n=== 1. Golden Profile Guilherme (25/08/1988) ===")
    check("25/08/1988 -> Kin", kin_today_or_for(datetime.date(1988, 8, 25)), 169)

    print("\n=== 2. Bloco 2016 (bissexto) -- Hunab Ku 0.0 nao tem Kin proprio ===")
    check("27/02/2016 -> Kin", kin_today_or_for(datetime.date(2016, 2, 27)), 70)
    check("28/02/2016 -> Kin", kin_today_or_for(datetime.date(2016, 2, 28)), 71)
    check("29/02/2016 -> Kin == None (corrigido 19/08/2026 -- antes devolvia 71, o Kin 'pausado')",
          kin_today_or_for(datetime.date(2016, 2, 29)), None)
    check("01/03/2016 -> Kin", kin_today_or_for(datetime.date(2016, 3, 1)), 72)
    check("02/03/2016 -> Kin", kin_today_or_for(datetime.date(2016, 3, 2)), 73)
    gap("29/02/2016 -> day_type como string (\"HUNAB_KU_0_0\")",
        "kin_today_or_for so retorna int|None -- o campo day_type explicito vive em momento_dreamspell()/tipo_dia_for()")

    print("\n=== 3. Bloco 2016 -- virada do ano de 13 luas (25/07 avanca o Kin) ===")
    k24 = kin_today_or_for(datetime.date(2016, 7, 24))
    k25 = kin_today_or_for(datetime.date(2016, 7, 25))
    k26 = kin_today_or_for(datetime.date(2016, 7, 26))
    check("25/07/2016 -> Kin == Kin(24/07)+1 (mod 260)", k25, (k24 % 260) + 1)
    check("26/07/2016 -> Kin == Kin(25/07)+1 (mod 260)", k26, (k25 % 260) + 1)
    gap("24/07 e 26/07 -> moon_name/moon_day", "calendario de 13 luas NOT_IMPLEMENTED (ver ENGINE_VALIDATION.md)")

    print("\n=== 4. Bloco 2024 (bissexto recente) ===")
    k28_2024 = kin_today_or_for(datetime.date(2024, 2, 28))
    k29_2024 = kin_today_or_for(datetime.date(2024, 2, 29))
    k0301_2024 = kin_today_or_for(datetime.date(2024, 3, 1))
    k0302_2024 = kin_today_or_for(datetime.date(2024, 3, 2))
    check("29/02/2024 -> Kin == None", k29_2024, None)
    check("01/03/2024 -> Kin == Kin(28/02)+1 (mod 260)", k0301_2024, (k28_2024 % 260) + 1)
    check("02/03/2024 -> Kin == Kin(01/03)+1 (mod 260)", k0302_2024, (k0301_2024 % 260) + 1)

    print("\n=== 5. Bloco 2024 -- virada do ano de 13 luas ===")
    k24b = kin_today_or_for(datetime.date(2024, 7, 24))
    k25b = kin_today_or_for(datetime.date(2024, 7, 25))
    k26b = kin_today_or_for(datetime.date(2024, 7, 26))
    check("25/07/2024 -> Kin == Kin(24/07)+1 (mod 260)", k25b, (k24b % 260) + 1)
    check("26/07/2024 -> Kin == Kin(25/07)+1 (mod 260)", k26b, (k25b % 260) + 1)

    gap(
        "nascimento em 29/02 antes/depois de 12:00 -> assinatura 28/02 vs 01/03",
        "nao implementado em nenhuma camada (motor, adapter ou pessoa.py) -- nenhum participante atual nasceu em 29/02, nao bloqueante",
    )

    print("\n=== 6. Correcao 19/08/2026 -- kin_today_or_for e momento_dreamspell nao podem mais divergir ===")
    # As duas funcoes compartilham agora a mesma checagem is_hunab_ku() --
    # este teste falha se algum dia alguem reintroduzir uma segunda
    # checagem de Hunab Ku em uma das duas funcoes (a causa raiz original
    # da divergencia corrigida nesta sessao).
    for d in [datetime.date(2016, 2, 29), datetime.date(2024, 2, 29), datetime.date(2016, 2, 28)]:
        check(f"is_hunab_ku({d.isoformat()}) concorda com kin_today_or_for is None",
              is_hunab_ku(d), kin_today_or_for(d) is None)
        check(f"kin_today_or_for({d.isoformat()}) == momento_dreamspell({d.isoformat()}).kin",
              kin_today_or_for(d), momento_dreamspell(d).kin)

    print(f"\n=== Gate 0 / A1 (motor real): {n_pass} PASS / {n_fail} FAIL / {n_gap} GAP ===")
    if n_fail:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
