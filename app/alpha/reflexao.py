"""
reflexao.py

A7 (CLAUDE.md secao 5) -- fechamento do dia: registro livre, marcador
rapido, 8 perguntas de laboratorio (docs/handoff_package/
03_DAILY_EXPERIENCE.md secao 5). Publica/atualiza ReflexaoDiaria.

Duas regras centrais, as duas diferentes de LeituraDiaria (A5) de
proposito:
  1. Editavel enquanto data_referencia ainda for "hoje" (mesmo corte das
     03:00); congela na virada -- ver `salvar_reflexao_diaria()`.
  2. Escrever/atualizar reflexao NUNCA toca em LeituraDiaria -- as duas
     tabelas sao independentes, sem FK entre elas nem escrita cruzada.
     Nao ha import de app.alpha.interpretation aqui de proposito.
"""
import datetime
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.adapters.base import snapshot_date_hoje
from app.db.models import Participante, ReflexaoDiaria

MARCADOR_ECO = "ECO"
MARCADOR_PERCEPCAO_DIFERENTE = "PERCEPCAO_DIFERENTE"
MARCADOR_NADA_ESPECIAL = "NADA_ESPECIAL"
MARCADORES_VALIDOS = {MARCADOR_ECO, MARCADOR_PERCEPCAO_DIFERENTE, MARCADOR_NADA_ESPECIAL}


class ReflexaoJaCongelada(Exception):
    """Levantada quando a escrita tenta alvejar um data_referencia que
    nao e mais o dia corrente do participante (ja virou) -- o oposto do
    caso de LeituraDiaria, onde a imutabilidade e permanente desde a
    publicacao; aqui a mutabilidade e temporaria e some sozinha."""


class RespostasLaboratorioInvalidas(Exception):
    """Levantada quando respostas_laboratorio viola uma regra de
    consistencia interna -- ver validar_respostas_laboratorio()."""


def validar_respostas_laboratorio(respostas: dict) -> None:
    """practice_experience so faz sentido se a pessoa de fato fez a
    pratica (practice_done == 'sim'). Decisao registrada (briefing da
    A7): REJEITAR essa combinacao inconsistente, nao ignorar/zerar
    silenciosamente -- silenciar aqui esconderia um bug de cliente (UI
    mandando um campo que nao devia estar habilitado) atras de um dado
    que pareceria valido no banco."""
    practice_done = respostas.get("practice_done")
    practice_experience = respostas.get("practice_experience")
    if practice_experience is not None and practice_done != "sim":
        raise RespostasLaboratorioInvalidas(
            f"practice_experience ({practice_experience!r}) só é válido quando "
            f"practice_done == 'sim' (veio {practice_done!r})"
        )


def _buscar(session: Session, participante_id: int, data_referencia: datetime.date) -> Optional[ReflexaoDiaria]:
    return (
        session.query(ReflexaoDiaria)
        .filter_by(participante_id=participante_id, data_referencia=data_referencia)
        .first()
    )


def obter_reflexao_diaria(session: Session, participante: Participante, now: Optional[datetime.datetime] = None) -> Optional[ReflexaoDiaria]:
    """So leitura -- usada pra pre-preencher o formulario do dia
    corrente. Nao cria nada."""
    hoje = snapshot_date_hoje(participante.timezone_atual, now)
    return _buscar(session, participante.id, hoje)


def salvar_reflexao_diaria(
    session: Session,
    participante: Participante,
    data_referencia: datetime.date,
    *,
    texto_livre: Optional[str] = None,
    marcador_rapido: Optional[str] = None,
    respostas_laboratorio: Optional[dict] = None,
    now: Optional[datetime.datetime] = None,
) -> ReflexaoDiaria:
    """Cria (1a vez no dia) ou atualiza (mesmo dia, chamadas seguintes --
    sobrescreve, nao duplica) a ReflexaoDiaria. `data_referencia` e
    explicito (nao inferido silenciosamente) exatamente pra permitir essa
    checagem: se nao for o dia corrente do participante (segundo
    snapshot_date_hoje), rejeita com ReflexaoJaCongelada -- a rota HTTP
    sempre passa o "hoje" calculado no momento do request, mas a funcao
    em si nao confia cegamente nisso (defesa contra cliente desatualizado
    ou uso direto/teste)."""
    respostas_laboratorio = respostas_laboratorio or {}
    validar_respostas_laboratorio(respostas_laboratorio)

    if marcador_rapido is not None and marcador_rapido not in MARCADORES_VALIDOS:
        raise ValueError(f"marcador_rapido inválido: {marcador_rapido!r} (válidos: {sorted(MARCADORES_VALIDOS)})")

    hoje = snapshot_date_hoje(participante.timezone_atual, now)
    if data_referencia != hoje:
        raise ReflexaoJaCongelada(
            f"data_referencia {data_referencia.isoformat()} não é mais o dia corrente "
            f"({hoje.isoformat()}) para este participante -- a reflexão desse dia já congelou."
        )

    existente = _buscar(session, participante.id, data_referencia)
    if existente is not None:
        existente.texto_livre = texto_livre
        existente.marcador_rapido = marcador_rapido
        existente.respostas_laboratorio = respostas_laboratorio
        session.commit()
        session.refresh(existente)
        return existente

    linha = ReflexaoDiaria(
        participante_id=participante.id,
        data_referencia=data_referencia,
        texto_livre=texto_livre,
        marcador_rapido=marcador_rapido,
        respostas_laboratorio=respostas_laboratorio,
    )
    session.add(linha)
    try:
        session.commit()
    except IntegrityError:
        # Mesmo padrao de protecao real contra corrida da A2/A4 -- duas
        # escritas simultaneas no primeiro salvamento do dia, uma perde a
        # corrida no UniqueConstraint, refaz como update.
        session.rollback()
        existente = _buscar(session, participante.id, data_referencia)
        if existente is None:
            raise
        existente.texto_livre = texto_livre
        existente.marcador_rapido = marcador_rapido
        existente.respostas_laboratorio = respostas_laboratorio
        session.commit()
        session.refresh(existente)
        return existente

    session.refresh(linha)
    return linha
