"""
daily_moment.py

A2 (CLAUDE.md secao 5) -- contrato estavel/idempotente MomentoDiario
(`daily_moment`), com o corte de 03:00 no timezone_atual do participante
(app/adapters/base.py, snapshot_date_hoje()) e protecao real contra
corrida na escrita.

Sobre a protecao de corrida: o padrao ja existente em app/horizons.py e
app/pessoa.py (SELECT, se nao achar INSERT+commit) NAO e seguro sob
concorrencia -- dois requests simultaneos no primeiro acesso do dia podem
os dois passar pelo SELECT antes de qualquer um comitar, e o segundo
INSERT estoura a UniqueConstraint sem tratamento. Isso ja estava
sinalizado (ver ENGINE_VALIDATION.md e a nota do briefing da A2 sobre
daily_present). Aqui, na primeira camada nova desde entao, o commit e
protegido com try/except IntegrityError: quem perde a corrida faz
rollback e re-le a linha que o vencedor gravou, em vez de propagar o
erro ou duplicar.
"""
import datetime
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.adapters.base import snapshot_date_hoje
from app.db.models import MomentoDiario, Participante
from app.engines.dreamspell_engine import ENGINE_VERSION, momento_dreamspell


def _buscar(session: Session, participante_id: int, data_referencia: datetime.date) -> Optional[MomentoDiario]:
    return (
        session.query(MomentoDiario)
        .filter_by(participante_id=participante_id, data_referencia=data_referencia)
        .first()
    )


def obter_ou_criar_momento_diario(
    session: Session,
    participante: Participante,
    now: Optional[datetime.datetime] = None,
) -> MomentoDiario:
    """Retorna o MomentoDiario congelado do dia vigente (corte 03:00 em
    participante.timezone_atual). `now` e injetavel para teste (default:
    agora, em UTC) -- mesma convencao de gerar_horizonte()."""
    data_referencia = snapshot_date_hoje(participante.timezone_atual, now)

    existente = _buscar(session, participante.id, data_referencia)
    if existente is not None:
        return existente

    r = momento_dreamspell(data_referencia)
    linha = MomentoDiario(
        participante_id=participante.id,
        data_referencia=data_referencia,
        timezone_usado=participante.timezone_atual,
        kin=r.kin,
        selo=r.selo,
        selo_cor=r.selo_cor,
        tom=r.tom,
        tipo_dia=r.tipo_dia,
        lua=None,       # calendario de 13 Luas: NULL ate a A3 (ver models.py)
        dia_da_lua=None,
        versao_motor=ENGINE_VERSION,
    )
    session.add(linha)
    try:
        session.commit()
    except IntegrityError:
        # Outra transacao venceu a corrida e ja gravou a mesma
        # (participante_id, data_referencia) entre o SELECT acima e este
        # commit -- descarta esta tentativa e devolve a linha vencedora.
        session.rollback()
        existente = _buscar(session, participante.id, data_referencia)
        if existente is None:
            raise  # IntegrityError por outro motivo -- nao esconder
        return existente

    session.refresh(linha)
    return linha
