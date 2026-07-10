from functools import lru_cache
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from .auth import exigir_chave

router = APIRouter()

MODELO = "intfloat/multilingual-e5-small"
DIMENSOES = 384

# multilingual-e5-small é assimétrico: o model card recomenda prefixar o
# texto com "query: " (algo que se busca) ou "passage: " (algo que se
# guarda pra ser encontrado depois). Conteúdo do Livro Vivo e entradas do
# Caderno são sempre "passage" (documentos guardados); a busca semântica da
# Fase 7 vai chamar com tipo="query" pro texto do momento atual.
Tipo = Literal["passage", "query"]


@lru_cache(maxsize=1)
def _modelo():
    # Import tardio: torch/sentence-transformers são pesados pra carregar,
    # não precisam atrasar o boot do processo até a primeira chamada real
    # (main.py força essa chamada no startup, então na prática carrega uma
    # vez só, antes do primeiro request).
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODELO)


class EmbedRequest(BaseModel):
    texto: str = Field(min_length=1, max_length=8000)
    tipo: Tipo = "passage"


class EmbedResponse(BaseModel):
    embedding: list[float]
    dimensoes: int = DIMENSOES
    modelo: str = MODELO


@router.post("/embed", response_model=EmbedResponse, dependencies=[Depends(exigir_chave)])
def embed(body: EmbedRequest) -> EmbedResponse:
    texto_prefixado = f"{body.tipo}: {body.texto}"
    vetor = _modelo().encode(texto_prefixado, normalize_embeddings=True)
    return EmbedResponse(embedding=vetor.tolist())


def carregar_modelo_no_boot() -> None:
    """Chamado no startup do FastAPI para não pagar o custo de carregar o
    modelo na primeira requisição real (ver main.py)."""
    _modelo()
