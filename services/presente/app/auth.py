"""
auth.py

Middleware de senha compartilhada (IMPLEMENTATION_PLAN.md secao 1.2) +
selecao de identidade pos-login (revisao pos-A6, 19/08/2026 -- ver
CLAUDE.md secao 5): uma unica senha para o laboratorio inteiro, mas apos
validar a senha a pessoa escolhe QUEM ela e entre os participantes ja
cadastrados, e isso fica gravado no cookie de sessao assinado. Rotas
participante-escopadas (/{participante}/...) passam a exigir que o nome
na URL bata com a identidade da sessao -- antes disso, qualquer sessao
valida podia acessar os dados de qualquer participante so trocando o
segmento da URL (GAP achado em revisao da A6, registrado em
tests/test_a6_presente.py antes desta correcao).

Sem estado no servidor: os cookies sao tokens assinados por itsdangerous
(HMAC + timestamp), verificados a cada request. Nao ha tabela de sessoes,
nao ha senha/email por participante (essa e uma opcao maior, registrada
mas nao escolhida agora -- ver CLAUDE.md).

Dois cookies, dois momentos:
  COOKIE_SENHA_OK -- criado ao validar a senha compartilhada. Vida curta
    (10 min), so existe para atravessar a etapa de escolha de identidade.
  COOKIE_NAME -- sessao completa, criada so depois da escolha de
    identidade. Contem {"ok": True, "participante": "<nome>"}.
"""
from typing import Optional

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse

from app.config import settings

COOKIE_NAME = "presente_sessao"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 dias

COOKIE_SENHA_OK = "presente_senha_ok"
COOKIE_SENHA_OK_MAX_AGE = 60 * 10  # 10 min -- só o tempo de escolher a identidade

# Rotas acessiveis sem sessao nenhuma. /healthz e o alvo do healthcheck do
# Railway -- se exigisse senha, o Railway nunca marcaria o deploy como
# saudavel. /login e /identidade sao os dois passos do proprio fluxo.
# /api/publico/hoje-dreamspell (29/08/2026, app/ponte_presenca/) e a
# ponte de leitura pro Presenca (produto externo) -- publica por design,
# nao pertence a nenhum participante do Alpha, entao nao faz sentido
# exigir nem a senha compartilhada do laboratorio.
#
# /api/ponte-presenca/hoje-dreamspell-personalizado (P8) tambem precisa
# estar aqui pelo MESMO motivo -- e uma chamada servidor-a-servidor do
# Presenca, nunca vem com o cookie de sessao humana do Alpha. "Publica"
# so no sentido de que esse middleware nao a protege; a protecao real e
# o Bearer token verificado por exigir_chave() (app/ponte_presenca/auth.py),
# checado como Depends() dentro da propria rota.
ROTAS_PUBLICAS = {
    "/login",
    "/identidade",
    "/healthz",
    "/api/publico/hoje-dreamspell",
    "/api/ponte-presenca/hoje-dreamspell-personalizado",
}

# /cadastro aceita COOKIE_SENHA_OK (senha certa) OU sessao completa --
# registrar um novo participante nao e uma acao "de" nenhum participante
# especifico, e precisa ser alcancavel mesmo quando ZERO participantes
# existem ainda (bootstrap: sem isso, ninguem consegue escolher uma
# identidade porque a lista estaria vazia).
# /api/geocode e o autocomplete de cidade chamado de DENTRO de /cadastro
# (ver app/routes_cadastro.py) -- mesmo nivel de acesso, mesmo motivo.
ROTAS_SO_SENHA = {"/cadastro", "/api/geocode"}

# Primeiro segmento de path que NAO e um nome de participante -- usado
# pra decidir quando checar participante_nome == identidade da sessao.
PREFIXOS_NAO_PARTICIPANTE = {"", "static", "cadastro", "login", "logout", "healthz"}

_serializer = URLSafeTimedSerializer(settings.session_secret, salt="presente-auth")
_serializer_senha_ok = URLSafeTimedSerializer(settings.session_secret, salt="presente-auth-senha-ok")


def criar_cookie_senha_ok() -> str:
    return _serializer_senha_ok.dumps({"senha_ok": True})


def senha_ok_valida(token: Optional[str]) -> bool:
    if not token:
        return False
    try:
        _serializer_senha_ok.loads(token, max_age=COOKIE_SENHA_OK_MAX_AGE)
        return True
    except (BadSignature, SignatureExpired):
        return False


def criar_cookie_sessao(participante_nome: str) -> str:
    return _serializer.dumps({"ok": True, "participante": participante_nome})


def participante_da_sessao(token: Optional[str]) -> Optional[str]:
    """None se o token for invalido/expirado/ausente, ou se for um cookie
    do formato antigo (sem campo 'participante', pre-19/08/2026) -- nesse
    caso o usuario simplesmente refaz o login, sem crash."""
    if not token:
        return None
    try:
        dados = _serializer.loads(token, max_age=COOKIE_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None
    return dados.get("participante")


def sessao_valida(token: Optional[str]) -> bool:
    return participante_da_sessao(token) is not None


def _primeiro_segmento(path: str) -> str:
    return path.strip("/").split("/", 1)[0]


class SenhaCompartilhadaMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in ROTAS_PUBLICAS:
            return await call_next(request)

        participante_sessao = participante_da_sessao(request.cookies.get(COOKIE_NAME))

        if path in ROTAS_SO_SENHA:
            if participante_sessao is None and not senha_ok_valida(request.cookies.get(COOKIE_SENHA_OK)):
                return RedirectResponse(url=f"/login?next={path}", status_code=303)
            return await call_next(request)

        if participante_sessao is None:
            return RedirectResponse(url=f"/login?next={path}", status_code=303)

        segmento = _primeiro_segmento(path)
        if segmento and segmento not in PREFIXOS_NAO_PARTICIPANTE and segmento != participante_sessao:
            # Sessao valida, mas pedindo a URL de OUTRO participante --
            # devolve pra propria tela em vez de um 403 seco ou de
            # revelar se o outro nome existe.
            return RedirectResponse(url=f"/{participante_sessao}/hoje", status_code=303)

        return await call_next(request)
