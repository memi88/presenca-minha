from datetime import date, time

from fastapi import APIRouter, Depends, Request
from geopy.exc import GeopyError
from pydantic import BaseModel

from .auth import exigir_chave
from .human_design_calc import calculate_chart, get_historical_offset, offset_from_coordinates
from .limiter import limiter

router = APIRouter()

# Fallback quando hora e/ou local de nascimento não foram informados (os
# dois são opcionais em /perfil/nascimento — "não sabe a hora? sem
# problema"). Meio-dia é neutro (não enviesa pro lado escuro/claro do
# dia); o fuso do público do piloto é majoritariamente Brasil.
HORA_FALLBACK = 12
MINUTO_FALLBACK = 0
OFFSET_FALLBACK = -3.0


class HumanDesignRequest(BaseModel):
    data_nascimento: date
    hora_nascimento: time | None = None
    local_nascimento: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class HumanDesignResponse(BaseModel):
    pendente: bool = False
    tipo: str
    perfil: str
    autoridade: str
    centros_definidos: list[str]
    centros_abertos: list[str]
    portoes_ativos: list[int]
    personalidade: dict
    design: dict
    horario_aproximado: bool
    local_aproximado: bool


@router.post("/human-design", response_model=HumanDesignResponse, dependencies=[Depends(exigir_chave)])
@limiter.limit("10/minute")
def human_design(request: Request, body: HumanDesignRequest) -> HumanDesignResponse:
    horario_aproximado = body.hora_nascimento is None
    hora = body.hora_nascimento.hour if body.hora_nascimento else HORA_FALLBACK
    minuto = body.hora_nascimento.minute if body.hora_nascimento else MINUTO_FALLBACK

    local_aproximado = False
    if body.latitude is not None and body.longitude is not None:
        # Coordenada exata (selecionada no autocomplete) — pula geocoding
        # por texto inteiramente, sem a ambiguidade de nomes de cidade
        # repetidos (mais rápido e mais preciso que o caminho por texto).
        try:
            utc_offset = offset_from_coordinates(
                body.latitude,
                body.longitude,
                body.data_nascimento.year,
                body.data_nascimento.month,
                body.data_nascimento.day,
                hora,
                minuto,
            )
        except ValueError:
            local_aproximado = True
            utc_offset = OFFSET_FALLBACK
    elif body.local_nascimento:
        try:
            utc_offset = get_historical_offset(
                body.local_nascimento,
                body.data_nascimento.year,
                body.data_nascimento.month,
                body.data_nascimento.day,
                hora,
                minuto,
            )
        except (ValueError, GeopyError):
            # ValueError = cidade não encontrada / fuso não resolvido.
            # GeopyError = falha do serviço de geocoding em si (timeout,
            # indisponibilidade, etc. — confirmado em teste real, não é
            # só teórico). Nos dois casos, cai no fuso padrão em vez de
            # recusar o cálculo inteiro.
            local_aproximado = True
            utc_offset = OFFSET_FALLBACK
    else:
        local_aproximado = True
        utc_offset = OFFSET_FALLBACK

    resultado = calculate_chart(
        birth_year=body.data_nascimento.year,
        birth_month=body.data_nascimento.month,
        birth_day=body.data_nascimento.day,
        birth_hour=hora,
        birth_minute=minuto,
        utc_offset=utc_offset,
    )

    return HumanDesignResponse(
        tipo=resultado["type"],
        perfil=resultado["profile"],
        autoridade=resultado["authority"],
        centros_definidos=resultado["defined_centers"],
        centros_abertos=resultado["undefined_centers"],
        portoes_ativos=resultado["all_active_gates"],
        personalidade=resultado["personality"],
        design=resultado["design"],
        horario_aproximado=horario_aproximado,
        local_aproximado=local_aproximado,
    )
