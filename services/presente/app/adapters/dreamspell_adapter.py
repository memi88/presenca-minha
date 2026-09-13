"""
dreamspell_adapter.py

Adapter de Dreamspell sobre app/engines/dreamspell_engine.py (motor
validado -- ver ENGINE_VALIDATION.md, 25/08/1988 = Kin 169 confirmado
contra o Sincronario da Paz).

Horizontes suportados (ENGINE_VALIDATION.md secao 7, correcao "Dreamspell
Ano/Mes nativos"):
  Semana -> experimental (composicao de 7 Kins -- NAO e o "Ano Portador"
            nativo do Sincronario das 13 Luas, que continua NOT_IMPLEMENTED)
  Hoje   -> nativo (Kin do dia)

Ano e Mes NAO aparecem em horizontes_suportados de proposito -- essas
paginas simplesmente nao mostram bloco de Dreamspell (PRD_v0.1.md secao
4.2: um horizonte pode legitimamente ter 1, 2 ou 3 blocos).

Hunab Ku 0.0 (29/02) -- tratamento por call site (ver ENGINE_VALIDATION.md
secao 8, "Resolvido em 19/08/2026", e a correcao de kin_today_or_for() la
descrita, que passou a retornar None nesse dia em vez de um Kin errado):
  - compute_pessoa: 29/02 nao e um dia de calendario qualquer, e a data de
    NASCIMENTO de alguem -- precisa de uma assinatura propria, entao
    aplicamos a regra ja registrada em CLAUDE.md/
    DREAMSPELL_CALENDAR_CONVENTION.md (antes de 12:00 local -> assinatura
    de 28/02; depois -> assinatura de 01/03) e calculamos o Kin nessa data
    resolvida. Nunca produz kin=None.
  - compute_horizonte (Hoje/Semana): aqui 29/02 E o dia sendo consultado,
    nao uma data de nascimento -- nao ha "assinatura" para resolver. A
    leitura correta e refletir que esse dia especifico nao tem Kin proprio
    (kin=None, tipo_dia="HUNAB_KU_0_0"), nao inventar nem crashar.
"""
import datetime

from app.adapters.base import ParticipanteInput, SistemaAdapter, monday_of_week
from app.engines.dreamspell_engine import full_reading, is_hunab_ku, kin_today_or_for, tipo_dia_for


def _leitura_dia(dia: datetime.date) -> dict:
    """Kin/Selo/Tom/Onda para um dia de calendario, sem crashar em Hunab Ku
    0.0: kin_today_or_for() retorna None nesse caso (ver modulo acima), e
    full_reading() nao aceita None -- este helper checa antes de chamar."""
    kin = kin_today_or_for(dia)
    if kin is None:
        return {
            "kin": None, "selo": None, "selo_cor": None,
            "tom": None, "tom_numero": None,
            "onda_selo": None, "onda_cor": None,
            "tipo_dia": tipo_dia_for(dia),
        }
    r = full_reading(kin)
    return {
        "kin": r.kin, "selo": r.seal, "selo_cor": r.seal_color,
        "tom": r.tone, "tom_numero": r.tone_number,
        "onda_selo": r.wavespell_seal, "onda_cor": r.wavespell_color,
        "tipo_dia": tipo_dia_for(dia),
    }


def _data_nascimento_efetiva(participante: ParticipanteInput) -> datetime.date:
    """Resolve a data usada para o calculo do Kin natal. Hunab Ku 0.0
    (29/02) nao tem Kin proprio -- regra registrada (CLAUDE.md secao 4,
    DREAMSPELL_CALENDAR_CONVENTION.md): nascimento antes de 12:00 local usa
    a assinatura de 28/02; depois (ou sem hora confiavel -- nenhum
    participante atual cai neste caso, mas o default fica registrado aqui,
    nao escondido) usa a de 01/03."""
    d = participante.data_nascimento
    if not is_hunab_ku(d):
        return d
    if participante.hora_nascimento is not None and participante.hora_nascimento < datetime.time(12, 0):
        return d - datetime.timedelta(days=1)  # assinatura de 28/02
    return d + datetime.timedelta(days=1)  # assinatura de 01/03 (default sem hora confiavel)


class DreamspellAdapter(SistemaAdapter):
    sistema = "dreamspell"
    horizontes_suportados = {
        "semana": "experimental",
        "hoje": "nativo",
    }

    def compute_pessoa(self, participante: ParticipanteInput) -> dict:
        leitura = _leitura_dia(_data_nascimento_efetiva(participante))
        return {
            "kin": leitura["kin"],
            "selo": leitura["selo"],
            "selo_cor": leitura["selo_cor"],
            "tom": leitura["tom"],
            "tom_numero": leitura["tom_numero"],
            "onda_selo": leitura["onda_selo"],
            "onda_cor": leitura["onda_cor"],
        }

    def compute_horizonte(self, participante: ParticipanteInput, horizonte: str, data_referencia: datetime.date) -> dict:
        self.composition_status_de(horizonte)  # levanta HorizonteNaoSuportado se aplicavel

        if horizonte == "hoje":
            return _leitura_dia(data_referencia)

        if horizonte == "semana":
            segunda = monday_of_week(data_referencia)
            dias = []
            for i in range(7):
                dia = segunda + datetime.timedelta(days=i)
                leitura = _leitura_dia(dia)
                dias.append({
                    "data": dia.isoformat(), "kin": leitura["kin"],
                    "selo": leitura["selo"], "selo_cor": leitura["selo_cor"],
                    "tipo_dia": leitura["tipo_dia"],
                })
            return {
                "semana_inicio": segunda.isoformat(),
                "semana_fim": (segunda + datetime.timedelta(days=6)).isoformat(),
                "dias": dias,
            }

        raise AssertionError(f"horizonte '{horizonte}' declarado suportado mas sem implementacao")
