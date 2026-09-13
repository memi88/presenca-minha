"""
human_design_adapter.py

Adapter de Design Humano sobre app/engines/human_design_engine.py,
hd_bodygraph.py e hd_transit.py (motores validados -- ENGINE_MATCH para
ativacoes, Tipo/Autoridade/Definicao, e Transito x Natal -- ver
ENGINE_VALIDATION.md).

Horizontes suportados (IMPLEMENTATION_PLAN.md secao 4.2 + ENGINE_VALIDATION.md
secao 7, decisao 1):
  Mes    -> experimental (fotografia UNICA do inicio do mes civil -- NAO
            uniao bruta de 30 dias, decisao revisada da v0.1)
  Semana -> experimental (uniao dos transitos dos 7 dias da semana civil,
            cada um as 03:00, combinada com o natal)
  Hoje   -> nativo (transito as 03:00 x natal)

Ano NAO aparece em horizontes_suportados -- decisao final registrada
(Retorno Solar nao adotado): a pagina Ano simplesmente nao mostra bloco
de Design Humano.
"""
import datetime
from zoneinfo import ZoneInfo

import swisseph as swe

from app.adapters.base import ParticipanteInput, SistemaAdapter, monday_of_week
from app.engines.hd_bodygraph import compute_bodygraph
from app.engines.hd_transit import transit_activations, transit_x_natal
from app.engines.human_design_engine import compute_chart, cross_gates_from_chart, profile_from_chart


def _jd_ut(dt_local: datetime.datetime) -> float:
    dt_utc = dt_local.astimezone(datetime.timezone.utc)
    return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, dt_utc.hour + dt_utc.minute / 60 + dt_utc.second / 3600)


def _jd_ut_snapshot(data: datetime.date, timezone_atual: str) -> float:
    """JD (UT) da fotografia das 03:00 (mesma regra do 'Hoje' de
    Numerologia/Dreamspell) para uma data civil em timezone_atual."""
    dt_local = datetime.datetime.combine(data, datetime.time(3, 0), tzinfo=ZoneInfo(timezone_atual))
    return _jd_ut(dt_local)


def _jd_birth_ut(participante: ParticipanteInput) -> float:
    if participante.hora_nascimento is None:
        raise ValueError("hora_nascimento e obrigatoria para calcular o mapa de Design Humano.")
    dt_local = datetime.datetime.combine(
        participante.data_nascimento, participante.hora_nascimento,
        tzinfo=ZoneInfo(participante.timezone_nascimento),
    )
    return _jd_ut(dt_local)


def _mapa_natal(participante: ParticipanteInput) -> dict:
    jd_birth = _jd_birth_ut(participante)
    personality, design = compute_chart(jd_birth)
    all_gates = set(g for g, _ in personality.values()) | set(g for g, _ in design.values())
    bg = compute_bodygraph(all_gates)
    return {
        "personality": personality,
        "design": design,
        "all_gates": all_gates,
        "bodygraph": bg,
    }


class HumanDesignAdapter(SistemaAdapter):
    sistema = "design_humano"
    horizontes_suportados = {
        "mes": "experimental",
        "semana": "experimental",
        "hoje": "nativo",
    }

    def chave_periodo(self, horizonte: str, participante: ParticipanteInput, data_referencia: datetime.date) -> str:
        if horizonte == "mes":
            # IMPLEMENTATION_PLAN.md secao 5: "YYYY-MM do mes civil em
            # timezone_atual -- uma fotografia por mes" (nao uniao de 30 dias).
            return data_referencia.strftime("%Y-%m")
        return super().chave_periodo(horizonte, participante, data_referencia)

    def compute_pessoa(self, participante: ParticipanteInput) -> dict:
        mapa = _mapa_natal(participante)
        personality, design, bg = mapa["personality"], mapa["design"], mapa["bodygraph"]
        return {
            "ativacoes_personalidade": {corpo: list(gl) for corpo, gl in personality.items()},
            "ativacoes_design": {corpo: list(gl) for corpo, gl in design.items()},
            "perfil": profile_from_chart(personality, design),
            "portas_da_cruz": cross_gates_from_chart(personality, design),
            "tipo": bg["type"],
            "autoridade": bg["authority"],
            "definicao": bg["definition"],
            "centros_definidos": sorted(bg["defined_centers"]),
            "canais_definidos": [list(ch["gates"]) for ch in bg["defined_channels"]],
        }

    def compute_horizonte(self, participante: ParticipanteInput, horizonte: str, data_referencia: datetime.date) -> dict:
        self.composition_status_de(horizonte)  # levanta HorizonteNaoSuportado se aplicavel

        mapa = _mapa_natal(participante)
        natal_gates = mapa["all_gates"]

        if horizonte == "hoje":
            jd = _jd_ut_snapshot(data_referencia, participante.timezone_atual)
            trans = transit_activations(jd)
            transit_gates = set(g for g, _ in trans.values())
            combinacao = transit_x_natal(natal_gates, transit_gates)
            return self._serializar_transito(trans, combinacao)

        if horizonte == "mes":
            inicio_mes = data_referencia.replace(day=1)
            jd = _jd_ut_snapshot(inicio_mes, participante.timezone_atual)
            trans = transit_activations(jd)
            transit_gates = set(g for g, _ in trans.values())
            combinacao = transit_x_natal(natal_gates, transit_gates)
            resultado = self._serializar_transito(trans, combinacao)
            resultado["mes_referencia"] = inicio_mes.strftime("%Y-%m")
            return resultado

        if horizonte == "semana":
            segunda = monday_of_week(data_referencia)
            transit_gates_semana = set()
            for i in range(7):
                dia = segunda + datetime.timedelta(days=i)
                jd = _jd_ut_snapshot(dia, participante.timezone_atual)
                trans = transit_activations(jd)
                transit_gates_semana |= set(g for g, _ in trans.values())
            combinacao = transit_x_natal(natal_gates, transit_gates_semana)
            return {
                "semana_inicio": segunda.isoformat(),
                "semana_fim": (segunda + datetime.timedelta(days=6)).isoformat(),
                "gates_transito": sorted(transit_gates_semana),
                "canais_novos": [list(ch["gates"]) for ch in combinacao["new_channels_today"]],
                "centros_temporarios": sorted(combinacao["centers_newly_defined_today"]),
            }

        raise AssertionError(f"horizonte '{horizonte}' declarado suportado mas sem implementacao")

    @staticmethod
    def _serializar_transito(trans: dict, combinacao: dict) -> dict:
        return {
            "gates_transito": sorted(set(g for g, _ in trans.values())),
            "ativacoes_transito": {corpo: list(gl) for corpo, gl in trans.items()},
            "canais_novos": [list(ch["gates"]) for ch in combinacao["new_channels_today"]],
            "centros_temporarios": sorted(combinacao["centers_newly_defined_today"]),
        }
