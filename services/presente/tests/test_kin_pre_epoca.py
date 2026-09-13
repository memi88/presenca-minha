"""
Regressao do bug real de producao (19/08/2026): cadastro de um participante
nascido antes de EPOCH (26/07/1987) derrubava com 500 puro --
kin_for_date() levantava NotImplementedError sem tratamento em
app/adapters/dreamspell_adapter.py:_leitura_dia() -> compute_pessoa() ->
app/routes_cadastro.py:cadastro_submit(). Traceback real capturado nos
logs do Railway (deploy ff4d138f, 2026-08-19 22:45 BRT).

Corrigido estendendo kin_for_date() pra caminhar PRA TRAS a partir de
EPOCH quando target < EPOCH (ver docstring da funcao em
app/engines/dreamspell_engine.py pra derivacao da formula inversa).

Este arquivo cobre: a formula inversa em si (unidade), consistencia via
um oracle independente (bruteforce dia-a-dia sem reusar kin_for_date), e
o caminho end-to-end real que causou o 500 (cadastro_submit via TestClient).
"""
import datetime

from fastapi.testclient import TestClient

from app.auth import COOKIE_NAME, criar_cookie_sessao
from app.db.models import (
    ElementoCalculadoHorizonte,
    LeituraDiaria,
    MomentoDiario,
    Participante,
    PerfilNatalDesignHumano,
    PerfilNatalDreamspell,
    PerfilNatalNumerologia,
    ResultadoRelevancia,
)
from app.db.session import get_session
from app.engines.dreamspell_engine import (
    EPOCH,
    EPOCH_KIN,
    OFFICIAL_CONVENTION,
    is_hunab_ku,
    kin_for_date,
    kin_today_or_for,
)
from app.main import app

# Precisa bater com NOME_REGEX de app/routes_cadastro.py (so a-z0-9-,
# sem underscore) -- este teste exercita o endpoint HTTP real de
# /cadastro, entao o "nome" tem que ser um slug valido de verdade.
NOME_TESTE = "teste-kin-pre-epoca"


def _kin_bruteforce_forward(inicio: datetime.date, kin_inicio: int, alvo: datetime.date) -> int:
    """Oracle independente: caminha pra frente dia a dia de `inicio` ate
    `alvo`, reimplementando a regra de avanco (nao chama kin_for_date).
    Usado pra verificar kin_for_date() de fora, nao so contra ela mesma."""
    d, kin = inicio, kin_inicio
    one = datetime.timedelta(days=1)
    while d < alvo:
        d = d + one
        eh_dft = d.month == 7 and d.day == 25
        eh_hunab_ku = d.month == 2 and d.day == 29
        skip = (eh_dft and OFFICIAL_CONVENTION["skip_dft"]) or (eh_hunab_ku and OFFICIAL_CONVENTION["skip_leap"])
        if not skip:
            kin = kin % 260 + 1
    return kin


def main():
    n_pass = n_fail = 0

    def check(label, cond):
        nonlocal n_pass, n_fail
        n_pass += bool(cond)
        n_fail += not cond
        print(f"{'PASS' if cond else 'FAIL':6} {label}")

    # --- 1. EPOCH continua identico (comportamento existente preservado) ---
    check("kin_for_date(EPOCH) == EPOCH_KIN (34) -- inalterado",
          kin_for_date(EPOCH, **OFFICIAL_CONVENTION) == EPOCH_KIN == 34)

    # --- 2. Um dia antes de EPOCH e o proprio Dia Fora do Tempo (25/07/1987) --
    # skip_dft=False na convencao oficial -> DFT NAO e pulado -> kin avanca
    # normalmente ao longo dele -> kin_for_date(25/07) == EPOCH_KIN - 1 == 33.
    dia_anterior = EPOCH - datetime.timedelta(days=1)
    check("Um dia antes de EPOCH (25/07/1987, o proprio DFT) -> kin == 33",
          dia_anterior == datetime.date(1987, 7, 25)
          and kin_for_date(dia_anterior, **OFFICIAL_CONVENTION) == 33)

    # --- 3. Kin sempre em [1, 260], nunca crasha, pra datas bem anteriores ---
    datas_antigas = [
        datetime.date(1987, 1, 1),
        datetime.date(1980, 6, 15),
        datetime.date(1950, 12, 31),
        datetime.date(1900, 1, 1),
    ]
    for d in datas_antigas:
        k = kin_for_date(d, **OFFICIAL_CONVENTION)
        check(f"kin_for_date({d.isoformat()}) não crasha e fica em [1,260] (obtido {k})", 1 <= k <= 260)

    # --- 4. Oracle independente: bruteforce PRA FRENTE a partir de uma data --
    # antiga ate EPOCH tem que bater com kin_for_date(data_antiga) pro
    # mesmo par (data, kin) -- nao reusa a formula inversa, reimplementa
    # o passo-a-frente do zero.
    for d in datas_antigas:
        kin_calculado = kin_for_date(d, **OFFICIAL_CONVENTION)
        kin_reconstruido = _kin_bruteforce_forward(d, kin_calculado, EPOCH)
        check(f"Oracle bruteforce: caminhando de {d.isoformat()} (kin={kin_calculado}) pra frente até EPOCH -> kin=={EPOCH_KIN}",
              kin_reconstruido == EPOCH_KIN)

    # --- 5. Hunab Ku antes de EPOCH continua sem Kin proprio (kin_today_or_for) --
    hunab_ku_antigo = datetime.date(1984, 2, 29)
    check("29/02/1984 (antes de EPOCH) -> is_hunab_ku == True", is_hunab_ku(hunab_ku_antigo))
    check("29/02/1984 (antes de EPOCH) -> kin_today_or_for == None (sem Kin próprio)",
          kin_today_or_for(hunab_ku_antigo) is None)

    # --- 6. Ponta a ponta REAL: o bug original -- cadastrar alguem nascido --
    # antes de 1987 via POST /cadastro nao pode mais dar 500.
    session = get_session()
    participante_criado = None
    try:
        session.query(Participante).filter_by(nome=NOME_TESTE).delete()
        session.commit()

        cliente = TestClient(app, follow_redirects=False)
        cliente.cookies.set(COOKIE_NAME, criar_cookie_sessao("guilherme_admin_inexistente"))
        # Sessao "admin" nao existe de verdade -- middleware so precisa de
        # um cookie de sessao valido (assinado) apontando pra QUALQUER nome
        # pra liberar acesso a /cadastro (ROTAS_SO_SENHA aceita sessao
        # completa OU senha_ok; usamos sessao aqui pra simplificar o setup).
        resposta = cliente.post("/cadastro", data={
            "nome_completo_nascimento": "Teste Nascido Antes De 1987",
            "nome": NOME_TESTE,
            "data_nascimento": "1975-03-10",
            "hora_nascimento": "08:15",
            "confiabilidade_hora": "media",
            "local_nascimento_texto": "Porto Alegre, RS, Brasil",
            "latitude": "-30.0346",
            "longitude": "-51.2177",
            "timezone_nascimento": "America/Sao_Paulo",
            "timezone_atual": "America/Sao_Paulo",
        })
        check("POST /cadastro com nascimento antes de 1987 -> NÃO é mais 500 (bug original)",
              resposta.status_code != 500)
        check("POST /cadastro com nascimento antes de 1987 -> 303 (sucesso)",
              resposta.status_code == 303)

        participante_criado = session.query(Participante).filter_by(nome=NOME_TESTE).first()
        check("Participante foi de fato criado no banco", participante_criado is not None)
        if participante_criado is not None:
            perfil_ds = session.query(PerfilNatalDreamspell).filter_by(participante_id=participante_criado.id).first()
            check("Perfil natal Dreamspell foi calculado e gravado (sem crash)", perfil_ds is not None)
            if perfil_ds is not None:
                check("Kin natal calculado fica em [1,260]", 1 <= perfil_ds.kin <= 260)
    finally:
        if participante_criado is not None:
            pid = participante_criado.id
            session.query(LeituraDiaria).filter_by(participante_id=pid).delete()
            session.query(ResultadoRelevancia).filter_by(participante_id=pid).delete()
            session.query(MomentoDiario).filter_by(participante_id=pid).delete()
            session.query(ElementoCalculadoHorizonte).filter_by(participante_id=pid).delete()
            session.query(PerfilNatalNumerologia).filter_by(participante_id=pid).delete()
            session.query(PerfilNatalDreamspell).filter_by(participante_id=pid).delete()
            session.query(PerfilNatalDesignHumano).filter_by(participante_id=pid).delete()
            session.delete(participante_criado)
        session.commit()
        session.close()

    print(f"\nResumo (Kin pré-época): {n_pass} PASS | {n_fail} FAIL")
    if n_fail:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
