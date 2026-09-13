"""
Interpretation Prompt Alpha v1.1 (CLAUDE.md secao 5, Gate 1.5, 20/08/2026)
-- testes deterministicos, SEM chamar a API real (ver
scripts/testar_prompt_v1_1_vs_v1.py pra bateria comparativa real, que
gasta dinheiro e nao roda aqui). Cobre:

1. construir_prompt(..., PROMPT_VERSION_V1_1) -- "Relações autorizadas
   hoje" reflete authorized_relations do payload corretamente (autorizado
   x nao autorizado x multiplas relacoes ao mesmo tempo).
2. verificar_guardrail escaneia os campos novos (human_experience/
   symbolic_relation), nao so reflection/question.
3. _rodar_pipeline_qa fim a fim com um ModeloClient fake, versao v1.1.
4. montar_payload_minimo real (Postgres) -- authorized_relations/
   personalization_status/natal_oracle_context batendo com o Gate 1.5.
5. GPT56SolClient._auditar_v1_1 -- override deterministico dos 3 campos
   bloqueantes, SEM rede real (client.responses.create monkeypatchado).
"""
import datetime
import json
from types import SimpleNamespace

from app.adapters.dreamspell_adapter import DreamspellAdapter
from app.alpha.daily_moment import obter_ou_criar_momento_diario
from app.alpha.interpretation import (
    PROMPT_VERSION_V1_1,
    STATUS_APPROVED_AFTER_REWRITE,
    STATUS_APPROVED_FIRST_TRY,
    ResultadoAuditoria,
    RespostaGerada,
    _rodar_pipeline_qa,
    construir_prompt,
    montar_payload_minimo,
    verificar_guardrail,
)
from app.alpha.modelo_gpt56sol import GPT56SolClient
from app.alpha.relevance import obter_ou_criar_resultado_relevancia
from app.db.models import MomentoDiario, Participante, PerfilNatalDreamspell, ResultadoRelevancia
from app.db.session import get_session
from app.pessoa import gerar_ou_obter_perfil_dreamspell

NOME_TESTE = "_teste_v1_1_interpretation"


def _payload_base(**overrides) -> dict:
    base = {
        "selo_hoje": "Mago",
        "tom_hoje": "Ressonante",
        "tipo_dia": "REGULAR",
        "nivel_relacao": "NONE",
        "selo_natal": None,
        "texto_curado_selo": None,
        "texto_curado_tom": None,
        "personalization_status": "NOT_AUTHORIZED",
        "authorized_relations": [],
        "natal_selo_autorizado": None,
        "natal_oracle_context": {},
    }
    base.update(overrides)
    return base


def _resposta_v1_1(**overrides) -> RespostaGerada:
    base = dict(
        relation_mode="CONTRAST",
        symbolic_relation="receptividade × sintonia",
        human_experience="a diferença entre procurar uma resposta e estar disponível para perceber o que chega",
        reflection="Parágrafo 1.\n\nParágrafo 2.\n\nParágrafo 3.",
        question="O que você percebe, se parar um momento para notar?",
    )
    base.update(overrides)
    return RespostaGerada(**base)


class _ClienteFakeV1_1:
    def __init__(self, respostas_gerar, respostas_auditar):
        self.respostas_gerar = list(respostas_gerar)
        self.respostas_auditar = list(respostas_auditar)
        self.n_gerar = 0
        self.n_auditar = 0

    def gerar(self, prompt):
        r = self.respostas_gerar[self.n_gerar]
        self.n_gerar += 1
        return r

    def auditar(self, resposta, payload):
        r = self.respostas_auditar[self.n_auditar]
        self.n_auditar += 1
        return r


def _limpar(session, participante_id):
    session.query(ResultadoRelevancia).filter_by(participante_id=participante_id).delete()
    session.query(MomentoDiario).filter_by(participante_id=participante_id).delete()
    session.commit()


def _get_or_create_participante(session) -> Participante:
    p = session.query(Participante).filter_by(nome=NOME_TESTE).first()
    if p is not None:
        _limpar(session, p.id)
        return p
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


def _cliente_auditor_v1_1_stub(dados_resposta_auditor: dict) -> GPT56SolClient:
    """Instancia GPT56SolClient SEM passar por __init__ (que exige
    OPENAI_API_KEY e cria um client real) -- so pra testar a logica
    deterministica de _auditar_v1_1 contra uma resposta JSON canned,
    igual ao padrao de client.get monkeypatchado em test_geocoding.py."""
    cliente = object.__new__(GPT56SolClient)
    saida_fake = SimpleNamespace(output_text=json.dumps(dados_resposta_auditor))
    cliente._client = SimpleNamespace(
        responses=SimpleNamespace(create=lambda **kwargs: saida_fake)
    )
    return cliente


def main():
    n_pass = n_fail = 0

    def check(label, cond):
        nonlocal n_pass, n_fail
        n_pass += bool(cond)
        n_fail += not cond
        print(f"{'PASS' if cond else 'FAIL':6} {label}")

    # --- 1. construir_prompt v1.1 -- autorizado x nao autorizado x multiplas -
    p_nao_autorizado = construir_prompt(_payload_base(), PROMPT_VERSION_V1_1)
    check("NOT_AUTHORIZED: prompt diz 'nenhuma' relação autorizada", "Relações autorizadas hoje: nenhuma" in p_nao_autorizado)
    check("NOT_AUTHORIZED: prompt NÃO menciona nenhuma posição de Oráculo",
          "posição de" not in p_nao_autorizado and "mesmo Selo do mapa natal" not in p_nao_autorizado)

    p_same_seal = construir_prompt(_payload_base(authorized_relations=["SAME_SEAL"]), PROMPT_VERSION_V1_1)
    check("SAME_SEAL autorizado: prompt menciona 'mesmo Selo do mapa natal'",
          "mesmo Selo do mapa natal" in p_same_seal)
    check("SAME_SEAL autorizado: prompt NÃO diz 'nenhuma'", "Relações autorizadas hoje: nenhuma" not in p_same_seal)

    p_multi = construir_prompt(
        _payload_base(authorized_relations=["ANTIPODE_MATCH", "OCCULT_MATCH"]), PROMPT_VERSION_V1_1
    )
    check("2 relações autorizadas: prompt menciona Antípoda", "Antípoda" in p_multi)
    check("2 relações autorizadas: prompt menciona Oculto", "Oculto" in p_multi)
    check("2 relações autorizadas: prompt NÃO menciona Guia/Análogo (não autorizados)",
          "Guia (poder" not in p_multi and "Análogo (poder" not in p_multi)

    check("Prompt v1.1 pede as 5 chaves certas no JSON",
          all(chave in p_nao_autorizado for chave in
              ['"relation_mode"', '"symbolic_relation"', '"human_experience"', '"reflection"', '"question"']))

    # Motivo de reescrita anexado (mesmo mecanismo das outras versões).
    p_reescrita = construir_prompt(_payload_base(), PROMPT_VERSION_V1_1, motivo_reprovacao="teste de motivo")
    check("Motivo de reprovação anexado ao prompt de reescrita v1.1", "teste de motivo" in p_reescrita)

    # --- 2. verificar_guardrail escaneia os campos novos --------------------
    resposta_suja_via_human_experience = _resposta_v1_1(
        human_experience="isso vai acontecer com você amanhã sem falta"
    )
    motivos = verificar_guardrail(resposta_suja_via_human_experience)
    check("Guardrail pega padrão proibido vazando SÓ em human_experience (não em reflection/question)",
          len(motivos) > 0)

    resposta_limpa = _resposta_v1_1()
    check("Guardrail aprova resposta v1.1 limpa", verificar_guardrail(resposta_limpa) == [])

    # --- 3. _rodar_pipeline_qa fim a fim (payload sintético, sem banco) -----
    payload_autorizado = _payload_base(
        personalization_status="AUTHORIZED",
        authorized_relations=["GUIDE_MATCH"],
        natal_oracle_context={"natal_guide_seal": "Mago"},
    )
    cliente = _ClienteFakeV1_1(
        respostas_gerar=[_resposta_v1_1()],
        respostas_auditar=[ResultadoAuditoria(aprovado=True, motivo="", detalhes={"personalization_supported_by_relevance": True})],
    )
    resposta, status_qa, _ = _rodar_pipeline_qa(payload_autorizado, PROMPT_VERSION_V1_1, cliente)
    check("Pipeline v1.1 (resposta limpa, auditor aprova) -> APPROVED_FIRST_TRY", status_qa == STATUS_APPROVED_FIRST_TRY)
    check("Pipeline v1.1: relation_mode preservado na resposta publicada", resposta.relation_mode == "CONTRAST")
    check("Pipeline v1.1: exatamente 1 chamada a gerar()", cliente.n_gerar == 1)

    cliente_reescrita = _ClienteFakeV1_1(
        respostas_gerar=[_resposta_v1_1(), _resposta_v1_1(symbolic_relation="outra formulação")],
        respostas_auditar=[
            ResultadoAuditoria(aprovado=False, motivo="forced_opposition"),
            ResultadoAuditoria(aprovado=True, motivo=""),
        ],
    )
    resposta_r, status_qa_r, resumo_r = _rodar_pipeline_qa(payload_autorizado, PROMPT_VERSION_V1_1, cliente_reescrita)
    check("Pipeline v1.1 (auditor reprova 1x) -> APPROVED_AFTER_REWRITE", status_qa_r == STATUS_APPROVED_AFTER_REWRITE)
    check("Pipeline v1.1: motivo da reprovação foi anexado", "forced_opposition" in resumo_r.get("motivo_reescrita", ""))

    # Gap de observabilidade corrigido (20/08/2026, apos investigacao dos 2
    # fallbacks da bateria v1.1.1): quando as 2 tentativas reprovam, os
    # DOIS motivos ficam em resumo_derivacao -- antes disso, so
    # {"tentativa": "fallback"}, sem motivo nenhum (impossivel investigar
    # um fallback real em producao sem reproduzir a chamada).
    cliente_2_falhas = _ClienteFakeV1_1(
        respostas_gerar=[_resposta_v1_1(), _resposta_v1_1(symbolic_relation="outra formulação")],
        respostas_auditar=[
            ResultadoAuditoria(aprovado=False, motivo="motivo da 1a reprovação"),
            ResultadoAuditoria(aprovado=False, motivo="motivo da 2a reprovação"),
        ],
    )
    resposta_f, status_qa_f, resumo_f = _rodar_pipeline_qa(payload_autorizado, PROMPT_VERSION_V1_1, cliente_2_falhas)
    check("2 falhas seguidas -> resposta None (fallback)", resposta_f is None)
    check("2 falhas seguidas -> status FALLBACK_CURATED", status_qa_f == "FALLBACK_CURATED")
    check("Fallback: resumo_derivacao tem motivo_reprovacao_1", resumo_f.get("motivo_reprovacao_1") == "motivo da 1a reprovação")
    check("Fallback: resumo_derivacao tem motivo_reprovacao_2", resumo_f.get("motivo_reprovacao_2") == "motivo da 2a reprovação")

    # --- 4. montar_payload_minimo real (Postgres) -- Gate 1.5 integrado -----
    session = get_session()
    participante = None
    try:
        participante = _get_or_create_participante(session)
        gerar_ou_obter_perfil_dreamspell(session, participante, DreamspellAdapter())

        # Dia seguinte ao nascimento -- mesmo caso de test_a4_relevance.py:
        # Selo Cão == Selo Análogo natal de Guilherme -> ANALOG_MATCH.
        momento = obter_ou_criar_momento_diario(
            session, participante,
            now=datetime.datetime(1988, 8, 26, 15, 0, tzinfo=datetime.timezone.utc),
        )
        resultado = obter_ou_criar_resultado_relevancia(session, participante, momento)
        payload_real = montar_payload_minimo(session, momento, resultado)
        check("Payload real: personalization_status == AUTHORIZED", payload_real["personalization_status"] == "AUTHORIZED")
        check("Payload real: authorized_relations == ['ANALOG_MATCH']", payload_real["authorized_relations"] == ["ANALOG_MATCH"])
        check("Payload real: natal_selo_autorizado == Lua (Selo natal, não o de hoje)",
              payload_real["natal_selo_autorizado"] == "Lua")
        check("Payload real: natal_oracle_context tem SÓ natal_analog_seal (não guide/antipode/occult)",
              set(payload_real["natal_oracle_context"].keys()) == {"natal_analog_seal"})
        check("Payload real: natal_analog_seal == Cão (o Selo de hoje, confirmando a posição)",
              payload_real["natal_oracle_context"]["natal_analog_seal"] == "Cao")

        prompt_real = construir_prompt(payload_real, PROMPT_VERSION_V1_1)
        check("Prompt v1.1 com payload REAL menciona Análogo", "Análogo" in prompt_real)
    finally:
        if participante is not None:
            _limpar(session, participante.id)
            session.query(PerfilNatalDreamspell).filter_by(participante_id=participante.id).delete()
            session.delete(session.query(Participante).filter_by(nome=NOME_TESTE).first())
        session.commit()
        session.close()

    # --- 5. GPT56SolClient._auditar_v1_1 -- override determinístico ---------
    # (auditor COMPARTILHADO por v1.1 e v1.1.1 -- ver docstring de
    # _auditar_v1_1 em modelo_gpt56sol.py)
    resposta_candidata = _resposta_v1_1()
    payload_auditoria = _payload_base(personalization_status="AUTHORIZED", authorized_relations=["SAME_SEAL"])

    _LIMPO = {  # os 4 campos bloqueantes, todos "sem violação"
        "invented_user_context": False, "forced_opposition": False,
        "stronger_mode_used_without_need": False, "personalization_supported_by_relevance": True,
    }

    # Modelo diz aprovado=true, mas invented_user_context=true -> override reprova.
    cliente_stub = _cliente_auditor_v1_1_stub({
        "aprovado": True, "motivo": "",
        "human_experience_supported_by_inputs": True, **{**_LIMPO, "invented_user_context": True},
        "narrative_adds_meaning_not_facts": True,
        "question_derives_from_human_experience": True, "relation_mode_supported_by_inputs": True,
    })
    r1 = cliente_stub.auditar(resposta_candidata, payload_auditoria)
    check("Override: invented_user_context=true força aprovado=False mesmo com aprovado=true do modelo",
          r1.aprovado is False)
    check("Override: motivo explica invented_user_context quando o modelo não deu motivo", "invented_user_context" in r1.motivo)

    # Modelo diz aprovado=true, mas forced_opposition=true -> override reprova.
    cliente_stub2 = _cliente_auditor_v1_1_stub({"aprovado": True, "motivo": "", **{**_LIMPO, "forced_opposition": True}})
    r2 = cliente_stub2.auditar(resposta_candidata, payload_auditoria)
    check("Override: forced_opposition=true força aprovado=False", r2.aprovado is False)

    # Modelo diz aprovado=true, mas personalization_supported_by_relevance=false -> override reprova.
    cliente_stub3 = _cliente_auditor_v1_1_stub({
        "aprovado": True, "motivo": "", **{**_LIMPO, "personalization_supported_by_relevance": False},
    })
    r3 = cliente_stub3.auditar(resposta_candidata, payload_auditoria)
    check("Override: personalization_supported_by_relevance=false força aprovado=False", r3.aprovado is False)

    # v1.1.1: modelo diz aprovado=true, mas stronger_mode_used_without_need=true -> override reprova
    # (ex.: escolheu COMPLEMENTARITY sem evidência, quando SIMPLE_LENS bastava).
    cliente_stub_forte = _cliente_auditor_v1_1_stub({
        "aprovado": True, "motivo": "", **{**_LIMPO, "stronger_mode_used_without_need": True},
    })
    r_forte = cliente_stub_forte.auditar(resposta_candidata, payload_auditoria)
    check("Override (v1.1.1): stronger_mode_used_without_need=true força aprovado=False",
          r_forte.aprovado is False)
    check("Override (v1.1.1): motivo explica stronger_mode_used_without_need quando o modelo não deu motivo",
          "stronger_mode_used_without_need" in r_forte.motivo)

    # Modelo diz aprovado=true e os 4 campos bloqueantes estão limpos -> aprova de verdade.
    cliente_stub4 = _cliente_auditor_v1_1_stub({"aprovado": True, "motivo": "", **_LIMPO})
    r4 = cliente_stub4.auditar(resposta_candidata, payload_auditoria)
    check("Override: os 4 bloqueantes limpos -> aprovado permanece True", r4.aprovado is True)
    check("detalhes carrega os 8 campos estruturados (6 da v1.1 + 2 do ajuste v1.1.1)", set(r4.detalhes.keys()) == {
        "human_experience_supported_by_inputs", "invented_user_context", "forced_opposition",
        "narrative_adds_meaning_not_facts", "question_derives_from_human_experience",
        "personalization_supported_by_relevance",
        "relation_mode_supported_by_inputs", "stronger_mode_used_without_need",
    })

    # Chave ausente no JSON do modelo (omissão) -> default conservador (reprova).
    cliente_stub5 = _cliente_auditor_v1_1_stub({"aprovado": True, "motivo": ""})
    r5 = cliente_stub5.auditar(resposta_candidata, payload_auditoria)
    check("Override: campos bloqueantes AUSENTES do JSON -> default conservador reprova (não confia no silêncio)",
          r5.aprovado is False)

    # --- 6. construir_prompt v1.1.1 -- ajuste do relation_mode ---------------
    from app.alpha.interpretation import PROMPT_VERSION_V1_1_1, _INSTRUCOES_BASE_V1_1

    p_v1_1_1 = construir_prompt(_payload_base(authorized_relations=["SAME_SEAL"]), PROMPT_VERSION_V1_1_1)
    check("Prompt v1.1.1 explica a escala de força interpretativa dos 5 modos",
          "SIMPLE_LENS" in p_v1_1_1 and "ENCOUNTER" in p_v1_1_1 and "TENSION" in p_v1_1_1
          and "força interpretativa" in p_v1_1_1)
    check("Prompt v1.1.1 tem a regra de desempate pro modo mais fraco", "REGRA DE DESEMPATE" in p_v1_1_1)
    check("Prompt v1.1.1 proíbe explicitamente escolher modo pela profundidade da narrativa",
          "renderia uma reflexão mais interessante" in p_v1_1_1)
    check("Prompt v1.1.1 diz que não existe distribuição-alvo", "NÃO EXISTE DISTRIBUIÇÃO-ALVO" in p_v1_1_1)
    check("Prompt v1.1.1 continua pedindo as mesmas 5 chaves no JSON (schema não mudou)",
          all(chave in p_v1_1_1 for chave in
              ['"relation_mode"', '"symbolic_relation"', '"human_experience"', '"reflection"', '"question"']))
    check("Prompt v1.1.1 mantém a etapa 4 (Experiência Humana) e 5 (Arco Narrativo) intactas",
          "EXPERIÊNCIA HUMANA" in p_v1_1_1 and "ARCO NARRATIVO" in p_v1_1_1)
    check("Prompt v1.1.1 mantém a regra do mapa natal (relações autorizadas)",
          "SAME_SEAL" not in p_v1_1_1  # o token não vaza cru
          and "mesmo Selo do mapa natal" in p_v1_1_1)

    # v1.1 (a original) fica CONGELADA -- não ganhou a escala/regra de desempate.
    p_v1_1 = construir_prompt(_payload_base(), PROMPT_VERSION_V1_1)
    check("v1.1 (original) NÃO foi alterada -- não tem a escala de força interpretativa nova",
          "força interpretativa" not in p_v1_1 and "REGRA DE DESEMPATE" not in p_v1_1)
    check("v1.1 (original) continua com a instrução antiga (mais curta) do modo",
          "escolha UM destes cinco modos" in _INSTRUCOES_BASE_V1_1)

    print(f"\nResumo Interpretation Prompt v1.1: {n_pass} PASS | {n_fail} FAIL")
    return n_fail == 0


if __name__ == "__main__":
    import sys
    sys.exit(0 if main() else 1)
