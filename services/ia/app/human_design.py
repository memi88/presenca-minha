from datetime import date, time

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from .auth import exigir_chave
from .limiter import limiter

router = APIRouter()


class HumanDesignRequest(BaseModel):
    data_nascimento: date
    hora_nascimento: time | None = None
    local_nascimento: str | None = None


class HumanDesignResponse(BaseModel):
    pendente: bool = True
    motivo: str = (
        "Cálculo de Human Design pendente de decisão de biblioteca "
        "(human-design-py auto-hospedado vs. API paga — ver "
        "docs/presenca-checklist-desenvolvimento.md, Pendências externas)."
    )


@router.post("/human-design", response_model=HumanDesignResponse, dependencies=[Depends(exigir_chave)])
@limiter.limit("10/minute")
def human_design(request: Request, body: HumanDesignRequest) -> HumanDesignResponse:
    # STUB — não decide a biblioteca por conta própria. Aceita o formato de
    # entrada que o cálculo real vai precisar, pra quem chama não precisar
    # mudar nada quando a decisão sair do papel.
    return HumanDesignResponse()
