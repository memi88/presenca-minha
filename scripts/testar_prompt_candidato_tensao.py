"""
testar_prompt_candidato_tensao.py

Protocolo de teste do prompt candidato PROMPT_VERSION_TENSAO_CANDIDATO
(app/alpha/interpretation.py, 19/08/2026) -- roda a versao ATUAL
(PROMPT_VERSION) e a CANDIDATA lado a lado contra 8 pares Selo/Tom reais
(incluindo 1 caso SAME_SEAL), pelo pipeline de QA real (guardrail
deterministico + auditor isolado), usando o GPT-5.6 Sol de verdade.

*** GASTA DINHEIRO REAL *** (mesma chave/billing do projeto "presente" na
OpenAI, ja usada nos smoke tests da A5 -- ver app/alpha/modelo_gpt56sol.py).
Nao roda em CI, nao faz parte de tests/ (que so roda contra ClienteSimulado,
sem rede). E um script manual, disparado sob demanda.

NAO publica nada em LeituraDiaria -- usa _rodar_pipeline_qa() diretamente
(nucleo sem persistencia, extraido de obter_ou_publicar_leitura_diaria()
exatamente pra permitir isso), com payloads sinteticos, nao um
MomentoDiario/participante real. A versao candidata nao substitui nada em
producao so por este script rodar.

Uso:
    source .venv/bin/activate
    env -u SSL_CERT_FILE -u REQUESTS_CA_BUNDLE -u CURL_CA_BUNDLE python3 -m scripts.testar_prompt_candidato_tensao
"""
import json
import sys

from app.alpha.interpretation import (
    PROMPT_VERSION,
    PROMPT_VERSION_TENSAO_CANDIDATO,
    STATUS_APPROVED_FIRST_TRY,
    STATUS_APPROVED_AFTER_REWRITE,
    _rodar_pipeline_qa,
)
from app.alpha.modelo_gpt56sol import GPT56SolClient
from app.alpha.relevance import NIVEL_NONE, NIVEL_SAME_SEAL
from app.db.session import get_session
from app.knowledge import buscar_conhecimento
from app.engines.dreamspell_engine import numero_do_tom

# 8 pares Selo/Tom, cobrindo arquetipos bem diferentes entre si.
# O par que motivou o teste (Caminhante do Ceu + Ritmico, NONE) vai primeiro.
# "mago"/"mago" e o unico SAME_SEAL (selo_natal == selo_hoje setado a mao).
PARES = [
    {"selo": "Caminhante do Ceu", "tom": "Ritmico", "same_seal": False},
    {"selo": "Guerreiro", "tom": "Cristal", "same_seal": False},
    {"selo": "Terra", "tom": "Eletrico", "same_seal": False},
    {"selo": "Serpente", "tom": "Magnetico", "same_seal": False},
    {"selo": "Espelho", "tom": "Cosmico", "same_seal": False},
    {"selo": "Mago", "tom": "Lunar", "same_seal": True},
    {"selo": "Sol", "tom": "Overtonal", "same_seal": False},
    {"selo": "Noite", "tom": "Planetario", "same_seal": False},
]

VERSOES = [
    ("atual", PROMPT_VERSION),
    ("candidata_tensao", PROMPT_VERSION_TENSAO_CANDIDATO),
]


def montar_payload(session, selo: str, tom: str, same_seal: bool) -> dict:
    c_selo = buscar_conhecimento(session, "dreamspell", "selo", selo)
    c_tom = buscar_conhecimento(session, "dreamspell", "tom", str(numero_do_tom(tom)))
    return {
        "selo_hoje": selo,
        "tom_hoje": tom,
        "tipo_dia": "REGULAR",
        "nivel_relacao": NIVEL_SAME_SEAL if same_seal else NIVEL_NONE,
        "selo_natal": selo if same_seal else None,
        "texto_curado_selo": c_selo.texto_curado if c_selo is not None else None,
        "texto_curado_tom": c_tom.texto_curado if c_tom is not None else None,
    }


def main():
    session = get_session()
    modelo = GPT56SolClient()

    resultados = {label: [] for label, _ in VERSOES}

    for par in PARES:
        payload = montar_payload(session, par["selo"], par["tom"], par["same_seal"])
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

    # --- Saidas completas aprovadas, so da versao candidata (o que importa
    # reportar pra leitura humana) -----------------------------------------
    print("\n" + "=" * 80)
    print("TEXTOS COMPLETOS -- versao candidata (reflection + question + tension)")
    print("=" * 80)
    for l in resultados["candidata_tensao"]:
        print(f"\n### {l['selo']} + {l['tom']} ({l['nivel_relacao']}) -- {l['status_qa']}")
        if l["aprovado"]:
            print(f"Tensao escolhida: {l['tension']}")
            print(f"Reflexao: {l['reflection']}")
            print(f"Pergunta: {l['question']}")
        else:
            print("(reprovado -- sem texto pra publicar; motivo da reescrita, se houve:"
                  f" {l['motivo_reescrita']})")

    with open("scripts/_resultado_teste_prompt_tensao.json", "w") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)
    print("\nResultado completo salvo em scripts/_resultado_teste_prompt_tensao.json")

    session.close()


if __name__ == "__main__":
    main()
