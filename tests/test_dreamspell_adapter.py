"""
Teste de conclusao da Etapa 7: o DreamspellAdapter reproduz os mesmos
valores do Golden Profile de Guilherme, e horizontes nao suportados
(ano/mes) levantam HorizonteNaoSuportado em vez de inventar dado.
"""
import datetime

from app.adapters.base import HorizonteNaoSuportado, ParticipanteInput
from app.adapters.dreamspell_adapter import DreamspellAdapter

GUILHERME = ParticipanteInput(
    nome_completo_nascimento="Guilherme Moreira dos Santos",
    data_nascimento=datetime.date(1988, 8, 25),
    hora_nascimento=datetime.time(0, 40),
    timezone_nascimento="America/Sao_Paulo",
    timezone_atual="America/Sao_Paulo",
    latitude=-29.95,
    longitude=-51.09,
)


def main():
    adapter = DreamspellAdapter()
    n_pass = n_fail = 0

    def check(label, obtido, esperado):
        nonlocal n_pass, n_fail
        ok = obtido == esperado
        n_pass += ok
        n_fail += not ok
        print(f"{'PASS' if ok else 'FAIL':6} {label:40} obtido={obtido!r:20} esperado={esperado!r}")

    pessoa = adapter.compute_pessoa(GUILHERME)
    check("pessoa.kin", pessoa["kin"], 169)
    check("pessoa.selo", pessoa["selo"], "Lua")
    check("pessoa.selo_cor", pessoa["selo_cor"], "Vermelho")
    check("pessoa.tom_numero", pessoa["tom_numero"], 13)
    check("pessoa.tom", pessoa["tom"], "Cosmico")
    check("pessoa.onda_selo", pessoa["onda_selo"], "Terra")
    check("pessoa.onda_cor", pessoa["onda_cor"], "Vermelho")

    hoje = adapter.compute_horizonte(GUILHERME, "hoje", datetime.date(1988, 8, 25))
    check("horizonte.hoje.kin (mesma data do natal)", hoje["kin"], 169)

    semana = adapter.compute_horizonte(GUILHERME, "semana", datetime.date(1988, 8, 25))
    print(f"INFO   horizonte.semana (contendo 25/08/1988) = {semana}")
    assert len(semana["dias"]) == 7

    try:
        adapter.compute_horizonte(GUILHERME, "ano", datetime.date(2026, 8, 14))
        print("FAIL   horizonte.ano deveria levantar HorizonteNaoSuportado")
        n_fail += 1
    except HorizonteNaoSuportado:
        print("PASS   horizonte.ano levanta HorizonteNaoSuportado (correto -- nao implementado)")
        n_pass += 1

    try:
        adapter.compute_horizonte(GUILHERME, "mes", datetime.date(2026, 8, 14))
        print("FAIL   horizonte.mes deveria levantar HorizonteNaoSuportado")
        n_fail += 1
    except HorizonteNaoSuportado:
        print("PASS   horizonte.mes levanta HorizonteNaoSuportado (correto -- nao implementado)")
        n_pass += 1

    print(f"\nResumo Etapa 7 (Dreamspell): {n_pass} PASS | {n_fail} FAIL")
    if n_fail:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
