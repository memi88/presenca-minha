"""
base.py

Contrato comum aos tres adapters (Numerology, Dreamspell, HumanDesign).
Cada adapter isola o "motor" (app/engines/*.py, determinístico, sem IA) do
resto da aplicacao, expondo duas operacoes:

  - compute_pessoa(participante) -> dict serializavel (elementos_json do
    perfil natal)
  - compute_horizonte(participante, horizonte, data_referencia) -> dict
    serializavel (elementos_json de elementos_calculados_horizonte), so
    para os horizontes que o `horizontes_suportados` do adapter cobre.

Um adapter NUNCA grava no banco -- isso e responsabilidade da camada de
geracao de horizontes (app/horizons.py), que decide cache/congelamento e
persiste. O adapter so calcula.
"""
import datetime
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional
from zoneinfo import ZoneInfo


def snapshot_date_hoje(timezone_atual: str, now: Optional[datetime.datetime] = None) -> datetime.date:
    """Resolve a data civil de 'Hoje' sob a regra de fotografia fixa as
    03:00 (IMPLEMENTATION_PLAN.md secao 5, item 'Hoje'): o dia civil vira
    as 03:00 no timezone_atual do participante, nao a meia-noite. Antes
    das 03:00, 'hoje' ainda e o dia civil anterior -- isso e o que torna a
    fotografia estavel mesmo para quem acessa de madrugada."""
    tz = ZoneInfo(timezone_atual)
    if now is None:
        now = datetime.datetime.now(datetime.timezone.utc)
    local_now = now.astimezone(tz)
    if local_now.time() < datetime.time(3, 0):
        return (local_now - datetime.timedelta(days=1)).date()
    return local_now.date()


def monday_of_week(d: datetime.date) -> datetime.date:
    """Segunda-feira da semana civil (seg-dom) que contem `d`."""
    return d - datetime.timedelta(days=d.weekday())


def iso_week_key(d: datetime.date) -> str:
    """Chave de semana civil no formato 'YYYY-Www' (ex.: '2026-W33'),
    calculada a partir da segunda-feira daquela semana."""
    year, week, _ = monday_of_week(d).isocalendar()
    return f"{year}-W{week:02d}"


@dataclass
class ParticipanteInput:
    """Subconjunto de campos de `participantes` que os adapters precisam
    para calcular -- desacopla os adapters do modelo ORM.

    timezone_nascimento e timezone_atual sao mantidos separados de
    proposito (ver app/db/models.py, Participante) -- calculos natais
    (compute_pessoa) consultam so timezone_nascimento; snapshot_date_hoje()
    e a resolucao de semana consultam so timezone_atual (via
    participante.timezone_atual em app/horizons.py, nao por este dataclass)."""
    nome_completo_nascimento: str
    data_nascimento: Any  # datetime.date
    hora_nascimento: Any  # datetime.time | None
    timezone_nascimento: str
    timezone_atual: str
    latitude: float
    longitude: float


class HorizonteNaoSuportado(Exception):
    """Levantada quando o horizonte pedido nao tem metodologia validada
    para este sistema (ex.: Ano de Design Humano). Isso NAO e um erro de
    aplicacao -- e o principio da PRD_v0.1.md secao 4.2: um horizonte pode
    legitimamente nao ter leitura para um sistema."""


class SistemaAdapter(ABC):
    sistema: str  # "numerologia" | "dreamspell" | "design_humano"
    horizontes_suportados: dict  # horizonte -> composition_status ("nativo"/"experimental")

    @abstractmethod
    def compute_pessoa(self, participante: ParticipanteInput) -> dict:
        ...

    @abstractmethod
    def compute_horizonte(self, participante: ParticipanteInput, horizonte: str, data_referencia) -> dict:
        """`data_referencia` e a data civil (no timezone_atual do
        participante) para a qual o horizonte esta sendo gerado."""
        ...

    def chave_periodo(self, horizonte: str, participante: ParticipanteInput, data_referencia: datetime.date) -> str:
        """Chave de congelamento/cache (IMPLEMENTATION_PLAN.md secao 5).
        Hoje e Semana seguem a MESMA regra em qualquer sistema (baseada so
        em timezone_atual) -- implementadas aqui como default. Ano/Mes
        variam por sistema (ex.: ciclo pessoal na Numerologia vs. mes
        civil unico no Design Humano) e devem ser sobrescritos pelo
        adapter concreto."""
        if horizonte == "hoje":
            return data_referencia.isoformat()
        if horizonte == "semana":
            return iso_week_key(data_referencia)
        raise NotImplementedError(
            f"{self.sistema}: chave_periodo para horizonte '{horizonte}' precisa ser definida pelo adapter concreto"
        )

    def composition_status_de(self, horizonte: str) -> str:
        if horizonte not in self.horizontes_suportados:
            raise HorizonteNaoSuportado(
                f"{self.sistema} nao tem metodologia validada para o horizonte '{horizonte}'"
            )
        return self.horizontes_suportados[horizonte]
