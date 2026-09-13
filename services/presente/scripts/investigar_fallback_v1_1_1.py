"""
investigar_fallback_v1_1_1.py

Investigacao pontual (20/08/2026) dos 2 casos que cairam em
FALLBACK_CURATED na bateria de 42 pares da v1.1.1 (scripts/testar_prompt_
v1_1_1_relation_mode.py): "Noite + Planetario" (um dos 12 de regressao) e
"Mago + Eletrico" (um dos 30 novos). O script daquela bateria so capturava
`motivo_reescrita` (existe so no caminho APPROVED_AFTER_REWRITE) -- pros
2 casos que reprovaram as 2 vezes, nao havia nenhum motivo capturado. Isso
foi corrigido em app/alpha/interpretation.py (_rodar_pipeline_qa agora
sempre devolve motivo_reprovacao_1/motivo_reprovacao_2 no resumo_derivacao
do fallback, persistido em producao dai em diante) -- mas os 2 casos desta
bateria ja tinham rodado ANTES da correcao, entao os motivos originais
nunca foram gravados. Este script os roda de novo, replicando o pipeline
de _rodar_pipeline_qa PASSO A PASSO (nao chama a funcao como caixa-preta),
pra logar cada estagio intermediario -- geracao 1, guardrail 1, auditoria
1 (com os 8 campos estruturados), motivo 1, prompt de reescrita, geracao
2, guardrail 2, auditoria 2, motivo 2, e o conteudo fixo que o fallback
de fato entregaria.

*** GASTA DINHEIRO REAL *** (mesma chave/billing) -- so 2 casos, ate 2
chamadas gerar() + 2 chamadas auditar() cada (4-8 chamadas no total).

NAO altera o prompt v1.1.1 nem PROMPT_VERSION de producao -- so
investigacao, sem escrever em nenhuma tabela.

Uso:
    source .venv/bin/activate
    env -u SSL_CERT_FILE -u REQUESTS_CA_BUNDLE -u CURL_CA_BUNDLE -u OPENAI_API_KEY \
        python3 -m scripts.investigar_fallback_v1_1_1
"""
import dataclasses
import json
import sys

from app.alpha.interpretation import (
    FALLBACK_PERGUNTA,
    FALLBACK_REFLEXAO,
    PROMPT_VERSION_V1_1_1,
    construir_prompt,
    verificar_guardrail,
)
from app.alpha.modelo_gpt56sol import GPT56SolClient
from app.alpha.relevance import NIVEL_NONE
from app.db.session import get_session
from scripts.testar_prompt_v1_1_1_relation_mode import montar_payload

CASOS = [
    {"selo": "Noite", "tom": "Planetario", "nivel": NIVEL_NONE, "origem": "regressão (12 pares originais)"},
    {"selo": "Mago", "tom": "Eletrico", "nivel": NIVEL_NONE, "origem": "novo (30 pares do ajuste v1.1.1)"},
]


def _resposta_dict(resposta):
    return dataclasses.asdict(resposta) if resposta is not None else None


def _auditoria_dict(auditoria):
    return {"aprovado": auditoria.aprovado, "motivo": auditoria.motivo, "detalhes": auditoria.detalhes}


def investigar_um_caso(session, modelo, selo: str, tom: str, nivel: str) -> dict:
    payload = montar_payload(session, selo, tom, nivel)
    trace = {"payload": payload}

    # --- Tentativa 1 ---------------------------------------------------------
    prompt_1 = construir_prompt(payload, PROMPT_VERSION_V1_1_1)
    resposta_1 = modelo.gerar(prompt_1)
    trace["prompt_1"] = prompt_1
    trace["resposta_1"] = _resposta_dict(resposta_1)

    guardrail_1 = verificar_guardrail(resposta_1)
    trace["guardrail_1_motivos"] = guardrail_1

    auditoria_1 = None
    if not guardrail_1:
        auditoria_1 = modelo.auditar(resposta_1, payload)
        trace["auditoria_1"] = _auditoria_dict(auditoria_1)
        aprovado_1 = (not verificar_guardrail(resposta_1)) and auditoria_1.aprovado
        motivo_1 = "" if aprovado_1 else (auditoria_1.motivo or "reprovado pelo auditor (motivo não especificado)")
    else:
        trace["auditoria_1"] = None  # guardrail reprovou antes de chegar no auditor -- mesma logica do pipeline real
        aprovado_1 = False
        motivo_1 = "; ".join(guardrail_1)

    trace["aprovado_na_1a_tentativa"] = aprovado_1
    trace["motivo_1a_reprovacao"] = motivo_1 if not aprovado_1 else None

    if aprovado_1:
        trace["status_final"] = "APPROVED_FIRST_TRY"
        trace["prompt_2"] = None
        trace["resposta_2"] = None
        return trace

    # --- Tentativa 2 (reescrita) ----------------------------------------------
    prompt_2 = construir_prompt(payload, PROMPT_VERSION_V1_1_1, motivo_reprovacao=motivo_1)
    trace["prompt_2"] = prompt_2
    # Trecho literal de instrução anexado pro modelo na reescrita (o que
    # muda entre prompt_1 e prompt_2, isolado pra leitura rápida).
    trace["instrucao_reescrita_anexada"] = prompt_2[len(prompt_1):] if prompt_2.startswith(prompt_1) else (
        f"\nATENÇÃO: uma tentativa anterior foi reprovada pelo seguinte motivo: {motivo_1}. "
        "Reescreva evitando exatamente isso."
    )

    resposta_2 = modelo.gerar(prompt_2)
    trace["resposta_2"] = _resposta_dict(resposta_2)

    guardrail_2 = verificar_guardrail(resposta_2)
    trace["guardrail_2_motivos"] = guardrail_2

    auditoria_2 = None
    if not guardrail_2:
        auditoria_2 = modelo.auditar(resposta_2, payload)
        trace["auditoria_2"] = _auditoria_dict(auditoria_2)
        aprovado_2 = (not verificar_guardrail(resposta_2)) and auditoria_2.aprovado
        motivo_2 = "" if aprovado_2 else (auditoria_2.motivo or "reprovado pelo auditor (motivo não especificado)")
    else:
        trace["auditoria_2"] = None
        aprovado_2 = False
        motivo_2 = "; ".join(guardrail_2)

    trace["aprovado_na_2a_tentativa"] = aprovado_2
    trace["motivo_2a_reprovacao"] = motivo_2 if not aprovado_2 else None

    if aprovado_2:
        trace["status_final"] = "APPROVED_AFTER_REWRITE"
    else:
        trace["status_final"] = "FALLBACK_CURATED"
        trace["conteudo_fallback_entregue"] = {"reflexao": FALLBACK_REFLEXAO, "pergunta": FALLBACK_PERGUNTA}

    return trace


def main():
    session = get_session()
    modelo = GPT56SolClient()

    resultados = {}
    for caso in CASOS:
        chave = f"{caso['selo']} + {caso['tom']}"
        print(f"\n{'='*80}\nInvestigando: {chave} ({caso['origem']})\n{'='*80}", file=sys.stderr)
        trace = investigar_um_caso(session, modelo, caso["selo"], caso["tom"], caso["nivel"])
        trace["origem"] = caso["origem"]
        resultados[chave] = trace
        print(f"status_final = {trace['status_final']}", file=sys.stderr)

    with open("scripts/_resultado_investigacao_fallback_v1_1_1.json", "w") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)
    print("\nResultado completo salvo em scripts/_resultado_investigacao_fallback_v1_1_1.json")

    session.close()


if __name__ == "__main__":
    main()
