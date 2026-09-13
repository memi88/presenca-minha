"""
Gate 1.5 (CLAUDE.md secao 5, 20/08/2026) -- ruleset do Relevance Engine
aprovado pelo time: SAME_SEAL + as 4 posicoes do Fifth Force Oracle
(Guia/Analogo/Antipoda/Oculto) autorizam personalizacao, cada uma
individualmente identificada (nunca colapsada num ORACLE_MATCH generico).
Familia Terrestre/mesmo Tom/mesma Onda continuam SO contexto -- nunca
autorizam, nem combinadas entre si.

Parte 1: calcular_relacoes_autorizadas() isolada (pura, sem banco) contra
dicts sinteticos -- cobre cada um dos 5 tokens autorizantes, a regra de
"nao combinar relacoes fracas" e o caso raro de coincidencia (Tom em
{1,6,11} faz SAME_SEAL e GUIDE_MATCH dispararem juntos).

Parte 2: integracao real contra o pipeline completo (Postgres real) --
o caso real do dia (20/08/2026, Kin 254) pro participante com o Golden
Profile de Guilherme: same_earth_family=True mas NADA autoriza
personalizacao hoje (exatamente o caso que motivou a revisao do time)."""
import datetime

from app.adapters.dreamspell_adapter import DreamspellAdapter
from app.alpha.daily_moment import obter_ou_criar_momento_diario
from app.alpha.relevance import (
    NIVEL_ANALOG_MATCH,
    NIVEL_ANTIPODE_MATCH,
    NIVEL_GUIDE_MATCH,
    NIVEL_NONE,
    NIVEL_OCCULT_MATCH,
    NIVEL_SAME_SEAL,
    RELACOES_SO_CONTEXTO_NAO_AUTORIZAM,
    calcular_relacoes_autorizadas,
    obter_ou_criar_resultado_relevancia,
)
from app.db.models import MomentoDiario, Participante, ResultadoRelevancia
from app.db.session import get_session
from app.pessoa import gerar_ou_obter_perfil_dreamspell

NOME_TESTE = "_teste_gate1_5_relevance"


def _relacoes_sinteticas(**overrides) -> dict:
    """Dict RelacoesEstruturais.to_dict()-shaped com tudo False por
    padrao -- so os overrides passados viram True/valor customizado."""
    base = {
        "same_seal": False, "same_tone": False, "same_wavespell": False, "same_earth_family": False,
        "natal_guide_seal": "X", "natal_guide_match": False,
        "natal_analog_seal": "X", "natal_analog_match": False,
        "natal_antipode_seal": "X", "natal_antipode_match": False,
        "natal_occult_seal": "X", "natal_occult_match": False,
    }
    base.update(overrides)
    return base


def _limpar(session, participante_id):
    session.query(ResultadoRelevancia).filter_by(participante_id=participante_id).delete()
    session.query(MomentoDiario).filter_by(participante_id=participante_id).delete()
    session.commit()


def _get_or_create_participante(session) -> Participante:
    p = session.query(Participante).filter_by(nome=NOME_TESTE).first()
    if p is not None:
        _limpar(session, p.id)
        return p
    # Golden Profile de Guilherme -- Kin 169, Selo Lua.
    p = Participante(
        nome=NOME_TESTE,
        nome_completo_nascimento="Guilherme Moreira dos Santos",
        data_nascimento=datetime.date(1988, 8, 25),
        hora_nascimento=datetime.time(0, 40),
        local_nascimento_texto="Cachoeirinha, RS, Brasil",
        latitude=-29.95,
        longitude=-51.09,
        timezone_nascimento="America/Sao_Paulo",
        timezone_atual="America/Sao_Paulo",
        confiabilidade_hora="alta",
    )
    session.add(p)
    session.commit()
    session.refresh(p)
    return p


def main():
    n_pass = n_fail = 0

    def check(label, cond):
        nonlocal n_pass, n_fail
        n_pass += bool(cond)
        n_fail += not cond
        print(f"{'PASS' if cond else 'FAIL':6} {label}")

    # --- Parte 1: calcular_relacoes_autorizadas isolada (sem banco) --------
    check("None -> []", calcular_relacoes_autorizadas(None) == [])
    check("Tudo False -> []", calcular_relacoes_autorizadas(_relacoes_sinteticas()) == [])
    check("SO same_seal -> [SAME_SEAL]",
          calcular_relacoes_autorizadas(_relacoes_sinteticas(same_seal=True)) == [NIVEL_SAME_SEAL])
    check("SO natal_guide_match -> [GUIDE_MATCH]",
          calcular_relacoes_autorizadas(_relacoes_sinteticas(natal_guide_match=True)) == [NIVEL_GUIDE_MATCH])
    check("SO natal_analog_match -> [ANALOG_MATCH]",
          calcular_relacoes_autorizadas(_relacoes_sinteticas(natal_analog_match=True)) == [NIVEL_ANALOG_MATCH])
    check("SO natal_antipode_match -> [ANTIPODE_MATCH]",
          calcular_relacoes_autorizadas(_relacoes_sinteticas(natal_antipode_match=True)) == [NIVEL_ANTIPODE_MATCH])
    check("SO natal_occult_match -> [OCCULT_MATCH]",
          calcular_relacoes_autorizadas(_relacoes_sinteticas(natal_occult_match=True)) == [NIVEL_OCCULT_MATCH])

    # Regra explicita do time: relacoes fracas NUNCA autorizam, nem juntas.
    check("same_earth_family sozinha -> [] (NAO autoriza)",
          calcular_relacoes_autorizadas(_relacoes_sinteticas(same_earth_family=True)) == [])
    check("same_tone sozinha -> [] (NAO autoriza)",
          calcular_relacoes_autorizadas(_relacoes_sinteticas(same_tone=True)) == [])
    check("same_wavespell sozinha -> [] (NAO autoriza)",
          calcular_relacoes_autorizadas(_relacoes_sinteticas(same_wavespell=True)) == [])
    check("Combinar same_earth_family + same_tone + same_wavespell -> [] (nao fabrica relacao forte)",
          calcular_relacoes_autorizadas(
              _relacoes_sinteticas(same_earth_family=True, same_tone=True, same_wavespell=True)
          ) == [])
    check("As 3 relacoes de so-contexto sao exatamente essas 3, nada a mais/menos",
          set(RELACOES_SO_CONTEXTO_NAO_AUTORIZAM) == {"same_earth_family", "same_tone", "same_wavespell"})

    # Coincidencia real do Gate 1 (Tom em {1,6,11}): SAME_SEAL e GUIDE_MATCH
    # disparam JUNTOS -- a lista preserva as duas, na ordem definida.
    check("SAME_SEAL + GUIDE_MATCH juntos -> lista com os DOIS, nesta ordem (nao colapsa)",
          calcular_relacoes_autorizadas(_relacoes_sinteticas(same_seal=True, natal_guide_match=True))
          == [NIVEL_SAME_SEAL, NIVEL_GUIDE_MATCH])
    check("Todas as 4 posicoes de Oraculo juntas -> lista com as 4, sem colapsar",
          calcular_relacoes_autorizadas(_relacoes_sinteticas(
              natal_guide_match=True, natal_analog_match=True, natal_antipode_match=True, natal_occult_match=True
          )) == [NIVEL_GUIDE_MATCH, NIVEL_ANALOG_MATCH, NIVEL_ANTIPODE_MATCH, NIVEL_OCCULT_MATCH])

    # --- Parte 2: integracao real (Postgres) --------------------------------
    session = get_session()
    participante = None
    try:
        participante = _get_or_create_participante(session)
        gerar_ou_obter_perfil_dreamspell(session, participante, DreamspellAdapter())

        # Dia de hoje de verdade (20/08/2026, Kin 254, Mago Ressonante) --
        # o caso real que motivou a revisao do time: same_earth_family=True
        # (Lua/Mago sao Gateway) mas NADA autoriza personalizacao.
        momento_hoje = obter_ou_criar_momento_diario(session, participante)
        resultado_hoje = obter_ou_criar_resultado_relevancia(session, participante, momento_hoje)
        rc = resultado_hoje.detalhe["relationships_checked"]
        check("Caso real de hoje: same_earth_family == True (Lua/Mago = Gateway)", rc["same_earth_family"] is True)
        check("Caso real de hoje: nenhuma das 5 relacoes autorizantes e True",
              not any([rc["same_seal"], rc["natal_guide_match"], rc["natal_analog_match"],
                       rc["natal_antipode_match"], rc["natal_occult_match"]]))
        check("Caso real de hoje: nivel_relacao == NONE (apesar da Familia Terrestre bater)",
              resultado_hoje.nivel_relacao == NIVEL_NONE)
        check("Caso real de hoje: detalhe.relacoes_autorizadas == [] (lista vazia, nao None)",
              resultado_hoje.detalhe["relacoes_autorizadas"] == [])

        # Dia do proprio nascimento -- SAME_SEAL garantido por construcao,
        # confirma que a lista de autorizadas reflete a coluna nivel_relacao.
        momento_natal = obter_ou_criar_momento_diario(
            session, participante,
            now=datetime.datetime(1988, 8, 25, 15, 0, tzinfo=datetime.timezone.utc),
        )
        resultado_natal = obter_ou_criar_resultado_relevancia(session, participante, momento_natal)
        check("Dia do nascimento: nivel_relacao == SAME_SEAL", resultado_natal.nivel_relacao == NIVEL_SAME_SEAL)
        check("Dia do nascimento: detalhe.relacoes_autorizadas == ['SAME_SEAL']",
              resultado_natal.detalhe["relacoes_autorizadas"] == [NIVEL_SAME_SEAL])
    finally:
        session.close()

    print(f"\nResumo Gate 1.5 (ruleset do Relevance Engine): {n_pass} PASS | {n_fail} FAIL")
    return n_fail == 0


if __name__ == "__main__":
    import sys
    sys.exit(0 if main() else 1)
