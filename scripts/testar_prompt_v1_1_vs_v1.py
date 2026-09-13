"""
testar_prompt_v1_1_vs_v1.py

Protocolo de teste da candidata PROMPT_VERSION_V1_1 (app/alpha/
interpretation.py, Gate 1.5, 20/08/2026) -- roda a versao ATUAL de
producao (PROMPT_VERSION, hoje == a candidata de tensao promovida em
19/08/2026) e a CANDIDATA v1.1 lado a lado, pelo pipeline de QA real
(guardrail deterministico + auditor isolado, incluindo o auditor
estruturado de 6 campos da v1.1 -- ver app/alpha/modelo_gpt56sol.py),
usando o GPT-5.6 Sol de verdade. Mesmo protocolo/formato de
scripts/testar_prompt_candidato_tensao.py (que promoveu a versao atual).

*** GASTA DINHEIRO REAL *** (mesma chave/billing do projeto "presente" na
OpenAI). Nao roda em CI, nao faz parte de tests/ (que so roda contra
ClienteSimulado/stubs, sem rede -- ver tests/test_v1_1_interpretation.py
pra cobertura deterministica da logica nova). Script manual, sob demanda.

NAO publica nada em LeituraDiaria -- usa _rodar_pipeline_qa() diretamente,
com payloads sinteticos (nao um MomentoDiario/participante real).

Casos de teste:
  - Os mesmos 8 pares Selo/Tom do protocolo anterior (continuidade de
    comparacao -- cobrem NONE e 1 caso SAME_SEAL).
  - 4 pares NOVOS, um pra cada posicao do Oraculo (Gate 1.5) -- GUIDE_
    MATCH/ANALOG_MATCH/ANTIPODE_MATCH/OCCULT_MATCH -- que a versao de
    producao/tensao NAO sabe personalizar (elas so reconhecem SAME_SEAL)
    mas a v1.1 deveria conseguir mencionar como relacao autorizada.
    Selo natal de referencia: Lua, Tom Cosmico (13) -- mesma pessoa dos
    outros testes do Gate 1/1.5, posicoes calculadas pelo motor real
    (nao hardcoded 2x).

Uso:
    source .venv/bin/activate
    env -u SSL_CERT_FILE -u REQUESTS_CA_BUNDLE -u CURL_CA_BUNDLE -u OPENAI_API_KEY \
        python3 -m scripts.testar_prompt_v1_1_vs_v1
"""
import json
import sys

from app.alpha.interpretation import (
    PROMPT_VERSION,
    PROMPT_VERSION_V1_1,
    STATUS_APPROVED_FIRST_TRY,
    STATUS_APPROVED_AFTER_REWRITE,
    _rodar_pipeline_qa,
)
from app.alpha.modelo_gpt56sol import GPT56SolClient
from app.alpha.relevance import (
    NIVEL_ANALOG_MATCH,
    NIVEL_ANTIPODE_MATCH,
    NIVEL_GUIDE_MATCH,
    NIVEL_NONE,
    NIVEL_OCCULT_MATCH,
    NIVEL_SAME_SEAL,
)
from app.db.session import get_session
from app.knowledge import buscar_conhecimento
from app.engines.dreamspell_engine import (
    analog_seal,
    antipode_seal,
    guide_seal,
    numero_do_tom,
    occult_seal,
)

# --- Os 8 pares originais (continuidade com o protocolo anterior) ----------
PARES_ORIGINAIS = [
    {"selo": "Caminhante do Ceu", "tom": "Ritmico", "nivel": NIVEL_NONE},
    {"selo": "Guerreiro", "tom": "Cristal", "nivel": NIVEL_NONE},
    {"selo": "Terra", "tom": "Eletrico", "nivel": NIVEL_NONE},
    {"selo": "Serpente", "tom": "Magnetico", "nivel": NIVEL_NONE},
    {"selo": "Espelho", "tom": "Cosmico", "nivel": NIVEL_NONE},
    {"selo": "Mago", "tom": "Lunar", "nivel": NIVEL_SAME_SEAL},
    {"selo": "Sol", "tom": "Overtonal", "nivel": NIVEL_NONE},
    {"selo": "Noite", "tom": "Planetario", "nivel": NIVEL_NONE},
]

# --- 4 pares novos -- 1 por posicao do Oraculo (Gate 1.5) ------------------
# Pessoa de referencia: Selo natal Lua, Tom natal Cosmico (13) -- mesma
# convencao do Golden Profile de Guilherme usada em todo o Gate 1/1.5.
_NATAL_SELO = "Lua"
_NATAL_TOM_NUMERO = 13
PARES_ORACULO = [
    {"selo": guide_seal(_NATAL_SELO, _NATAL_TOM_NUMERO), "tom": "Ritmico", "nivel": NIVEL_GUIDE_MATCH},
    {"selo": analog_seal(_NATAL_SELO), "tom": "Eletrico", "nivel": NIVEL_ANALOG_MATCH},
    {"selo": antipode_seal(_NATAL_SELO), "tom": "Solar", "nivel": NIVEL_ANTIPODE_MATCH},
    {"selo": occult_seal(_NATAL_SELO), "tom": "Espectral", "nivel": NIVEL_OCCULT_MATCH},
]

PARES = PARES_ORIGINAIS + PARES_ORACULO

VERSOES = [
    ("producao_atual", PROMPT_VERSION),
    ("candidata_v1_1", PROMPT_VERSION_V1_1),
]


def montar_payload(session, selo: str, tom: str, nivel: str) -> dict:
    c_selo = buscar_conhecimento(session, "dreamspell", "selo", selo)
    c_tom = buscar_conhecimento(session, "dreamspell", "tom", str(numero_do_tom(tom)))

    autorizadas = [] if nivel == NIVEL_NONE else [nivel]
    natal_oracle_context = {}
    campo_por_nivel = {
        NIVEL_GUIDE_MATCH: "natal_guide_seal",
        NIVEL_ANALOG_MATCH: "natal_analog_seal",
        NIVEL_ANTIPODE_MATCH: "natal_antipode_seal",
        NIVEL_OCCULT_MATCH: "natal_occult_seal",
    }
    if nivel in campo_por_nivel:
        natal_oracle_context[campo_por_nivel[nivel]] = selo  # o Selo de hoje == a posicao natal, por definicao de match

    return {
        "selo_hoje": selo,
        "tom_hoje": tom,
        "tipo_dia": "REGULAR",
        "nivel_relacao": nivel,
        "selo_natal": selo if nivel == NIVEL_SAME_SEAL else None,
        "texto_curado_selo": c_selo.texto_curado if c_selo is not None else None,
        "texto_curado_tom": c_tom.texto_curado if c_tom is not None else None,
        "personalization_status": "AUTHORIZED" if autorizadas else "NOT_AUTHORIZED",
        "authorized_relations": autorizadas,
        "natal_selo_autorizado": (_NATAL_SELO if nivel in campo_por_nivel else (selo if nivel == NIVEL_SAME_SEAL else None)),
        "natal_oracle_context": natal_oracle_context,
    }


def main():
    session = get_session()
    modelo = GPT56SolClient()

    resultados = {label: [] for label, _ in VERSOES}

    for par in PARES:
        payload = montar_payload(session, par["selo"], par["tom"], par["nivel"])
        for label, versao in VERSOES:
            print(f"--- {par['selo']} + {par['tom']} ({payload['nivel_relacao']}) -- versao={label} ---", file=sys.stderr)
            resposta, status_qa, resumo = _rodar_pipeline_qa(payload, versao, modelo)
            aprovado = status_qa in (STATUS_APPROVED_FIRST_TRY, STATUS_APPROVED_AFTER_REWRITE)
            resultados[label].append({
                "selo": par["selo"],
                "tom": par["tom"],
                "nivel_relacao": payload["nivel_relacao"],
                "status_qa": status_qa,
                "aprovado": aprovado,
                "reflection": resposta.reflection if resposta else None,
                "question": resposta.question if resposta else None,
                "tension": resposta.tension if resposta else None,
                "relation_mode": resposta.relation_mode if resposta else None,
                "symbolic_relation": resposta.symbolic_relation if resposta else None,
                "human_experience": resposta.human_experience if resposta else None,
                "motivo_reescrita": resumo.get("motivo_reescrita"),
            })
            print(f"    status_qa={status_qa}", file=sys.stderr)

    # --- Resumo ------------------------------------------------------------
    print("\n" + "=" * 80)
    print("RESUMO -- taxa de aprovacao/reprovacao por versao")
    print("=" * 80)
    for label, _ in VERSOES:
        linhas = resultados[label]
        n_aprovado = sum(1 for l in linhas if l["aprovado"])
        n_total = len(linhas)
        print(f"\n{label}: {n_aprovado}/{n_total} aprovados ({100 * n_aprovado / n_total:.0f}%)")
        for l in linhas:
            marca = "OK" if l["aprovado"] else "FALHOU"
            print(f"  [{marca}] {l['selo']} + {l['tom']} ({l['nivel_relacao']}) -> {l['status_qa']}")

    # --- Textos completos das duas versoes, lado a lado ---------------------
    print("\n" + "=" * 80)
    print("TEXTOS COMPLETOS -- lado a lado")
    print("=" * 80)
    for i, par in enumerate(PARES):
        print(f"\n### {par['selo']} + {par['tom']} ({par['nivel']})")
        for label, _ in VERSOES:
            l = resultados[label][i]
            print(f"\n-- {label} -- {l['status_qa']}")
            if l["aprovado"]:
                if l["relation_mode"]:
                    print(f"   relation_mode: {l['relation_mode']}")
                    print(f"   symbolic_relation: {l['symbolic_relation']}")
                    print(f"   human_experience: {l['human_experience']}")
                elif l["tension"]:
                    print(f"   tension: {l['tension']}")
                print(f"   reflection: {l['reflection']}")
                print(f"   question: {l['question']}")
            else:
                print(f"   (reprovado -- motivo da reescrita, se houve: {l['motivo_reescrita']})")

    with open("scripts/_resultado_teste_prompt_v1_1_vs_v1.json", "w") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)
    print("\nResultado completo salvo em scripts/_resultado_teste_prompt_v1_1_vs_v1.json")

    session.close()


if __name__ == "__main__":
    main()
