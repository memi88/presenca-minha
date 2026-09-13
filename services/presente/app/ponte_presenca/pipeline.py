"""
pipeline.py

Ponte de leitura Dreamspell para o Presenca (produto externo, integracao
especificada do lado deles) -- nucleo puro (sem HTTP) do endpoint
generico GET /api/publico/hoje-dreamspell (ver
app/ponte_presenca/routes.py). Escopo desta etapa (pedido explicito do
time, 29/08/2026): SO o endpoint generico -- o personalizado
(POST /api/ponte-presenca/hoje-dreamspell-personalizado, recebendo
data_nascimento + exigindo API key servidor-a-servidor) fica documentado
no CLAUDE.md como proximo passo (P8 do lado do Presenca), sem codigo
ainda.

Reaproveita o NUCLEO PURO do pipeline do Alpha -- montar_payload_minimo()
e _rodar_pipeline_qa() (app/alpha/interpretation.py, esta ultima ja
extraida ali de proposito pra ser reutilizavel fora de
obter_ou_publicar_leitura_diaria(), ver docstring dela) -- mesmo QA/
guardrail/reescrita/fallback, mesma PROMPT_VERSION em producao. O que
NAO e reaproveitado, de proposito, e obter_ou_publicar_leitura_diaria()
em si: ela e fundida com Participante (chave do lock, FK de LeituraDiaria),
e esta leitura nao pertence a nenhum participante do Alpha.

Modelagem: publica em LeituraDiariaGenerica (app/db/models.py), tabela
PROPRIA, sem FK pra participantes/momentos_diarios/resultados_relevancia
-- nivel_relacao e SEMPRE NIVEL_NONE aqui (sem Selo natal pra comparar),
entao passamos pra montar_payload_minimo() um objeto leve (SimpleNamespace)
com o mesmo contrato de atributos de ResultadoRelevancia
(nivel_relacao/detalhe/versao_ruleset) em vez de uma linha real de banco
-- nao ha necessidade de uma ResultadoRelevancia de verdade so pra
carregar 3 valores fixos.

Timezone: fixado em TIMEZONE_PONTE_PRESENCA (America/Sao_Paulo), EXPLICITO
aqui -- NAO herdado de participante.timezone_atual (essa leitura nao tem
dono). Mesmo corte de 03:00 de snapshot_date_hoje() (app/adapters/base.py).

Concorrencia: mesmo padrao de obter_ou_publicar_leitura_diaria() --
pg_advisory_xact_lock ANTES de qualquer chamada ao modelo (quem perde a
corrida bloqueia sem gastar tokens, e ao destravar reencontra a linha ja
publicada), so que a chave do lock e por DIA (nao por participante+dia,
ver _chave_lock_generica abaixo)."""
import datetime
from types import SimpleNamespace
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.adapters.base import snapshot_date_hoje
from app.alpha.interpretation import (
    FALLBACK_PERGUNTA,
    FALLBACK_REFLEXAO,
    PROMPT_VERSION,
    STATUS_FIXED_HUNAB_KU,
    ModeloClient,
    _rodar_pipeline_qa,
    montar_payload_minimo,
)
from app.alpha.relevance import NIVEL_NONE, RULESET_VERSION
from app.db.models import LeituraDiariaGenerica
from app.engines.dreamspell_engine import ENGINE_VERSION, MomentoDreamspell, momento_dreamspell

TIMEZONE_PONTE_PRESENCA = "America/Sao_Paulo"

# Chave de pg_advisory_xact_lock desta ponte -- bigint assinado de 64 bits,
# mesmo esquema de _chave_lock() em app/alpha/interpretation.py
# (participante_id << 32 | ordinal da data), mas SEM participante: um
# prefixo fixo (bit 40 ligado) nos bits altos garante que esta chave nunca
# colide com nenhuma (participante_id << 32 | ordinal) real -- ordinal de
# data cabe em 32 bits, participante_id em producao fica na casa das
# unidades/dezenas, entao (participante_id << 32) nunca chega perto de
# 1 << 40.
_PREFIXO_LOCK_GENERICO = 1 << 40


def _chave_lock_generica(data_referencia: datetime.date) -> int:
    return _PREFIXO_LOCK_GENERICO | (data_referencia.toordinal() & 0xFFFFFFFF)


def _buscar(session: Session, data_referencia: datetime.date) -> Optional[LeituraDiariaGenerica]:
    return (
        session.query(LeituraDiariaGenerica)
        .filter_by(data_referencia=data_referencia)
        .first()
    )


def _payload_generico(session: Session, momento: MomentoDreamspell) -> dict:
    """resultado 'sem dono' -- nivel_relacao sempre NONE, detalhe vazio
    (sem relacoes_autorizadas/relationships_checked pra autorizar
    personalizacao nenhuma). montar_payload_minimo() so acessa atributos
    (nivel_relacao/detalhe/versao_ruleset), nunca isinstance -- um
    SimpleNamespace satisfaz o contrato sem precisar de uma
    ResultadoRelevancia de banco de verdade."""
    resultado_sem_dono = SimpleNamespace(nivel_relacao=NIVEL_NONE, detalhe={}, versao_ruleset=RULESET_VERSION)
    return montar_payload_minimo(session, momento, resultado_sem_dono)


def _publicar(
    session: Session,
    data_referencia: datetime.date,
    momento: MomentoDreamspell,
    *,
    reflexao: Optional[str],
    pergunta: Optional[str],
    status_qa: str,
    resumo_derivacao: dict,
) -> LeituraDiariaGenerica:
    linha = LeituraDiariaGenerica(
        data_referencia=data_referencia,
        timezone_usado=TIMEZONE_PONTE_PRESENCA,
        kin=momento.kin,
        selo=momento.selo,
        selo_cor=momento.selo_cor,
        tom=momento.tom,
        tipo_dia=momento.tipo_dia,
        reflexao=reflexao,
        pergunta=pergunta,
        resumo_derivacao=resumo_derivacao,
        status_qa=status_qa,
        versao_prompt=PROMPT_VERSION,
        versao_engine_dreamspell=ENGINE_VERSION,
    )
    session.add(linha)
    session.commit()
    session.refresh(linha)
    return linha


def obter_ou_publicar_leitura_generica(
    session: Session,
    modelo: ModeloClient,
    now: Optional[datetime.datetime] = None,
) -> LeituraDiariaGenerica:
    """Get-or-create do dia, sem participante -- mesmo principio de
    double-checked locking de obter_ou_publicar_leitura_diaria() (app/
    alpha/interpretation.py): 1a checagem antes do lock (caminho comum,
    sem serializar todo mundo em cada request), lock, 2a checagem depois
    (quem perdeu a corrida reencontra a linha do vencedor e nunca chama
    o modelo). `now` injetavel para teste, mesma convencao do resto do
    projeto (snapshot_date_hoje/obter_ou_criar_momento_diario)."""
    data_referencia = snapshot_date_hoje(TIMEZONE_PONTE_PRESENCA, now)

    existente = _buscar(session, data_referencia)
    if existente is not None:
        return existente

    session.execute(text("SELECT pg_advisory_xact_lock(:chave)"), {"chave": _chave_lock_generica(data_referencia)})

    existente = _buscar(session, data_referencia)
    if existente is not None:
        return existente

    momento = momento_dreamspell(data_referencia)

    if momento.tipo_dia == "HUNAB_KU_0_0":
        return _publicar(
            session, data_referencia, momento,
            reflexao=None, pergunta=None, status_qa=STATUS_FIXED_HUNAB_KU,
            resumo_derivacao={"tipo_dia": "HUNAB_KU_0_0", "motivo": "sem Kin/Selo/Tom proprios nesse dia"},
        )

    payload = _payload_generico(session, momento)
    resposta, status_qa, resumo_derivacao = _rodar_pipeline_qa(payload, PROMPT_VERSION, modelo)

    if resposta is not None:
        return _publicar(
            session, data_referencia, momento,
            reflexao=resposta.reflection, pergunta=resposta.question,
            status_qa=status_qa, resumo_derivacao=resumo_derivacao,
        )

    # fallback curado (2a falha) -- nenhuma chamada de modelo daqui em diante
    return _publicar(
        session, data_referencia, momento,
        reflexao=FALLBACK_REFLEXAO, pergunta=FALLBACK_PERGUNTA,
        status_qa=status_qa, resumo_derivacao=resumo_derivacao,
    )
