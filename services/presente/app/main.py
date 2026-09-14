"""
main.py

App FastAPI publicavel. Middleware de senha + identidade (Etapa 5,
revisado 19/08/2026 -- ver app/auth.py) + as paginas de experiencia
(Etapa 6/A6, ver app/routes_experiencia.py) + /cadastro (Etapa 10, ver
app/routes_cadastro.py).
"""
import html

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.status import HTTP_303_SEE_OTHER, HTTP_401_UNAUTHORIZED

from app.auth import (
    COOKIE_MAX_AGE,
    COOKIE_NAME,
    COOKIE_SENHA_OK,
    COOKIE_SENHA_OK_MAX_AGE,
    PREFIXOS_NAO_PARTICIPANTE,
    SenhaCompartilhadaMiddleware,
    criar_cookie_senha_ok,
    criar_cookie_sessao,
    participante_da_sessao,
    senha_ok_valida,
)
from app.config import settings
from app.db.models import Participante
from app.db.session import get_session
from app.ponte_presenca.routes import router as router_ponte_presenca
from app.ponte_presenca.routes import router_personalizado as router_ponte_presenca_personalizado
from app.routes_cadastro import router as router_cadastro
from app.routes_experiencia import router as router_experiencia

app = FastAPI(title="presente")
app.add_middleware(SenhaCompartilhadaMiddleware)
app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.include_router(router_cadastro)
app.include_router(router_experiencia)
app.include_router(router_ponte_presenca)
app.include_router(router_ponte_presenca_personalizado)


def _next_seguro(next_url: str) -> str:
    """So aceita redirecionamento para um caminho relativo interno --
    evita open redirect (ex.: ?next=https://site-malicioso.com) e
    tambem serve de saneamento antes de embutir no HTML."""
    if next_url and next_url.startswith("/") and not next_url.startswith("//"):
        return next_url
    return "/"


def _next_para_participante(next_url: str, participante_nome: str) -> str:
    """Como _next_seguro, mas alem disso: se o destino apontar pra URL de
    OUTRO participante (ex.: alguem tentou acessar /carlos/presente sem
    sessao, foi mandado pro login, mas escolheu "guilherme" como
    identidade), redireciona pra propria tela em vez de honrar o next
    incompativel -- mesma regra que o middleware aplica depois, so que
    aqui evita o hop extra."""
    destino = _next_seguro(next_url)
    segmento = destino.strip("/").split("/", 1)[0]
    if segmento and segmento not in PREFIXOS_NAO_PARTICIPANTE and segmento != participante_nome:
        return f"/{participante_nome}/hoje"
    return destino


@app.get("/healthz")
def healthz():
    """Alvo do healthcheck do Railway. Deliberadamente NAO consulta o
    banco -- um soluço passageiro de conexão não deveria derrubar o
    container em loop de restart. Ver /  para uma verificação real de
    conectividade."""
    return {"status": "ok"}


def _pagina_login(next_url: str, erro: str = "") -> str:
    next_seguro = html.escape(_next_seguro(next_url), quote=True)
    erro_html = f'<p class="erro">{html.escape(erro)}</p>' if erro else ""
    return f"""<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>presente</title>
  <style>
    body {{ font-family: -apple-system, sans-serif; background: #f6f1e7; color: #2e2a24;
            display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; }}
    form {{ width: 100%; max-width: 320px; padding: 24px; }}
    h1 {{ font-size: 20px; margin: 0 0 20px; }}
    input {{ width: 100%; padding: 10px 12px; font-size: 16px; box-sizing: border-box;
             border: 1px solid #d8d0bd; border-radius: 8px; margin-bottom: 12px; }}
    button {{ width: 100%; padding: 10px; font-size: 15px; border: none; border-radius: 8px;
              background: #b5563a; color: white; cursor: pointer; }}
    .erro {{ color: #b5563a; font-size: 13px; margin: -4px 0 12px; }}
  </style>
</head>
<body>
  <form method="post" action="/login">
    <h1>presente</h1>
    {erro_html}
    <input type="hidden" name="next" value="{next_seguro}">
    <input type="password" name="senha" placeholder="Senha" autofocus required>
    <button type="submit">Entrar</button>
  </form>
</body>
</html>"""


@app.get("/login", response_class=HTMLResponse)
def login_form(next: str = "/"):
    return _pagina_login(next)


@app.post("/login")
def login_submit(senha: str = Form(...), next: str = Form("/")):
    if senha != settings.app_password:
        return HTMLResponse(_pagina_login(next, erro="Senha incorreta."), status_code=HTTP_401_UNAUTHORIZED)

    next_seguro = html.escape(_next_seguro(next), quote=True)
    resposta = RedirectResponse(url=f"/identidade?next={next_seguro}", status_code=HTTP_303_SEE_OTHER)
    resposta.set_cookie(
        COOKIE_SENHA_OK, criar_cookie_senha_ok(),
        max_age=COOKIE_SENHA_OK_MAX_AGE, httponly=True, samesite="lax",
    )
    return resposta


def _pagina_identidade(nomes: list[str], next_url: str, erro: str = "") -> str:
    next_seguro = html.escape(_next_seguro(next_url), quote=True)
    erro_html = f'<p class="erro">{html.escape(erro)}</p>' if erro else ""
    opcoes = "".join(
        f'<button type="submit" name="participante" value="{html.escape(n)}">{html.escape(n)}</button>'
        for n in nomes
    )
    return f"""<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>presente</title>
  <style>
    body {{ font-family: -apple-system, sans-serif; background: #f6f1e7; color: #2e2a24;
            display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; }}
    form {{ width: 100%; max-width: 320px; padding: 24px; display: flex; flex-direction: column; gap: 10px; }}
    h1 {{ font-size: 20px; margin: 0 0 4px; }}
    p.legenda {{ font-size: 13px; color: #7a7364; margin: 0 0 12px; }}
    button {{ width: 100%; padding: 12px; font-size: 15px; border: 1px solid #d8d0bd; border-radius: 8px;
              background: white; color: #2e2a24; cursor: pointer; text-align: left; }}
    button:hover {{ border-color: #b5563a; }}
    .erro {{ color: #b5563a; font-size: 13px; margin: -4px 0 12px; }}
  </style>
</head>
<body>
  <form method="post" action="/identidade">
    <h1>Quem é você?</h1>
    <p class="legenda">Senha certa — agora escolha seu nome na lista.</p>
    {erro_html}
    <input type="hidden" name="next" value="{next_seguro}">
    {opcoes}
  </form>
</body>
</html>"""


@app.get("/identidade", response_class=HTMLResponse)
def login_identidade_form(request: Request, next: str = "/"):
    if not senha_ok_valida(request.cookies.get(COOKIE_SENHA_OK)):
        next_seguro = html.escape(_next_seguro(next), quote=True)
        return RedirectResponse(url=f"/login?next={next_seguro}", status_code=HTTP_303_SEE_OTHER)

    session = get_session()
    try:
        nomes = [p.nome for p in session.query(Participante).order_by(Participante.nome).all()]
    finally:
        session.close()

    if not nomes:
        # Bootstrap: ninguem cadastrado ainda -- nao ha identidade pra
        # escolher. /cadastro aceita COOKIE_SENHA_OK sozinho (ver
        # app/auth.py, ROTAS_SO_SENHA) exatamente pra este caso.
        return RedirectResponse(url="/cadastro", status_code=HTTP_303_SEE_OTHER)

    return HTMLResponse(_pagina_identidade(nomes, next))


@app.post("/identidade")
def login_identidade_submit(request: Request, participante: str = Form(...), next: str = Form("/")):
    if not senha_ok_valida(request.cookies.get(COOKIE_SENHA_OK)):
        return RedirectResponse(url="/login", status_code=HTTP_303_SEE_OTHER)

    session = get_session()
    try:
        nomes = [p.nome for p in session.query(Participante).order_by(Participante.nome).all()]
    finally:
        session.close()

    if participante not in nomes:
        return HTMLResponse(
            _pagina_identidade(nomes, next, erro="Selecione um nome válido da lista."),
            status_code=HTTP_401_UNAUTHORIZED,
        )

    resposta = RedirectResponse(url=_next_para_participante(next, participante), status_code=HTTP_303_SEE_OTHER)
    resposta.set_cookie(
        COOKIE_NAME, criar_cookie_sessao(participante),
        max_age=COOKIE_MAX_AGE, httponly=True, samesite="lax",
    )
    resposta.delete_cookie(COOKIE_SENHA_OK)
    return resposta


@app.get("/logout")
def logout():
    resposta = RedirectResponse(url="/login", status_code=HTTP_303_SEE_OTHER)
    resposta.delete_cookie(COOKIE_NAME)
    resposta.delete_cookie(COOKIE_SENHA_OK)
    return resposta


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    """A0 (Etapa 10) redirecionava pro primeiro participante do banco --
    agora existe identidade de sessao (revisao pos-A6), entao / vai pra
    tela de quem esta logado. O middleware garante que so chega aqui
    quem tem sessao completa (com identidade) -- por isso nenhum branch
    de fallback e necessario aqui; sem identidade, o middleware ja teria
    redirecionado pro /login antes deste handler rodar.

    Porta de entrada e /hoje (revertido de /presente em 19/08/2026 --
    decisao de produto explicita, ver CLAUDE.md secao 3; nao e o mesmo
    "Hoje" documentado como excecao deliberada antes disso -- aquela
    excecao foi desfeita aqui). O card de destaque em /hoje (ver
    horizonte.html, .promo-presente) continua convidando pro Presente."""
    participante_nome = participante_da_sessao(request.cookies.get(COOKIE_NAME))
    return RedirectResponse(url=f"/{participante_nome}/hoje", status_code=HTTP_303_SEE_OTHER)
