"""
smoke_test_promocao_v1_1_1.py

Smoke test pontual (20/08/2026) pra confirmar que a promocao de
PROMPT_VERSION_V1_1_1 a producao (app/alpha/interpretation.py) esta
efetivamente em vigor na stack real: chama obter_ou_publicar_leitura_diaria
SEM passar versao_prompt explicitamente (usa o default de verdade -- o
mesmo caminho que app/routes_experiencia.py usa), com o GPT56SolClient
real, e confere que a LeituraDiaria publicada:
  1. tem versao_prompt == PROMPT_VERSION_V1_1_1;
  2. tem reflexao/pergunta preenchidas (nao vazias);
  3. tem resumo_derivacao com a observabilidade completa registrada nesta
     sessao: tentativas (relation_mode/symbolic_relation/human_experience/
     narrative_arc/auditoria por tentativa), relationships_checked,
     authorized_relations, versao_prompt, modelo.

*** GASTA DINHEIRO REAL *** (1 caso, ate 2 chamadas gerar() + 2
chamadas auditar()). Nao roda em CI -- confirmação manual pos-promocao.

Uso:
    source .venv/bin/activate
    env -u SSL_CERT_FILE -u REQUESTS_CA_BUNDLE -u CURL_CA_BUNDLE -u OPENAI_API_KEY \
        python3 -m scripts.smoke_test_promocao_v1_1_1
"""
import datetime
import json
import sys

from app.adapters.dreamspell_adapter import DreamspellAdapter
from app.alpha.daily_moment import obter_ou_criar_momento_diario
from app.alpha.interpretation import PROMPT_VERSION, PROMPT_VERSION_V1_1_1, obter_ou_publicar_leitura_diaria
from app.alpha.modelo_gpt56sol import MODEL_ID, GPT56SolClient
from app.alpha.relevance import obter_ou_criar_resultado_relevancia
from app.db.models import LeituraDiaria, MomentoDiario, Participante, PerfilNatalDreamspell, ResultadoRelevancia
from app.db.session import get_session
from app.pessoa import gerar_ou_obter_perfil_dreamspell

NOME_TESTE = "_smoke_promocao_v1_1_1"


def _limpar(session, participante_id):
    session.query(LeituraDiaria).filter_by(participante_id=participante_id).delete()
    session.query(ResultadoRelevancia).filter_by(participante_id=participante_id).delete()
    session.query(MomentoDiario).filter_by(participante_id=participante_id).delete()
    session.commit()


def main():
    n_pass = n_fail = 0

    def check(label, cond):
        nonlocal n_pass, n_fail
        n_pass += bool(cond)
        n_fail += not cond
        print(f"{'PASS' if cond else 'FAIL':6} {label}")

    check("PROMPT_VERSION (default de producao) == PROMPT_VERSION_V1_1_1", PROMPT_VERSION == PROMPT_VERSION_V1_1_1)

    session = get_session()
    participante = None
    try:
        p = session.query(Participante).filter_by(nome=NOME_TESTE).first()
        if p is not None:
            _limpar(session, p.id)
            participante = p
        else:
            participante = Participante(
                nome=NOME_TESTE,
                nome_completo_nascimento="Smoke Test Promocao v1.1.1",
                data_nascimento=datetime.date(1988, 8, 25),
                hora_nascimento=datetime.time(0, 40),
                local_nascimento_texto="Cachoeirinha, RS, Brasil",
                latitude=-29.95, longitude=-51.09,
                timezone_nascimento="America/Sao_Paulo", timezone_atual="America/Sao_Paulo",
                confiabilidade_hora="alta",
            )
            session.add(participante)
            session.commit()
            session.refresh(participante)

        gerar_ou_obter_perfil_dreamspell(session, participante, DreamspellAdapter())

        momento = obter_ou_criar_momento_diario(session, participante)
        resultado = obter_ou_criar_resultado_relevancia(session, participante, momento)

        # Chamada SEM versao_prompt explicito -- exatamente o caminho real
        # usado por app/routes_experiencia.py::pagina_presente().
        leitura = obter_ou_publicar_leitura_diaria(session, participante, momento, resultado, GPT56SolClient())

        check("LeituraDiaria.versao_prompt == PROMPT_VERSION_V1_1_1 (promoção em vigor de ponta a ponta)",
              leitura.versao_prompt == PROMPT_VERSION_V1_1_1)
        check("status_qa é um dos esperados (não HUNAB_KU -- hoje é dia regular)",
              leitura.status_qa in ("APPROVED_FIRST_TRY", "APPROVED_AFTER_REWRITE", "FALLBACK_CURATED"))
        check("reflexao publicada, não vazia", bool(leitura.reflexao))
        check("pergunta publicada, não vazia", bool(leitura.pergunta))

        rd = leitura.resumo_derivacao
        check("resumo_derivacao.versao_prompt == PROMPT_VERSION_V1_1_1", rd.get("versao_prompt") == PROMPT_VERSION_V1_1_1)
        check("resumo_derivacao.modelo == MODEL_ID (rastreamento de qual modelo gerou)", rd.get("modelo") == MODEL_ID)
        check("resumo_derivacao.tentativas presente, com pelo menos 1 tentativa", len(rd.get("tentativas") or []) >= 1)
        check("resumo_derivacao.authorized_relations presente (lista, mesmo que vazia)",
              "authorized_relations" in rd and isinstance(rd["authorized_relations"], list))
        check("resumo_derivacao.relationships_checked presente (dump completo do Gate 1)",
              "relationships_checked" in rd and isinstance(rd["relationships_checked"], dict))

        t1 = rd["tentativas"][0]
        check("tentativa 1: tem relation_mode/symbolic_relation/human_experience/narrative_arc registrados",
              all(k in t1 for k in ("relation_mode", "symbolic_relation", "human_experience", "narrative_arc")))
        check("tentativa 1: tem 'auditoria' registrada (aprovado/motivo/detalhes) ou None (se guardrail reprovou antes)",
              "auditoria" in t1)
        if t1.get("aprovado"):
            check("tentativa 1 aprovada: relation_mode é um dos 5 modos válidos",
                  t1["relation_mode"] in ("TENSION", "CONTRAST", "COMPLEMENTARITY", "ENCOUNTER", "SIMPLE_LENS"))

        if leitura.status_qa == "FALLBACK_CURATED":
            check("fallback: motivo_reprovacao_1 registrado", bool(rd.get("motivo_reprovacao_1")))
            check("fallback: motivo_reprovacao_2 registrado", bool(rd.get("motivo_reprovacao_2")))
            check("fallback: motivo_fallback (resumo combinado) registrado", bool(rd.get("motivo_fallback")))
        elif leitura.status_qa == "APPROVED_AFTER_REWRITE":
            check("reescrita: motivo_reescrita registrado", bool(rd.get("motivo_reescrita")))
            check("reescrita: 2 tentativas no log", len(rd["tentativas"]) == 2)

        print("\n--- resumo_derivacao completo (pra inspeção humana) ---")
        print(json.dumps(rd, ensure_ascii=False, indent=2, default=str))

    finally:
        if participante is not None:
            _limpar(session, participante.id)
            session.query(PerfilNatalDreamspell).filter_by(participante_id=participante.id).delete()
            session.delete(session.query(Participante).filter_by(nome=NOME_TESTE).first())
        session.commit()
        session.close()

    print(f"\nResumo smoke test (promoção v1.1.1): {n_pass} PASS | {n_fail} FAIL")
    return n_fail == 0


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
