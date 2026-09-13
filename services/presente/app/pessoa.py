"""
pessoa.py

Persistencia do perfil natal (nivel "Pessoa" da hierarquia). Etapa 3 cobre
apenas Numerologia -- Dreamspell e Design Humano entram nas Etapas 7 e 8.

CRITERIO FORMALIZADO (ajuste pos-Etapa 3): a hierarquia conceitual
Pessoa -> Ano -> Mes -> Semana -> Hoje tem CINCO camadas, mas isso nunca
significou cinco linhas numa unica tabela. Pessoa e persistida aqui, em
perfil_natal_*  (uma linha por participante, calculada uma unica vez --
ver gerar_ou_obter_perfil_numerologia abaixo). Ano/Mes/Semana/Hoje sao
persistidos em elementos_calculados_horizonte (app/horizons.py), uma
linha por horizonte por chave_periodo. Sao propositalmente duas tabelas
distintas: o perfil natal e um fato imutavel do nascimento; os horizontes
sao fotografias que se congelam e recongelam ao longo do tempo (secao 5
do IMPLEMENTATION_PLAN.md). Nao ha, nem deveria haver, uma tabela unica
com "5 linhas".
"""
from sqlalchemy.orm import Session

from app.adapters.base import SistemaAdapter
from app.db.models import Participante, PerfilNatalDesignHumano, PerfilNatalDreamspell, PerfilNatalNumerologia
from app.horizons import to_participante_input


def gerar_ou_obter_perfil_numerologia(
    session: Session, participante: Participante, adapter: SistemaAdapter
) -> PerfilNatalNumerologia:
    """Perfil natal e calculado uma unica vez (PRD_v0.1.md secao 7.2) --
    se ja existir, retorna sem recalcular."""
    existente = (
        session.query(PerfilNatalNumerologia)
        .filter_by(participante_id=participante.id)
        .first()
    )
    if existente is not None:
        return existente

    dados = adapter.compute_pessoa(to_participante_input(participante))
    perfil = PerfilNatalNumerologia(participante_id=participante.id, **dados)
    session.add(perfil)
    session.commit()
    session.refresh(perfil)
    return perfil


def gerar_ou_obter_perfil_dreamspell(
    session: Session, participante: Participante, adapter: SistemaAdapter
) -> PerfilNatalDreamspell:
    existente = (
        session.query(PerfilNatalDreamspell)
        .filter_by(participante_id=participante.id)
        .first()
    )
    if existente is not None:
        return existente

    dados = adapter.compute_pessoa(to_participante_input(participante))
    perfil = PerfilNatalDreamspell(participante_id=participante.id, **dados)
    session.add(perfil)
    session.commit()
    session.refresh(perfil)
    return perfil


def gerar_ou_obter_perfil_design_humano(
    session: Session, participante: Participante, adapter: SistemaAdapter
) -> PerfilNatalDesignHumano:
    existente = (
        session.query(PerfilNatalDesignHumano)
        .filter_by(participante_id=participante.id)
        .first()
    )
    if existente is not None:
        return existente

    dados = adapter.compute_pessoa(to_participante_input(participante))
    perfil = PerfilNatalDesignHumano(participante_id=participante.id, **dados)
    session.add(perfil)
    session.commit()
    session.refresh(perfil)
    return perfil
