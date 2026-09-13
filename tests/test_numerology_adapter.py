"""
Teste de conclusao da Etapa 2: o NumerologyAdapter (nao mais o engine cru)
reproduz os mesmos valores do Golden Profile de Guilherme.
"""
import datetime

from app.adapters.base import ParticipanteInput
from app.adapters.numerology_adapter import NumerologyAdapter

GUILHERME = ParticipanteInput(
    nome_completo_nascimento="Guilherme Moreira dos Santos",
    data_nascimento=datetime.date(1988, 8, 25),
    hora_nascimento=datetime.time(0, 40),
    timezone_nascimento="America/Sao_Paulo",
    timezone_atual="America/Sao_Paulo",
    latitude=-29.95,
    longitude=-51.09,
)

EXPECTED_PESSOA = {
    "dia_natalicio": 25,
    "numero_psiquico": 7,
    "motivacao": 1,
    "impressao": 2,
    "expressao": 3,
    "destino": 5,
    "missao": 8,
    "licoes_carmicas": [8, 9],
    "tendencias_ocultas": [1, 3, 4, 5],
    "resposta_subconsciente": 7,
    "ciclos_de_vida": [8, 7, 8],
    "desafios": [1, 1, 0],
    "momentos_decisivos": [6, 6, 3, 7],
}


def main():
    adapter = NumerologyAdapter()
    n_pass = n_fail = 0

    pessoa = adapter.compute_pessoa(GUILHERME)
    for campo, esperado in EXPECTED_PESSOA.items():
        obtido = pessoa[campo]
        ok = obtido == esperado
        n_pass += ok
        n_fail += not ok
        print(f"{'PASS' if ok else 'FAIL':6} pessoa.{campo:24} obtido={obtido!r:20} esperado={esperado!r}")

    # Horizontes -- mesmos casos de referencia do engine cru (test_golden_profile.py),
    # agora passando pelo adapter com data_referencia explicita.
    mp_antes = adapter.compute_horizonte(GUILHERME, "mes", datetime.date(2026, 8, 24))["mes_pessoal"]
    mp_depois = adapter.compute_horizonte(GUILHERME, "mes", datetime.date(2026, 8, 25))["mes_pessoal"]
    for label, obtido, esperado in [
        ("mes (24/08/2026, antes do aniversario)", mp_antes, 5),
        ("mes (25/08/2026, dia do aniversario)", mp_depois, 6),
    ]:
        ok = obtido == esperado
        n_pass += ok
        n_fail += not ok
        print(f"{'PASS' if ok else 'FAIL':6} horizonte.{label:38} obtido={obtido!r:6} esperado={esperado!r}")

    hoje = adapter.compute_horizonte(GUILHERME, "hoje", datetime.date(2026, 8, 14))
    print(f"INFO   horizonte.hoje (14/08/2026) = {hoje}")

    semana = adapter.compute_horizonte(GUILHERME, "semana", datetime.date(2026, 8, 14))
    print(f"INFO   horizonte.semana (contendo 14/08/2026) = {semana}")
    assert len(semana["dias_pessoais"]) == 7
    assert semana["semana_inicio"] == "2026-08-10"  # segunda-feira daquela semana
    assert semana["semana_fim"] == "2026-08-16"      # domingo

    ano = adapter.compute_horizonte(GUILHERME, "ano", datetime.date(2026, 8, 14))
    print(f"INFO   horizonte.ano (14/08/2026) = {ano}")

    print(f"\nResumo Etapa 2: {n_pass} PASS | {n_fail} FAIL")
    if n_fail:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
