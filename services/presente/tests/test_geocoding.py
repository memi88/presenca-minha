"""
Autocomplete de cidade no /cadastro (app/geocoding.py + rota GET
/api/geocode). Roda 100% contra um httpx.get FALSO -- NUNCA bate no
Nominatim de verdade na suite automatizada (o mesmo padrao de
routes_experiencia.GPT56SolClient monkeypatched em test_a6_presente.py:
troca a referencia no modulo, restaura no finally).
"""
import app.geocoding as geocoding
from app.auth import COOKIE_NAME, COOKIE_SENHA_OK, criar_cookie_senha_ok, criar_cookie_sessao
from app.main import app
from fastapi.testclient import TestClient


class _RespostaFalsa:
    def __init__(self, dados, status_code=200):
        self._dados = dados
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise geocoding.httpx.HTTPStatusError("erro", request=None, response=self)

    def json(self):
        return self._dados


NOMINATIM_PORTO_ALEGRE = [
    {"display_name": "Porto Alegre, Rio Grande do Sul, Brasil", "lat": "-30.0346", "lon": "-51.2177"},
    {"display_name": "Porto Alegre, Zambézia, Moçambique", "lat": "-17.75", "lon": "35.4"},
]


def main():
    n_pass = n_fail = 0

    def check(label, cond):
        nonlocal n_pass, n_fail
        n_pass += bool(cond)
        n_fail += not cond
        print(f"{'PASS' if cond else 'FAIL':6} {label}")

    get_original = geocoding.httpx.get

    try:
        # --- 1. Termo curto demais -> lista vazia, SEM chamar a rede ---------
        chamou_rede = {"n": 0}

        def _get_nao_deveria_ser_chamado(*a, **kw):
            chamou_rede["n"] += 1
            raise AssertionError("httpx.get nao deveria ter sido chamado")

        geocoding.httpx.get = _get_nao_deveria_ser_chamado
        resultado_curto = geocoding.buscar_cidades("Po")
        check("Termo < 3 chars -> lista vazia", resultado_curto == [])
        check("Termo < 3 chars -> NENHUMA chamada de rede", chamou_rede["n"] == 0)

        # --- 2. Resposta normal do Nominatim -> parseada + fuso calculado ----
        geocoding.httpx.get = lambda *a, **kw: _RespostaFalsa(NOMINATIM_PORTO_ALEGRE)
        resultados = geocoding.buscar_cidades("Porto Alegre")
        check("Resposta normal -> 2 resultados parseados", len(resultados) == 2)
        check("Resultado 1: nome_exibicao correto", resultados[0]["nome_exibicao"] == "Porto Alegre, Rio Grande do Sul, Brasil")
        check("Resultado 1: latitude/longitude viraram float", isinstance(resultados[0]["latitude"], float) and resultados[0]["latitude"] == -30.0346)
        check("Resultado 1: fuso calculado corretamente (America/Sao_Paulo)", resultados[0]["timezone"] == "America/Sao_Paulo")
        check("Resultado 2 (Moçambique): fuso diferente calculado (Africa/Maputo)", resultados[1]["timezone"] == "Africa/Maputo")

        # --- 3. Item malformado (sem lat/lon) -> pulado, nao quebra os outros -
        geocoding.httpx.get = lambda *a, **kw: _RespostaFalsa([
            {"display_name": "Lugar sem coordenadas"},
            NOMINATIM_PORTO_ALEGRE[0],
        ])
        resultados_parcial = geocoding.buscar_cidades("teste malformado")
        check("Item sem lat/lon é pulado, resto continua", len(resultados_parcial) == 1
              and resultados_parcial[0]["nome_exibicao"] == "Porto Alegre, Rio Grande do Sul, Brasil")

        # --- 4. Falha de rede -> lista vazia, SEM propagar exceção -----------
        def _get_com_erro(*a, **kw):
            raise geocoding.httpx.ConnectError("sem rede")

        geocoding.httpx.get = _get_com_erro
        resultado_erro = geocoding.buscar_cidades("qualquer coisa valida")
        check("Falha de rede -> lista vazia, sem exceção propagada", resultado_erro == [])

        # --- 5. Status HTTP de erro -> lista vazia ----------------------------
        geocoding.httpx.get = lambda *a, **kw: _RespostaFalsa([], status_code=503)
        resultado_503 = geocoding.buscar_cidades("qualquer coisa valida tambem")
        check("Status HTTP de erro (503) -> lista vazia, sem exceção propagada", resultado_503 == [])

        # --- 6. Rota /api/geocode -- acesso e formato ------------------------
        geocoding.httpx.get = lambda *a, **kw: _RespostaFalsa(NOMINATIM_PORTO_ALEGRE)

        cliente_sem_sessao = TestClient(app, follow_redirects=False)
        r_sem_sessao = cliente_sem_sessao.get("/api/geocode?q=Porto Alegre")
        check("GET /api/geocode SEM sessão nenhuma -> bounce pro /login (303)",
              r_sem_sessao.status_code == 303 and r_sem_sessao.headers["location"].startswith("/login"))

        cliente_senha_ok = TestClient(app, follow_redirects=False)
        cliente_senha_ok.cookies.set(COOKIE_SENHA_OK, criar_cookie_senha_ok())
        r_senha_ok = cliente_senha_ok.get("/api/geocode?q=Porto Alegre")
        check("GET /api/geocode com só senha_ok (bootstrap, sem identidade ainda) -> 200",
              r_senha_ok.status_code == 200)
        check("Resposta tem a chave 'resultados' com 2 itens",
              len(r_senha_ok.json().get("resultados", [])) == 2)

        cliente_sessao_completa = TestClient(app, follow_redirects=False)
        cliente_sessao_completa.cookies.set(COOKIE_NAME, criar_cookie_sessao("qualquer-participante"))
        r_sessao_completa = cliente_sessao_completa.get("/api/geocode?q=Porto Alegre")
        check("GET /api/geocode com sessão completa -> 200 também", r_sessao_completa.status_code == 200)

        print(f"\nResumo (autocomplete de cidade): {n_pass} PASS | {n_fail} FAIL")
        if n_fail:
            raise SystemExit(1)
    finally:
        geocoding.httpx.get = get_original


if __name__ == "__main__":
    main()
