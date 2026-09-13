"""
horizons.py

Geracao de horizontes + estrategia de cache/congelamento
(IMPLEMENTATION_PLAN.md secao 5):

    ao pedir gerar_horizonte(participante, sistema, horizonte, data_referencia):
      1. calcular chave_periodo usando participante.timezone_atual
      2. buscar linha existente com essa chave
      3. se existir -> retornar (fotografia congelada)
      4. se nao existir -> chamar adapter.compute_horizonte(), gravar
         (incluindo composition_status), retornar

Este modulo persiste APENAS as 4 camadas de horizonte (Ano/Mes/Semana/
Hoje) em elementos_calculados_horizonte. A camada Pessoa vive em tabela
separada (perfil_natal_*, ver app/pessoa.py) -- ver a nota de criterio
formalizado la para o raciocinio completo.
"""
import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.adapters.base import ParticipanteInput, SistemaAdapter, snapshot_date_hoje
from app.db.models import ElementoCalculadoHorizonte, Participante


def to_participante_input(p: Participante) -> ParticipanteInput:
    return ParticipanteInput(
        nome_completo_nascimento=p.nome_completo_nascimento,
        data_nascimento=p.data_nascimento,
        hora_nascimento=p.hora_nascimento,
        timezone_nascimento=p.timezone_nascimento,
        timezone_atual=p.timezone_atual,
        latitude=p.latitude,
        longitude=p.longitude,
    )


def gerar_horizonte(
    session: Session,
    participante: Participante,
    adapter: SistemaAdapter,
    horizonte: str,
    now: Optional[datetime.datetime] = None,
) -> ElementoCalculadoHorizonte:
    """Retorna a fotografia congelada do horizonte pedido, calculando e
    gravando apenas se ainda nao existir uma linha para a chave_periodo
    vigente. `now` e injetavel para teste (default: agora, em UTC).

    Levanta HorizonteNaoSuportado (nao NotImplementedError) se o sistema
    nao tem metodologia para este horizonte -- verificado ANTES de
    calcular chave_periodo, que para um horizonte nao suportado nem
    sempre esta implementada (ex.: Dreamspell nao define chave_periodo
    para Ano/Mes, porque esses horizontes simplesmente nao existem para
    esse sistema)."""
    status = adapter.composition_status_de(horizonte)  # levanta HorizonteNaoSuportado se aplicavel

    participante_input = to_participante_input(participante)
    data_referencia = snapshot_date_hoje(participante.timezone_atual, now)
    chave = adapter.chave_periodo(horizonte, participante_input, data_referencia)

    existente = (
        session.query(ElementoCalculadoHorizonte)
        .filter_by(
            participante_id=participante.id,
            sistema=adapter.sistema,
            horizonte=horizonte,
            chave_periodo=chave,
        )
        .first()
    )
    if existente is not None:
        return existente

    elementos = adapter.compute_horizonte(participante_input, horizonte, data_referencia)

    linha = ElementoCalculadoHorizonte(
        participante_id=participante.id,
        sistema=adapter.sistema,
        horizonte=horizonte,
        data_referencia=data_referencia,
        chave_periodo=chave,
        elementos_json=elementos,
        composition_status=status,
    )
    session.add(linha)
    session.commit()
    session.refresh(linha)
    return linha


def gerar_todos_horizontes_suportados(
    session: Session,
    participante: Participante,
    adapter: SistemaAdapter,
    now: Optional[datetime.datetime] = None,
) -> dict:
    """Gera (ou recupera do cache) todos os horizontes que o adapter
    suporta, na ordem Ano -> Mes -> Semana -> Hoje."""
    ordem = ["ano", "mes", "semana", "hoje"]
    resultado = {}
    for horizonte in ordem:
        if horizonte not in adapter.horizontes_suportados:
            continue
        resultado[horizonte] = gerar_horizonte(session, participante, adapter, horizonte, now)
    return resultado
