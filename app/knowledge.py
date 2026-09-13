"""
knowledge.py

Acesso a base_conhecimento (PRD_v0.1.md secao 8). Todo texto e escrito
pela equipe -- nunca copiado de NumWeb ou outra fonte comercial.

Chave de busca: (sistema, tipo_elemento, chave_elemento). Para Numerologia,
chave_elemento combina contexto:numero -- ex.: "dia_pessoal:11",
"destino:5" -- porque o mesmo numero tem sentido diferente em contextos
diferentes (Dia Pessoal 1 != Ano Pessoal 1 em escopo/amplitude, ver
EXPERIENCE_MODEL.md secao 4).
"""
from sqlalchemy.orm import Session

from app.db.models import BaseConhecimento


def buscar_conhecimento(session: Session, sistema: str, tipo_elemento: str, chave_elemento: str) -> BaseConhecimento | None:
    return (
        session.query(BaseConhecimento)
        .filter_by(sistema=sistema, tipo_elemento=tipo_elemento, chave_elemento=chave_elemento)
        .first()
    )
