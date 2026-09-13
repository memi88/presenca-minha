"""
numerology_adapter.py

Adapter de Numerologia sobre app/engines/numerology_engine.py (motor
validado, ver ENGINE_VALIDATION.md e tests/test_golden_profile.py -- 59
PASS / 0 FAIL / 9 PENDENTE).

Horizontes suportados (IMPLEMENTATION_PLAN.md secao 4.2):
  Ano    -> nativo       (Ano Pessoal vigente)
  Mes    -> nativo       (Mes Pessoal vigente)
  Semana -> experimental (composicao de 7 Dias Pessoais da semana civil --
                           NAO e um conceito nativo da Numerologia, ver
                           PRD_v0.1.md secao 4.2)
  Hoje   -> nativo       (Dia Pessoal)
"""
import datetime

from app.adapters.base import ParticipanteInput, SistemaAdapter
from app.engines.numerology_engine import ano_pessoal, compute_natal, dia_pessoal, mes_pessoal


def _ano_pessoal_vigente(birth_day: int, birth_month: int, ref_date: datetime.date) -> int:
    """Ano Pessoal vigente na data de referencia -- ancorado no aniversario,
    NAO no ano civil (mesma regra de virada de ciclo usada por mes_pessoal
    em numerology_engine.py, replicada aqui para o horizonte Ano)."""
    already_had_birthday = (ref_date.month, ref_date.day) >= (birth_month, birth_day)
    cycle_year = ref_date.year if already_had_birthday else ref_date.year - 1
    return ano_pessoal(birth_day, birth_month, cycle_year)


def _monday_of(d: datetime.date) -> datetime.date:
    return d - datetime.timedelta(days=d.weekday())


class NumerologyAdapter(SistemaAdapter):
    sistema = "numerologia"
    horizontes_suportados = {
        "ano": "nativo",
        "mes": "nativo",
        "semana": "experimental",
        "hoje": "nativo",
    }

    def compute_pessoa(self, participante: ParticipanteInput) -> dict:
        r = compute_natal(
            participante.nome_completo_nascimento,
            day=participante.data_nascimento.day,
            month=participante.data_nascimento.month,
            year=participante.data_nascimento.year,
        )
        return {
            "dia_natalicio": r.dia_natalicio,
            "numero_psiquico": r.numero_psiquico,
            "motivacao": r.motivacao,
            "impressao": r.impressao,
            "expressao": r.expressao,
            "destino": r.destino,
            "missao": r.missao,
            "licoes_carmicas": sorted(r.licoes_carmicas),
            "tendencias_ocultas": sorted(r.tendencias_ocultas),
            "resposta_subconsciente": r.resposta_subconsciente,
            "ciclos_de_vida": r.ciclos_de_vida,
            "desafios": r.desafios,
            "momentos_decisivos": r.momentos_decisivos,
            "talento_oculto_hipotese": r.talento_oculto_hipotese,
            "debitos_carmicos": r.debitos_carmicos,
        }

    def chave_periodo(self, horizonte: str, participante: ParticipanteInput, data_referencia: datetime.date) -> str:
        bd, bm = participante.data_nascimento.day, participante.data_nascimento.month
        already_had_birthday = (data_referencia.month, data_referencia.day) >= (bm, bd)
        cycle_year = data_referencia.year if already_had_birthday else data_referencia.year - 1

        if horizonte == "ano":
            # Ano Pessoal so muda no aniversario -- a chave e so o cycle_year.
            return f"AP{cycle_year}"
        if horizonte == "mes":
            # Mes Pessoal muda a cada mes civil E na virada do ciclo do
            # aniversario (ver numerology_engine.mes_pessoal) -- a chave
            # combina os dois gatilhos.
            return f"AP{cycle_year}-M{data_referencia.month:02d}"
        return super().chave_periodo(horizonte, participante, data_referencia)

    def compute_horizonte(self, participante: ParticipanteInput, horizonte: str, data_referencia: datetime.date) -> dict:
        self.composition_status_de(horizonte)  # levanta HorizonteNaoSuportado se aplicavel
        bd, bm = participante.data_nascimento.day, participante.data_nascimento.month

        if horizonte == "ano":
            valor = _ano_pessoal_vigente(bd, bm, data_referencia)
            return {"ano_pessoal": valor}

        if horizonte == "mes":
            valor = mes_pessoal(bd, bm, data_referencia.year, data_referencia.month, data_referencia.day)
            return {"mes_pessoal": valor}

        if horizonte == "hoje":
            valor = dia_pessoal(bd, bm, data_referencia.year, data_referencia.month, data_referencia.day)
            return {"dia_pessoal": valor}

        if horizonte == "semana":
            segunda = _monday_of(data_referencia)
            dias = []
            for i in range(7):
                dia = segunda + datetime.timedelta(days=i)
                valor = dia_pessoal(bd, bm, dia.year, dia.month, dia.day)
                dias.append({"data": dia.isoformat(), "dia_pessoal": valor})
            return {
                "semana_inicio": segunda.isoformat(),
                "semana_fim": (segunda + datetime.timedelta(days=6)).isoformat(),
                "dias_pessoais": dias,
            }

        raise AssertionError(f"horizonte '{horizonte}' declarado suportado mas sem implementacao")
