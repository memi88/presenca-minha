"""
Teste de conclusao da Etapa 8: o HumanDesignAdapter reproduz o mapa natal
do Golden Profile de Guilherme, gera fotografias para Mes/Semana/Hoje sem
erro, e levanta HorizonteNaoSuportado para Ano (decisao final registrada
em ENGINE_VALIDATION.md -- sem metodologia propria adotada).
"""
import datetime

from app.adapters.base import HorizonteNaoSuportado, ParticipanteInput
from app.adapters.human_design_adapter import HumanDesignAdapter

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
    adapter = HumanDesignAdapter()
    n_pass = n_fail = 0

    def check(label, obtido, esperado):
        nonlocal n_pass, n_fail
        ok = obtido == esperado
        n_pass += ok
        n_fail += not ok
        print(f"{'PASS' if ok else 'FAIL':6} {label:40} obtido={obtido!r:24} esperado={esperado!r}")

    pessoa = adapter.compute_pessoa(GUILHERME)
    check("pessoa.perfil", pessoa["perfil"], "3/5")
    check("pessoa.portas_da_cruz", pessoa["portas_da_cruz"], "59/55 | 20/34")
    check("pessoa.tipo", pessoa["tipo"], "Gerador Manifestante")
    check("pessoa.autoridade", pessoa["autoridade"], "Plexo Solar (Emocional)")
    check("pessoa.definicao", pessoa["definicao"], "Bipartida")
    check("pessoa.ativacoes_personalidade.Sol", tuple(pessoa["ativacoes_personalidade"]["Sol"]), (59, 3))
    check("pessoa.ativacoes_design.Sol", tuple(pessoa["ativacoes_design"]["Sol"]), (20, 5))
    # ENGINE_VALIDATION.md secao 3.3: 2 grupos -- {Ajna, Cabeca} e
    # {G, Garganta, Sacral, Plexo Solar} -- 6 centros definidos no total.
    check("pessoa.centros_definidos (qtd)", len(pessoa["centros_definidos"]), 6)
    check("pessoa.canais_definidos (qtd)", len(pessoa["canais_definidos"]), 5)

    hoje = adapter.compute_horizonte(GUILHERME, "hoje", datetime.date(2026, 8, 14))
    print(f"INFO   horizonte.hoje.gates_transito = {hoje['gates_transito']}")
    check("horizonte.hoje tem 12 gates de transito", len(hoje["gates_transito"]), 12)

    mes = adapter.compute_horizonte(GUILHERME, "mes", datetime.date(2026, 8, 14))
    check("horizonte.mes.mes_referencia", mes["mes_referencia"], "2026-08")
    print(f"INFO   horizonte.mes.gates_transito = {mes['gates_transito']}")

    semana = adapter.compute_horizonte(GUILHERME, "semana", datetime.date(2026, 8, 14))
    print(f"INFO   horizonte.semana.gates_transito (uniao 7 dias) = {semana['gates_transito']}")
    check("horizonte.semana uniao >= horizonte.hoje isolado", len(semana["gates_transito"]) >= len(hoje["gates_transito"]), True)

    try:
        adapter.compute_horizonte(GUILHERME, "ano", datetime.date(2026, 8, 14))
        print("FAIL   horizonte.ano deveria levantar HorizonteNaoSuportado")
        n_fail += 1
    except HorizonteNaoSuportado:
        print("PASS   horizonte.ano levanta HorizonteNaoSuportado (correto -- Retorno Solar nao adotado)")
        n_pass += 1

    print(f"\nResumo Etapa 8 (Design Humano): {n_pass} PASS | {n_fail} FAIL")
    if n_fail:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
