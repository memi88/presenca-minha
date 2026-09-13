"""
Suite dedicada a revisao de auth pos-A6 (19/08/2026, ver app/auth.py):
selecao de identidade pos-login + isolamento entre participantes.

Cobre o fluxo inteiro (senha -> escolha de identidade -> sessao completa)
e a checagem de mismatch em VARIAS rotas participante-escopadas (nao so
/presente, que ja tem seu proprio teste dedicado em
tests/test_a6_presente.py). Roda via TestClient, sem chamar GPT-5.6 Sol
(as rotas testadas aqui nao tocam o Interpretation Engine).

Nao testado aqui, por decisao deliberada: o caso de bootstrap com ZERO
participantes cadastrados (/identidade deveria redirecionar pra
/cadastro). Testar isso de verdade exigiria zerar a tabela participantes
do Postgres de desenvolvimento (que tem o Guilherme real) -- risco maior
que o valor do teste. A logica dessa branch e simples o suficiente
(`if not nomes: redirect pra /cadastro`) pra confiar na leitura de
codigo em vez de um teste de integracao que mexe em dado real.
"""
import datetime

from fastapi.testclient import TestClient

from app.auth import COOKIE_NAME, COOKIE_SENHA_OK, _serializer, criar_cookie_sessao, participante_da_sessao
from app.config import settings
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
from app.main import app

NOME_A = "_teste_auth_identidade_a"
NOME_B = "_teste_auth_identidade_b"


def _criar_participante(session, nome: str) -> Participante:
    p = session.query(Participante).filter_by(nome=nome).first()
    if p is not None:
        return p
    p = Participante(
        nome=nome, nome_completo_nascimento=f"Teste {nome}",
        data_nascimento=datetime.date(1990, 1, 1), hora_nascimento=datetime.time(10, 0),
        local_nascimento_texto="Teste, Teste", latitude=0.0, longitude=0.0,
        timezone_nascimento="America/Sao_Paulo", timezone_atual="America/Sao_Paulo",
        confiabilidade_hora="alta",
    )
    session.add(p)
    session.commit()
    session.refresh(p)
    return p


def main():
    n_pass = n_fail = 0

    def check(label, cond):
        nonlocal n_pass, n_fail
        n_pass += bool(cond)
        n_fail += not cond
        print(f"{'PASS' if cond else 'FAIL':6} {label}")

    session = get_session()
    a = b = None
    try:
        a = _criar_participante(session, NOME_A)
        b = _criar_participante(session, NOME_B)

        # --- 1. Fluxo completo: senha -> escolha de identidade -> sessao ---
        c = TestClient(app, follow_redirects=False)
        r1 = c.post("/login", data={"senha": settings.app_password, "next": f"/{NOME_A}/presente"})
        check("POST /login com senha certa -> 303 pra /identidade",
              r1.status_code == 303 and r1.headers["location"].startswith("/identidade"))
        check("Cookie senha_ok setado", COOKIE_SENHA_OK in c.cookies)
        check("Cookie de sessão completa AINDA não existe (identidade não escolhida)", COOKIE_NAME not in c.cookies)

        r2 = c.post("/identidade", data={"participante": NOME_A, "next": f"/{NOME_A}/presente"})
        check("POST /identidade com nome válido -> 303 pro destino pedido",
              r2.status_code == 303 and r2.headers["location"] == f"/{NOME_A}/presente")
        check("Cookie de sessão completa agora existe", COOKIE_NAME in c.cookies)
        check("Cookie de sessão codifica a identidade certa",
              participante_da_sessao(c.cookies.get(COOKIE_NAME)) == NOME_A)
        check("Cookie senha_ok foi apagado após a sessão completa existir", COOKIE_SENHA_OK not in c.cookies)

        r3 = c.get(f"/{NOME_A}/presente")
        check("Com sessão completa, GET na própria URL funciona (200)", r3.status_code == 200)

        # --- 2. Senha errada -------------------------------------------------
        c_senha_errada = TestClient(app, follow_redirects=False)
        r4 = c_senha_errada.post("/login", data={"senha": "senha-errada-com-certeza-123", "next": "/"})
        check("Senha errada -> 401, nenhum cookie de progresso setado",
              r4.status_code == 401 and COOKIE_SENHA_OK not in c_senha_errada.cookies)

        # --- 3. /identidade sem senha_ok válido -------------------------
        c_sem_senha_ok = TestClient(app, follow_redirects=False)
        r5 = c_sem_senha_ok.get("/identidade")
        check("GET /identidade sem senha_ok -> bounce pro /login",
              r5.status_code == 303 and r5.headers["location"].startswith("/login"))

        # --- 4. Escolher um nome que não existe -------------------------------
        c_nome_invalido = TestClient(app, follow_redirects=False)
        c_nome_invalido.post("/login", data={"senha": settings.app_password, "next": "/"})
        r6 = c_nome_invalido.post("/identidade", data={"participante": "nome-que-nao-existe-123", "next": "/"})
        check("Nome inválido na identidade -> 401, sem criar sessão completa",
              r6.status_code == 401 and COOKIE_NAME not in c_nome_invalido.cookies)

        # --- 5. Isolamento em VÁRIAS rotas participante-escopadas -------------
        c_isolamento = TestClient(app, follow_redirects=False)
        c_isolamento.cookies.set(COOKIE_NAME, criar_cookie_sessao(NOME_A))
        for rota in ["pessoa", "hoje", "ano", "mes", "semana", "presente"]:
            r = c_isolamento.get(f"/{NOME_B}/{rota}")
            check(f"Sessão de '{NOME_A}' pedindo /{NOME_B}/{rota} -> bloqueado (303, não 200)", r.status_code == 303)
            if r.status_code == 303:
                check(f"  ...redireciona pra própria tela, não pra do '{NOME_B}'",
                      r.headers.get("location") == f"/{NOME_A}/hoje")

        r_propria = c_isolamento.get(f"/{NOME_A}/pessoa")
        check("Mesma sessão acessando a PRÓPRIA URL continua funcionando (200)", r_propria.status_code == 200)

        # --- 6. Rotas não-participante-escopadas não são afetadas -------------
        r_cadastro = c_isolamento.get("/cadastro")
        check("/cadastro continua acessível normalmente com sessão completa", r_cadastro.status_code == 200)

        # --- 7. Cookie no formato antigo (pré-19/08/2026, sem "participante") -
        cookie_antigo = _serializer.dumps({"ok": True})  # formato usado antes desta revisão
        c_formato_antigo = TestClient(app, follow_redirects=False)
        c_formato_antigo.cookies.set(COOKIE_NAME, cookie_antigo)
        r7 = c_formato_antigo.get(f"/{NOME_A}/presente")
        check("Cookie de sessão do formato antigo (sem identidade) -> tratado como inválido, bounce pro /login",
              r7.status_code == 303 and r7.headers["location"].startswith("/login"))

        print(f"\nResumo (auth/identidade pós-A6): {n_pass} PASS | {n_fail} FAIL")
        if n_fail:
            raise SystemExit(1)
    finally:
        for p in (a, b):
            if p is not None:
                session.query(LeituraDiaria).filter_by(participante_id=p.id).delete()
                session.query(ResultadoRelevancia).filter_by(participante_id=p.id).delete()
                session.query(MomentoDiario).filter_by(participante_id=p.id).delete()
                session.query(ElementoCalculadoHorizonte).filter_by(participante_id=p.id).delete()
                session.query(PerfilNatalNumerologia).filter_by(participante_id=p.id).delete()
                session.query(PerfilNatalDreamspell).filter_by(participante_id=p.id).delete()
                session.query(PerfilNatalDesignHumano).filter_by(participante_id=p.id).delete()
                session.delete(session.query(Participante).filter_by(nome=p.nome).first())
        session.commit()
        session.close()


if __name__ == "__main__":
    main()
