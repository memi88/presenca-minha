"""
Golden tests da A4 (CLAUDE.md secao 5) -- Relevance Engine minimo original
(NONE/SAME_SEAL). Cobre os 5 casos do briefing: match, nao-match, Hunab Ku
(regressao direta do bug corrigido na sessao anterior), Dia Fora do Tempo
participando normalmente, e imutabilidade sob mudanca de versao de ruleset.

Atualizado no Gate 1.5 (20/08/2026): o ruleset DEFAULT deixou de ser SO
NONE/SAME_SEAL (ver app/alpha/relevance.py e tests/test_gate1_5_relevance_
ruleset.py pro ruleset novo) -- os casos deste arquivo foram ajustados pra
continuar corretos sob a regra atual (ex.: o "dia seguinte ao nascimento"
usado como fixture de "Selo diferente" bate, por coincidencia real e nao
forcada, com o Selo Analogo natal de Guilherme -- ver comentario no passo 2).
"""
import datetime

from app.adapters.dreamspell_adapter import DreamspellAdapter
from app.alpha.daily_moment import obter_ou_criar_momento_diario
from app.alpha.relevance import (
    NIVEL_ANALOG_MATCH,
    NIVEL_NONE,
    NIVEL_SAME_SEAL,
    RULESET_VERSION,
    calcular_nivel_relacao,
    obter_ou_criar_resultado_relevancia,
)
from app.db.models import MomentoDiario, Participante, PerfilNatalDreamspell, ResultadoRelevancia
from app.db.session import get_session
from app.pessoa import gerar_ou_obter_perfil_dreamspell

TZ_SP = "America/Sao_Paulo"
NOME_TESTE = "_teste_a4_relevance"


def _utc_sp(y, m, d, h, mi=0):
    return datetime.datetime(y, m, d, h, mi, tzinfo=datetime.timezone.utc) + datetime.timedelta(hours=3)


def _limpar(session, participante_id):
    session.query(ResultadoRelevancia).filter_by(participante_id=participante_id).delete()
    session.query(MomentoDiario).filter_by(participante_id=participante_id).delete()
    session.commit()


def _get_or_create_participante(session) -> Participante:
    p = session.query(Participante).filter_by(nome=NOME_TESTE).first()
    if p is not None:
        _limpar(session, p.id)
        return p
    # Mesmos dados do Golden Profile de Guilherme -- Selo natal = Lua Vermelha, Kin 169.
    p = Participante(
        nome=NOME_TESTE,
        nome_completo_nascimento="Guilherme Moreira dos Santos",
        data_nascimento=datetime.date(1988, 8, 25),
        hora_nascimento=datetime.time(0, 40),
        local_nascimento_texto="Cachoeirinha, RS, Brasil",
        latitude=-29.95,
        longitude=-51.09,
        timezone_nascimento=TZ_SP,
        timezone_atual=TZ_SP,
        confiabilidade_hora="alta",
    )
    session.add(p)
    session.commit()
    session.refresh(p)
    return p


def main():
    session = get_session()
    n_pass = n_fail = 0

    def check(label, cond):
        nonlocal n_pass, n_fail
        n_pass += bool(cond)
        n_fail += not cond
        print(f"{'PASS' if cond else 'FAIL':6} {label}")

    participante = None
    try:
        participante = _get_or_create_participante(session)
        gerar_ou_obter_perfil_dreamspell(session, participante, DreamspellAdapter())
        perfil = session.query(PerfilNatalDreamspell).filter_by(participante_id=participante.id).first()
        check("Setup: Selo natal de Guilherme == Lua (Golden Profile)", perfil.selo == "Lua")

        # --- 0. calcular_nivel_relacao isolada (sem banco) ----------------------
        check("Funcao pura: selos iguais -> SAME_SEAL", calcular_nivel_relacao("Lua", "Lua") == NIVEL_SAME_SEAL)
        check("Funcao pura: selos diferentes -> NONE", calcular_nivel_relacao("Lua", "Cao") == NIVEL_NONE)
        check("Funcao pura: selo_hoje None -> NONE (sem excecao)", calcular_nivel_relacao("Lua", None) == NIVEL_NONE)
        check("Funcao pura: selo_natal None -> NONE (sem excecao)", calcular_nivel_relacao(None, "Lua") == NIVEL_NONE)
        check("Funcao pura: os dois None -> NONE (sem excecao)", calcular_nivel_relacao(None, None) == NIVEL_NONE)

        # --- 1. Selo do dia == Selo natal (proprio dia do nascimento, Kin 169,
        # Selo Lua) -> SAME_SEAL, pela stack completa ---------------------------
        momento_natal = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(1988, 8, 25, 12, 0))
        check("Dia com mesmo Selo do natal: MomentoDiario.selo == Lua", momento_natal.selo == "Lua")
        resultado_match = obter_ou_criar_resultado_relevancia(session, participante, momento_natal)
        check("Selo do dia == Selo natal -> SAME_SEAL", resultado_match.nivel_relacao == NIVEL_SAME_SEAL)
        check("detalhe.match == True", resultado_match.detalhe["match"] is True)
        check("detalhe.selo_natal e detalhe.selo_hoje == Lua",
              resultado_match.detalhe["selo_natal"] == "Lua" and resultado_match.detalhe["selo_hoje"] == "Lua")
        # Gate 1 (20/08/2026): detalhe carrega o resultado completo do
        # Relationship Detector (app/alpha/relationship_detector.py). Desde o
        # Gate 1.5 (mesmo dia), o Relevance Engine JA USA esse resultado pra
        # decidir nivel_relacao (ver detalhe.relacoes_autorizadas) -- ver
        # tests/test_gate1_5_relevance_ruleset.py pros golden tests dedicados
        # dessa decisao. tests/test_gate1_dreamspell_relationships.py cobre o
        # Detector em si (as formulas), nao a autorizacao.
        rc = resultado_match.detalhe["relationships_checked"]
        check("detalhe.relationships_checked presente e nao-None", rc is not None)
        check("detalhe.relationships_checked: dia do proprio nascimento -> same_seal True",
              rc["same_seal"] is True)
        check("detalhe.relacoes_autorizadas == ['SAME_SEAL'] (Tom Cosmico nao coincide com Guia, sem overlap)",
              resultado_match.detalhe["relacoes_autorizadas"] == [NIVEL_SAME_SEAL])

        # --- 2. Selo do dia diferente do natal ----------------------------------
        # Dia seguinte (26/08/1988, Kin 170, Selo Cao) tem Selo diferente de Lua
        # -- MAS Cao e, por coincidencia real (nao forcada), o Selo Analogo
        # natal de Guilherme (Lua -> Analogo == Cao, ver test_gate1_dreamspell_
        # relationships.py). Gate 1.5: isso AUTORIZA personalizacao por
        # ANALOG_MATCH, mesmo sem SAME_SEAL -- exatamente o comportamento novo
        # que este teste deve capturar (nao mais um "NONE" ingenuo so por
        # Selo-diferente-do-natal).
        momento_diff = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(1988, 8, 26, 12, 0))
        check("Dia seguinte tem Selo diferente de Lua (setup)", momento_diff.selo != "Lua")
        resultado_diff = obter_ou_criar_resultado_relevancia(session, participante, momento_diff)
        check("Selo do dia != Selo natal, mas == Analogo natal -> ANALOG_MATCH (Gate 1.5)",
              resultado_diff.nivel_relacao == NIVEL_ANALOG_MATCH)
        check("detalhe.match == False (match e especificamente SAME_SEAL, nao qualquer autorizacao)",
              resultado_diff.detalhe["match"] is False)
        check("detalhe.relacoes_autorizadas == ['ANALOG_MATCH']",
              resultado_diff.detalhe["relacoes_autorizadas"] == [NIVEL_ANALOG_MATCH])

        # --- 3. Hunab Ku 0.0 (selo=None) -> NONE, sem excecao -- regressao ------
        # direta do bug corrigido na sessao anterior (kin_today_or_for /
        # _card_dreamspell indexando None sem checar).
        momento_hk = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(2016, 2, 29, 12, 0))
        check("Hunab Ku 0.0: MomentoDiario.selo == None (setup)", momento_hk.selo is None)
        resultado_hk = obter_ou_criar_resultado_relevancia(session, participante, momento_hk)
        check("Hunab Ku 0.0 nao levanta excecao ao calcular relevancia", True)
        check("Hunab Ku 0.0 -> nivel_relacao == NONE", resultado_hk.nivel_relacao == NIVEL_NONE)
        check("Hunab Ku 0.0 -> detalhe.selo_hoje == None (preservado, nao normalizado)",
              resultado_hk.detalhe["selo_hoje"] is None)
        check("Hunab Ku 0.0 -> detalhe.match == False", resultado_hk.detalhe["match"] is False)

        # --- 4. Dia Fora do Tempo participa normalmente da comparacao ----------
        # (tem Kin/Selo validos per Gate 0 -- nao deve ser tratado como "sem
        # dado" so por ser um dia especial, ao contrario de Hunab Ku).
        momento_doot = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(2016, 7, 25, 12, 0))
        check("Dia Fora do Tempo: MomentoDiario.tipo_dia == DAY_OUT_OF_TIME", momento_doot.tipo_dia == "DAY_OUT_OF_TIME")
        check("Dia Fora do Tempo: MomentoDiario.selo NAO e None (tem Selo valido)", momento_doot.selo is not None)
        resultado_doot = obter_ou_criar_resultado_relevancia(session, participante, momento_doot)
        check("Dia Fora do Tempo: relevancia calculada normalmente (nao omitida/pulada)",
              resultado_doot.nivel_relacao in (NIVEL_NONE, NIVEL_SAME_SEAL))
        check("Dia Fora do Tempo: detalhe.selo_hoje reflete o Selo real do dia (nao None)",
              resultado_doot.detalhe["selo_hoje"] == momento_doot.selo)
        # Selo do dia (Espelho, ver test_gate0_dreamspell.py) != Lua -> NONE, mas
        # por COMPARACAO de verdade, nao por omissao do dia especial.
        check("Dia Fora do Tempo: resultado bate com uma comparacao explicita (Selo=Espelho != Lua -> NONE)",
              resultado_doot.nivel_relacao == calcular_nivel_relacao("Lua", momento_doot.selo) == NIVEL_NONE)

        # --- 5. Idempotencia (mesmo padrao da A2) -------------------------------
        resultado_match_2 = obter_ou_criar_resultado_relevancia(session, participante, momento_natal)
        check("Duas chamadas para o mesmo momento -> mesmo id (nao duplica)",
              resultado_match.id == resultado_match_2.id)

        # --- 6. Versionamento: mudar versao_ruleset NAO altera resultado antigo -
        # "v1" aqui e a versao DEFAULT atual (RULESET_VERSION, Gate 1.5) -- a
        # mesma que resultado_diff (passo 2) ja usou por default, entao get-or-
        # create deve reencontrar a MESMA linha, nao criar uma terceira.
        resultado_v1 = obter_ou_criar_resultado_relevancia(
            session, participante, momento_diff, versao_ruleset=RULESET_VERSION
        )
        check("resultado_v1 (versao default explicita) e a MESMA linha de resultado_diff (passo 2)",
              resultado_v1.id == resultado_diff.id)
        v1_nivel_original = resultado_v1.nivel_relacao
        v1_id_original = resultado_v1.id
        v1_calculado_em_original = resultado_v1.calculado_em

        resultado_v2 = obter_ou_criar_resultado_relevancia(
            session, participante, momento_diff, versao_ruleset="relevance-9.9.9-hipotetica-futura"
        )
        check("Versao nova gera uma linha NOVA (id diferente da v1)", resultado_v2.id != v1_id_original)
        check("Versao nova gravada corretamente em versao_ruleset",
              resultado_v2.versao_ruleset == "relevance-9.9.9-hipotetica-futura")

        resultado_v1_relido = (
            session.query(ResultadoRelevancia)
            .filter_by(momento_diario_id=momento_diff.id, versao_ruleset=RULESET_VERSION)
            .first()
        )
        check("Linha da v1 continua com o MESMO id depois da v2 existir (nao foi sobrescrita)",
              resultado_v1_relido.id == v1_id_original)
        check("Linha da v1 continua com o MESMO nivel_relacao (imutavel)",
              resultado_v1_relido.nivel_relacao == v1_nivel_original)
        check("Linha da v1 continua com o MESMO calculado_em (nao foi recalculada)",
              resultado_v1_relido.calculado_em == v1_calculado_em_original)
        check("Existem duas linhas distintas para o mesmo momento_diario_id (uma por versao)",
              session.query(ResultadoRelevancia).filter_by(momento_diario_id=momento_diff.id).count() == 2)

        print(f"\nResumo A4 (Relevance Engine): {n_pass} PASS | {n_fail} FAIL")
        if n_fail:
            raise SystemExit(1)
    finally:
        if participante is not None:
            _limpar(session, participante.id)
            session.query(PerfilNatalDreamspell).filter_by(participante_id=participante.id).delete()
            session.delete(session.query(Participante).filter_by(nome=NOME_TESTE).first())
        session.commit()
        session.close()


if __name__ == "__main__":
    main()
