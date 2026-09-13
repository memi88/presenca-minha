"""
A3 (CLAUDE.md secao 5) -- biblioteca de conteudo curado Dreamspell: 20
Selos, 13 Tons, Onda Encantada. Oraculo fica FORA do escopo da A3 (pendencia
de validacao propria -- ver CLAUDE.md secao 9, "nao usar Oraculo enquanto
nao estiver no mesmo padrao de validacao do Gate 0").

Este teste nao faz seed de nada novo -- ele CONFIRMA que a biblioteca ja
esta completa a partir de dois artefatos ja existentes antes desta etapa:
  - scripts/seed_base_conhecimento_dreamspell.py (Etapa 7): 20 Selos + 13
    Tons ja escritos e seedados em base_conhecimento.
  - full_reading() (app/engines/dreamspell_engine.py): Onda Encantada e
    representada como o Selo que abre o bloco de 13 Kins (wavespell_seal),
    que e SEMPRE um dos mesmos 20 Selos -- entao a "biblioteca de Onda" nao
    precisa de conteudo proprio, ela e coberta pela tabela de Selo por
    construcao (nao por coincidencia -- provado abaixo para os 260 Kins).
"""
from app.db.models import BaseConhecimento
from app.db.session import get_session
from app.engines.dreamspell_engine import SEALS, full_reading
from app.knowledge import buscar_conhecimento


def main():
    session = get_session()
    n_pass = n_fail = 0

    def check(label, cond):
        nonlocal n_pass, n_fail
        n_pass += bool(cond)
        n_fail += not cond
        print(f"{'PASS' if cond else 'FAIL':6} {label}")

    try:
        # --- 20 Selos -----------------------------------------------------
        faltando_selo = [s for s in SEALS if buscar_conhecimento(session, "dreamspell", "selo", s) is None]
        check(f"Todos os 20 Selos tem conteudo curado (faltando: {faltando_selo})", not faltando_selo)

        # --- 13 Tons --------------------------------------------------------
        faltando_tom = [
            i + 1 for i in range(13)
            if buscar_conhecimento(session, "dreamspell", "tom", str(i + 1)) is None
        ]
        check(f"Todos os 13 Tons tem conteudo curado (faltando: {faltando_tom})", not faltando_tom)

        # --- Onda Encantada: os 20 Selos que podem abrir uma onda cobrem  --
        # exatamente o mesmo conjunto de 20 Selos, para os 260 Kins inteiros.
        ondas = {full_reading(kin).wavespell_seal for kin in range(1, 261)}
        check("Existem exatamente 20 Selos-de-abertura de onda possiveis (os mesmos 20 Selos)",
              ondas == set(SEALS))
        faltando_onda = [o for o in ondas if buscar_conhecimento(session, "dreamspell", "selo", o) is None]
        check(f"Todo Selo-de-abertura de Onda tem conteudo curado via a tabela de Selo (faltando: {faltando_onda})",
              not faltando_onda)

        # --- Oraculo: confirmando que continua deliberadamente ausente ----
        oraculo_rows = (
            session.query(BaseConhecimento)
            .filter_by(sistema="dreamspell", tipo_elemento="oraculo")
            .count()
        )
        check("Nenhum conteudo de Oraculo seedado (fica como pendencia de validacao propria, fora da A3)",
              oraculo_rows == 0)

        print(f"\nResumo A3 (biblioteca Dreamspell): {n_pass} PASS | {n_fail} FAIL")
        if n_fail:
            raise SystemExit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()
