"""
routes_cadastro.py

Tela /cadastro (Etapa 10, IMPLEMENTATION_PLAN.md secao 7 e secao 8 -- Etapa
10). Formulario utilitario, usado uma vez por participante -- nao segue
DESIGN_DIRECTION.md com o mesmo cuidado das telas de experiencia.

O cadastro dispara o calculo, nao e so armazenamento: ao submeter com
sucesso, roda compute_pessoa() dos tres adapters e gerar_horizonte() para
todos os horizontes que cada um suporta, na mesma operacao. Reaproveita
os adapters e a geracao de horizontes ja validados nas Etapas 2-3 e 6-8
-- nao e trabalho de engenharia novo, so um caminho de entrada de dados
diferente.

Redirecionamento pos-sucesso (revisado 19/08/2026 -- ver app/auth.py):
NAO vai mais direto pra /{novo}/pessoa -- isso vazaria os dados do
participante recem-criado pra quem quer que estivesse cadastrando (podia
ser a propria pessoa se auto-cadastrando, ou um admin cadastrando
outra pessoa; sao dois casos diferentes):
  - sem sessao completa ainda (so COOKIE_SENHA_OK -- caso comum de
    bootstrap ou autocadastro): manda pra /identidade, onde o
    participante recem-criado ja aparece na lista pra escolher.
  - com sessao completa de OUTRO participante (ex.: admin cadastrando
    Carlos enquanto logado como Guilherme): NAO troca a sessao nem entra
    nos dados do Carlos -- volta pra propria tela (/hoje) do admin.
"""
import datetime
import re
from zoneinfo import available_timezones

from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.status import HTTP_303_SEE_OTHER

from app.adapters.dreamspell_adapter import DreamspellAdapter
from app.adapters.human_design_adapter import HumanDesignAdapter
from app.adapters.numerology_adapter import NumerologyAdapter
from app.auth import COOKIE_NAME, participante_da_sessao
from app.db.models import Participante
from app.db.session import get_session
from app.geocoding import buscar_cidades
from app.horizons import gerar_todos_horizontes_suportados
from app.pessoa import (
    gerar_ou_obter_perfil_design_humano,
    gerar_ou_obter_perfil_dreamspell,
    gerar_ou_obter_perfil_numerologia,
)

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

TIMEZONES_VALIDAS = available_timezones()
NOME_REGEX = re.compile(r"^[a-z0-9-]+$")


def _formulario_vazio() -> dict:
    return {
        "nome": "", "nome_completo_nascimento": "", "data_nascimento": "",
        "hora_nascimento": "", "confiabilidade_hora": "alta",
        "local_nascimento_texto": "", "latitude": "", "longitude": "",
        "timezone_nascimento": "", "timezone_atual": "",
    }


@router.get("/cadastro", response_class=HTMLResponse)
def cadastro_form(request: Request):
    return templates.TemplateResponse(request, "cadastro.html", {"valores": _formulario_vazio(), "erro": None})


@router.get("/api/geocode")
def api_geocode(q: str = ""):
    """Autocomplete de cidade pro campo de nascimento -- ver
    app/geocoding.py. Mesmo nivel de acesso de /cadastro (ROTAS_SO_SENHA
    em app/auth.py): so faz sentido ser chamado de dentro daquela tela."""
    return {"resultados": buscar_cidades(q)}


@router.post("/cadastro", response_class=HTMLResponse)
def cadastro_submit(
    request: Request,
    nome: str = Form(...),
    nome_completo_nascimento: str = Form(...),
    data_nascimento: str = Form(...),
    hora_nascimento: str = Form(...),
    confiabilidade_hora: str = Form(...),
    local_nascimento_texto: str = Form(...),
    latitude: str = Form(...),
    longitude: str = Form(...),
    timezone_nascimento: str = Form(...),
    timezone_atual: str = Form(...),
):
    valores = {
        "nome": nome.strip(), "nome_completo_nascimento": nome_completo_nascimento.strip(),
        "data_nascimento": data_nascimento, "hora_nascimento": hora_nascimento,
        "confiabilidade_hora": confiabilidade_hora, "local_nascimento_texto": local_nascimento_texto.strip(),
        "latitude": latitude, "longitude": longitude,
        "timezone_nascimento": timezone_nascimento.strip(), "timezone_atual": timezone_atual.strip(),
    }

    def erro(msg: str):
        return templates.TemplateResponse(request, "cadastro.html", {"valores": valores, "erro": msg}, status_code=400)

    nome_slug = valores["nome"].lower()
    if not NOME_REGEX.fullmatch(nome_slug):
        return erro("Nome de exibição só pode ter letras minúsculas sem acento, números e hífen — ex.: carlos, dani-silva.")
    if not valores["nome_completo_nascimento"] or not valores["local_nascimento_texto"]:
        return erro("Nome completo e local de nascimento são obrigatórios.")
    if confiabilidade_hora not in ("alta", "media", "baixa"):
        return erro("Confiabilidade da hora precisa ser alta, média ou baixa.")

    try:
        data_nasc = datetime.date.fromisoformat(data_nascimento)
    except ValueError:
        return erro("Data de nascimento inválida.")

    try:
        hora_str, minuto_str, *_ = hora_nascimento.split(":")
        hora_nasc = datetime.time(int(hora_str), int(minuto_str))
    except (ValueError, IndexError):
        return erro("Hora de nascimento inválida.")

    try:
        lat, lon = float(latitude), float(longitude)
    except ValueError:
        return erro("Latitude e longitude precisam ser números — ex.: -29.9511.")
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return erro("Latitude precisa estar entre -90 e 90; longitude, entre -180 e 180.")

    if valores["timezone_nascimento"] not in TIMEZONES_VALIDAS:
        return erro(f"Fuso horário de nascimento '{valores['timezone_nascimento']}' não é reconhecido — ex.: America/Sao_Paulo.")
    if valores["timezone_atual"] not in TIMEZONES_VALIDAS:
        return erro(f"Fuso horário atual '{valores['timezone_atual']}' não é reconhecido — ex.: America/Sao_Paulo.")

    session = get_session()
    try:
        if session.query(Participante).filter_by(nome=nome_slug).first():
            return erro(f"Já existe um participante cadastrado como '{nome_slug}'.")

        participante = Participante(
            nome=nome_slug,
            nome_completo_nascimento=valores["nome_completo_nascimento"],
            data_nascimento=data_nasc,
            hora_nascimento=hora_nasc,
            local_nascimento_texto=valores["local_nascimento_texto"],
            latitude=lat,
            longitude=lon,
            timezone_nascimento=valores["timezone_nascimento"],
            timezone_atual=valores["timezone_atual"],
            confiabilidade_hora=confiabilidade_hora,
        )
        session.add(participante)
        session.commit()
        session.refresh(participante)

        gerar_ou_obter_perfil_numerologia(session, participante, NumerologyAdapter())
        gerar_ou_obter_perfil_dreamspell(session, participante, DreamspellAdapter())
        gerar_ou_obter_perfil_design_humano(session, participante, HumanDesignAdapter())

        gerar_todos_horizontes_suportados(session, participante, NumerologyAdapter())
        gerar_todos_horizontes_suportados(session, participante, DreamspellAdapter())
        gerar_todos_horizontes_suportados(session, participante, HumanDesignAdapter())

        sessao_atual = participante_da_sessao(request.cookies.get(COOKIE_NAME))
        if sessao_atual is not None:
            # Ja havia sessao completa (ex.: admin cadastrando outra
            # pessoa) -- nao entra nos dados do recem-cadastrado, volta
            # pra propria tela.
            destino = f"/{sessao_atual}/hoje"
        else:
            # Bootstrap/autocadastro -- ainda sem identidade escolhida,
            # manda pra tela de escolha (o novo nome ja aparece la).
            destino = "/identidade"
        return RedirectResponse(url=destino, status_code=HTTP_303_SEE_OTHER)
    finally:
        session.close()
