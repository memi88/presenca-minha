"""
testar_prompt_v1_1_1_relation_mode.py

Protocolo de teste da candidata PROMPT_VERSION_V1_1_1 (app/alpha/
interpretation.py, ajuste pontual da etapa 3/MODO DA RELAÇÃO da v1.1,
20/08/2026) -- roda SO a v1.1.1 (nao re-roda v1.1/producao, que ja tem
resultado salvo em scripts/_resultado_teste_prompt_v1_1_vs_v1.json; este
script LE aquele arquivo pra comparar a distribuicao de relation_mode
antes/depois nos 12 pares em comum).

*** GASTA DINHEIRO REAL *** (mesma chave/billing do projeto "presente" na
OpenAI). 42 pares x 1 versao (v1.1.1) -- ate 2 chamadas gerar() + 2
chamadas auditar() por par no pior caso (reescrita). Nao roda em CI.

Casos:
  - 12 pares de regressao -- OS MESMOS da bateria anterior (importados de
    scripts/testar_prompt_v1_1_vs_v1.py, nao duplicados), pra comparar
    relation_mode ANTES (v1.1, 11/12 COMPLEMENTARITY) x DEPOIS (v1.1.1).
  - 30 pares novos: 14 NONE (arquétipos variados, sem repetir os 8
    originais), 4 SAME_SEAL, 12 de Oraculo (3 referencias natais NOVAS --
    Guerreiro/Ressonante, Espelho/Auto-Existente, Serpente/Planetario --
    cada uma cobrindo um grupo de deslocamento do Guia diferente dos ja
    testados, x 4 posicoes cada).

Uso:
    source .venv/bin/activate
    env -u SSL_CERT_FILE -u REQUESTS_CA_BUNDLE -u CURL_CA_BUNDLE -u OPENAI_API_KEY \
        python3 -m scripts.testar_prompt_v1_1_1_relation_mode
"""
import json
import sys
from collections import Counter

from app.alpha.interpretation import (
    PROMPT_VERSION_V1_1_1,
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
    SEALS,
    TONES,
    analog_seal,
    antipode_seal,
    guide_seal,
    numero_do_tom,
    occult_seal,
)
from scripts.testar_prompt_v1_1_vs_v1 import PARES as PARES_REGRESSAO

# --- 14 NONE novos (nao repetem os 8 da bateria anterior) ------------------
PARES_NONE_NOVOS = [
    {"selo": "Mago", "tom": "Eletrico", "nivel": NIVEL_NONE},
    {"selo": "Enlacador de Mundos", "tom": "Cristal", "nivel": NIVEL_NONE},
    {"selo": "Vento", "tom": "Solar", "nivel": NIVEL_NONE},
    {"selo": "Aguia", "tom": "Magnetico", "nivel": NIVEL_NONE},
    {"selo": "Cao", "tom": "Ritmico", "nivel": NIVEL_NONE},
    {"selo": "Humano", "tom": "Galactico", "nivel": NIVEL_NONE},
    {"selo": "Estrela", "tom": "Auto-Existente", "nivel": NIVEL_NONE},
    {"selo": "Semente", "tom": "Espectral", "nivel": NIVEL_NONE},
    {"selo": "Dragao", "tom": "Overtonal", "nivel": NIVEL_NONE},
    {"selo": "Tempestade", "tom": "Ritmico", "nivel": NIVEL_NONE},
    {"selo": "Macaco", "tom": "Cosmico", "nivel": NIVEL_NONE},
    {"selo": "Guerreiro", "tom": "Lunar", "nivel": NIVEL_NONE},
    {"selo": "Espelho", "tom": "Solar", "nivel": NIVEL_NONE},
    {"selo": "Terra", "tom": "Cristal", "nivel": NIVEL_NONE},
]

# --- 4 SAME_SEAL novos (varia Selo/Tom -- Tom nao importa pra SAME_SEAL) --
PARES_SAME_SEAL_NOVOS = [
    {"selo": "Noite", "tom": "Galactico", "nivel": NIVEL_SAME_SEAL},
    {"selo": "Sol", "tom": "Eletrico", "nivel": NIVEL_SAME_SEAL},
    {"selo": "Serpente", "tom": "Espectral", "nivel": NIVEL_SAME_SEAL},
    {"selo": "Humano", "tom": "Ritmico", "nivel": NIVEL_SAME_SEAL},
]

# --- 12 pares de Oraculo -- 3 referencias natais NOVAS (nao Lua/Cosmico,
# ja testada na bateria anterior), escolhidas pra cobrir 3 grupos de
# deslocamento do Guia diferentes entre si e diferentes do grupo de Lua
# (Cosmico=13, grupo {3,8,13}):
#   Guerreiro/Ressonante(7)     -> grupo {2,7,12}, offset +12
#   Espelho/Auto-Existente(4)   -> grupo {4,9},     offset +16 (-4)
#   Serpente/Planetario(10)     -> grupo {5,10},    offset +8
_REFERENCIAS_ORACULO = [
    ("Guerreiro", "Ressonante"),
    ("Espelho", "Auto-Existente"),
    ("Serpente", "Planetario"),
]
_TOM_HOJE_POR_POSICAO = ["Lunar", "Cristal", "Solar", "Espectral"]  # so pra variar o Tom de hoje mostrado

PARES_ORACULO_NOVOS = []
for natal_selo, natal_tom in _REFERENCIAS_ORACULO:
    natal_tom_numero = numero_do_tom(natal_tom)
    posicoes = [
        (NIVEL_GUIDE_MATCH, guide_seal(natal_selo, natal_tom_numero)),
        (NIVEL_ANALOG_MATCH, analog_seal(natal_selo)),
        (NIVEL_ANTIPODE_MATCH, antipode_seal(natal_selo)),
        (NIVEL_OCCULT_MATCH, occult_seal(natal_selo)),
    ]
    for i, (nivel, selo_posicao) in enumerate(posicoes):
        PARES_ORACULO_NOVOS.append({
            "selo": selo_posicao, "tom": _TOM_HOJE_POR_POSICAO[i], "nivel": nivel,
            "natal_selo": natal_selo,
        })

PARES_NOVOS = PARES_NONE_NOVOS + PARES_SAME_SEAL_NOVOS + PARES_ORACULO_NOVOS
assert len(PARES_NOVOS) == 30, f"esperado 30 pares novos, obtido {len(PARES_NOVOS)}"

_CAMPO_POR_NIVEL = {
    NIVEL_GUIDE_MATCH: "natal_guide_seal",
    NIVEL_ANALOG_MATCH: "natal_analog_seal",
    NIVEL_ANTIPODE_MATCH: "natal_antipode_seal",
    NIVEL_OCCULT_MATCH: "natal_occult_seal",
}


def montar_payload(session, selo: str, tom: str, nivel: str, natal_selo_ref: str = None) -> dict:
    c_selo = buscar_conhecimento(session, "dreamspell", "selo", selo)
    c_tom = buscar_conhecimento(session, "dreamspell", "tom", str(numero_do_tom(tom)))

    autorizadas = [] if nivel == NIVEL_NONE else [nivel]
    natal_oracle_context = {}
    if nivel in _CAMPO_POR_NIVEL:
        natal_oracle_context[_CAMPO_POR_NIVEL[nivel]] = selo  # Selo de hoje == posicao natal, por definicao

    if nivel == NIVEL_SAME_SEAL:
        natal_selo_autorizado = selo
    elif nivel in _CAMPO_POR_NIVEL:
        natal_selo_autorizado = natal_selo_ref
    else:
        natal_selo_autorizado = None

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
        "natal_selo_autorizado": natal_selo_autorizado,
        "natal_oracle_context": natal_oracle_context,
    }


def main():
    session = get_session()
    modelo = GPT56SolClient()

    todos_os_pares = [dict(p, grupo="regressao") for p in PARES_REGRESSAO] + [
        dict(p, grupo="novo") for p in PARES_NOVOS
    ]

    resultados = []
    for par in todos_os_pares:
        payload = montar_payload(session, par["selo"], par["tom"], par["nivel"], par.get("natal_selo"))
        print(f"--- {par['selo']} + {par['tom']} ({par['nivel']}, {par['grupo']}) ---", file=sys.stderr)
        resposta, status_qa, resumo = _rodar_pipeline_qa(payload, PROMPT_VERSION_V1_1_1, modelo)
        aprovado = status_qa in (STATUS_APPROVED_FIRST_TRY, STATUS_APPROVED_AFTER_REWRITE)
        resultados.append({
            "grupo": par["grupo"],
            "selo": par["selo"],
            "tom": par["tom"],
            "nivel_relacao": par["nivel"],
            "status_qa": status_qa,
            "aprovado": aprovado,
            "relation_mode": resposta.relation_mode if resposta else None,
            "symbolic_relation": resposta.symbolic_relation if resposta else None,
            "human_experience": resposta.human_experience if resposta else None,
            "reflection": resposta.reflection if resposta else None,
            "question": resposta.question if resposta else None,
            "motivo_reescrita": resumo.get("motivo_reescrita"),
        })
        print(f"    status_qa={status_qa} relation_mode={resposta.relation_mode if resposta else None}", file=sys.stderr)

    # --- Distribuicao de relation_mode ---------------------------------------
    print("\n" + "=" * 80)
    print(f"DISTRIBUIÇÃO relation_mode (v1.1.1, N={len(resultados)})")
    print("=" * 80)
    dist = Counter(r["relation_mode"] for r in resultados if r["aprovado"])
    total_aprovados = sum(dist.values())
    for modo in ["TENSION", "CONTRAST", "COMPLEMENTARITY", "ENCOUNTER", "SIMPLE_LENS", None]:
        n = dist.get(modo, 0)
        if n:
            pct = 100 * n / total_aprovados if total_aprovados else 0
            print(f"  {modo!s:18} {n:3}/{total_aprovados} ({pct:.0f}%)")

    # relation_mode_collapse_detected -- METRICA DE BATERIA (nao de auditor
    # isolado, ver docstring do modulo em interpretation.py): flag se
    # qualquer modo unico responde por mais da metade das aprovacoes.
    modo_dominante, n_dominante = (dist.most_common(1) or [(None, 0)])[0]
    collapse_detected = total_aprovados > 0 and (n_dominante / total_aprovados) > 0.5
    print(f"\nrelation_mode_collapse_detected = {collapse_detected}"
          f" (modo mais frequente: {modo_dominante}, {n_dominante}/{total_aprovados})")

    # --- Taxa de aprovacao na 1a tentativa ------------------------------------
    print("\n" + "=" * 80)
    print("TAXA DE APROVAÇÃO NA 1ª TENTATIVA")
    print("=" * 80)
    n_1a_tentativa = sum(1 for r in resultados if r["status_qa"] == STATUS_APPROVED_FIRST_TRY)
    n_reescrita = sum(1 for r in resultados if r["status_qa"] == STATUS_APPROVED_AFTER_REWRITE)
    n_aprovados = sum(1 for r in resultados if r["aprovado"])
    print(f"  Aprovados no total: {n_aprovados}/{len(resultados)} ({100*n_aprovados/len(resultados):.0f}%)")
    print(f"  Aprovados na 1a tentativa: {n_1a_tentativa}/{len(resultados)} ({100*n_1a_tentativa/len(resultados):.0f}%)")
    print(f"  Aprovados apos reescrita: {n_reescrita}/{len(resultados)} ({100*n_reescrita/len(resultados):.0f}%)")

    # --- Motivos de reescrita --------------------------------------------------
    print("\n" + "=" * 80)
    print("MOTIVOS DE REESCRITA")
    print("=" * 80)
    for r in resultados:
        if r["status_qa"] == STATUS_APPROVED_AFTER_REWRITE:
            print(f"  [{r['selo']} + {r['tom']} ({r['nivel_relacao']})] {r['motivo_reescrita']}")

    # --- Comparacao especifica: os 11 casos que antes cairam em
    # COMPLEMENTARITY na bateria da v1.1 -----------------------------------
    print("\n" + "=" * 80)
    print("COMPARAÇÃO -- os 12 pares de regressão: relation_mode ANTES (v1.1) x DEPOIS (v1.1.1)")
    print("=" * 80)
    try:
        with open("scripts/_resultado_teste_prompt_v1_1_vs_v1.json") as f:
            baseline = json.load(f)["candidata_v1_1"]
        resultados_regressao = [r for r in resultados if r["grupo"] == "regressao"]
        for antes, depois in zip(baseline, resultados_regressao):
            marca = "MUDOU" if antes.get("relation_mode") != depois["relation_mode"] else "igual"
            print(f"  [{marca}] {antes['selo']} + {antes['tom']} ({antes['nivel_relacao']}): "
                  f"{antes.get('relation_mode')} -> {depois['relation_mode']}")
    except FileNotFoundError:
        print("  (scripts/_resultado_teste_prompt_v1_1_vs_v1.json não encontrado -- pulei a comparação)")

    # --- Todos os casos SIMPLE_LENS -------------------------------------------
    print("\n" + "=" * 80)
    print("CASOS ONDE SIMPLE_LENS FOI ESCOLHIDO")
    print("=" * 80)
    simples = [r for r in resultados if r["relation_mode"] == "SIMPLE_LENS"]
    if simples:
        for r in simples:
            print(f"\n### {r['selo']} + {r['tom']} ({r['nivel_relacao']})")
            print(f"   symbolic_relation: {r['symbolic_relation']}")
            print(f"   human_experience: {r['human_experience']}")
    else:
        print("  Nenhum caso escolheu SIMPLE_LENS nesta bateria.")

    # --- 10 exemplos representativos (1 por combinação nível x alguns modos) -
    print("\n" + "=" * 80)
    print("10 EXEMPLOS REPRESENTATIVOS")
    print("=" * 80)
    vistos_modo = set()
    exemplos = []
    for r in resultados:
        if not r["aprovado"]:
            continue
        chave = r["relation_mode"]
        if chave not in vistos_modo or len(exemplos) < 10:
            if len(exemplos) < 10:
                exemplos.append(r)
                vistos_modo.add(chave)
        if len(exemplos) >= 10:
            break
    for r in exemplos:
        print(f"\n### {r['selo']} + {r['tom']} ({r['nivel_relacao']}) -- relation_mode={r['relation_mode']}")
        print(f"   symbolic_relation: {r['symbolic_relation']}")
        print(f"   human_experience: {r['human_experience']}")
        print(f"   reflection: {r['reflection']}")
        print(f"   question: {r['question']}")

    with open("scripts/_resultado_teste_prompt_v1_1_1_relation_mode.json", "w") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)
    print("\nResultado completo salvo em scripts/_resultado_teste_prompt_v1_1_1_relation_mode.json")

    session.close()


if __name__ == "__main__":
    main()
