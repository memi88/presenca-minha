"""
routes.py

Rotas HTTP da Ponte Presenca -- superficie ISOLADA das rotas do Alpha
(app/routes_experiencia.py): sem sessao/auth de participante, sem
template Jinja2, sessao de banco aberta/fechada aqui mesmo (mesmo padrao
de try/finally de app/routes_experiencia.py, sem Depends). O prefixo
inteiro (/api/publico) fica em ROTAS_PUBLICAS (app/auth.py) -- acessivel
sem cookie nenhum, nem COOKIE_SENHA_OK.

Escopo desta etapa (29/08/2026, pedido explicito do time): SO
GET /api/publico/hoje-dreamspell. O endpoint personalizado
(POST /api/ponte-presenca/hoje-dreamspell-personalizado, data_nascimento
+ API key servidor-a-servidor) fica documentado no CLAUDE.md como
proximo passo (P8 do lado do Presenca) -- NAO implementado ainda, de
proposito.
"""
from typing import Optional

from fastapi import APIRouter

from app.alpha.modelo_gpt56sol import GPT56SolClient
from app.db.session import get_session
from app.ponte_presenca.pipeline import obter_ou_publicar_leitura_generica
from app.routes_experiencia import HUNAB_KU_MENSAGEM

router = APIRouter(prefix="/api/publico", tags=["ponte-presenca"])

# ATENCAO -- incidente real de 30/08/2026, corrigido no mesmo dia: a
# versao anterior desta funcao usava uma DENYLIST (removia so
# versao_prompt/modelo/status_qa/qa_status de resumo_derivacao). Isso
# deixou passar `tentativas` pra producao -- o array com o TEXTO INTEIRO
# de cada chamada de geracao, incluindo as REPROVADAS pelo guardrail/
# auditor (motivo_reprovacao, guardrail_motivos, os 8 campos estruturados
# do auditor), alem de motivo_fallback/motivo_reescrita/tentativa (numero
# da que venceu) -- tudo isso e auditoria interna do pipeline, nunca
# deveria sair numa rota publica sem autenticacao nenhuma. Achado no
# proprio smoke test pos-deploy, corrigido antes de qualquer uso real
# externo (ver CLAUDE.md). NUNCA reverter pra uma denylist aqui --
# allowlist explicita, campo a campo, e a unica forma aceitavel de montar
# esta resposta. NUNCA serializar resumo_derivacao (ou
# LeituraDiariaGenerica) direto no corpo HTTP.
_CAMPOS_DERIVATION_SUMMARY_PUBLICO = (
    "tipo_dia", "tom_hoje", "selo_hoje", "selo_natal",
    "texto_curado_tom", "texto_curado_selo", "authorized_relations",
)


def _relation_mode_publicado(resumo: dict) -> Optional[str]:
    """SO o relation_mode da tentativa que foi de fato PUBLICADA -- nunca
    a lista `tentativas` inteira (que pode conter relation_mode de
    tentativas REPROVADAS, nunca mostradas ao usuario). `resumo["tentativa"]`
    e 1/2 (numero de qual tentativa venceu) so quando status_qa e
    APPROVED_FIRST_TRY/APPROVED_AFTER_REWRITE; e a string "fallback" no
    fallback curado (texto fixo, sem relation_mode nenhum por tras) e
    ausente em Hunab Ku (sem tentativa nenhuma) -- None nos dois casos,
    corretamente."""
    vencedora = resumo.get("tentativa")
    if vencedora not in (1, 2):
        return None
    tentativas = resumo.get("tentativas") or []
    indice = vencedora - 1
    if 0 <= indice < len(tentativas):
        return tentativas[indice].get("relation_mode")
    return None


def _construir_derivation_summary_publico(resumo: dict) -> dict:
    """Allowlist explicita, campo a campo -- ver ATENCAO acima. Contexto
    do calculo (tipo_dia/tom_hoje/selo_hoje/selo_natal) e conteudo CURADO
    (texto_curado_tom/texto_curado_selo -- vem de base_conhecimento, nao
    do modelo, sempre seguro) sempre podem sair. relation_mode so da
    tentativa publicada (ver _relation_mode_publicado). authorized_relations
    e so a lista de niveis (tokens), sem nenhum texto gerado junto."""
    return {
        "tipo_dia": resumo.get("tipo_dia"),
        "tom_hoje": resumo.get("tom_hoje"),
        "selo_hoje": resumo.get("selo_hoje"),
        "selo_natal": resumo.get("selo_natal"),
        "relation_mode": _relation_mode_publicado(resumo),
        "texto_curado_tom": resumo.get("texto_curado_tom"),
        "texto_curado_selo": resumo.get("texto_curado_selo"),
        "authorized_relations": resumo.get("authorized_relations") or [],
    }


def _resposta_json(leitura) -> dict:
    """Pura -- traduz uma LeituraDiariaGenerica ja publicada pro JSON
    externo. Extraida da rota pra ser testavel com `now` injetado (a
    rota em si so aceita a data civil REAL, mesma limitacao de
    _contexto_entender_presente()/app/routes_experiencia.py pra Hunab Ku
    -- ver tests/test_ponte_presenca.py).

    Hunab Ku 0.0: reusa a MESMA mensagem fixa de tela do resto do produto
    (HUNAB_KU_MENSAGEM, app/routes_experiencia.py -- fonte unica, ver
    comentario la: "nunca reescrever uma segunda versao desta mensagem em
    outro lugar"). A leitura gravada tem reflexao/pergunta None nesse dia
    (mesmo padrao de LeituraDiaria -- o fallback fixo e uma mensagem de
    TELA, nao um dado gravado)."""
    if leitura.tipo_dia == "HUNAB_KU_0_0":
        reflection, question = HUNAB_KU_MENSAGEM, None
    else:
        reflection, question = leitura.reflexao, leitura.pergunta

    return {
        "reflection": reflection,
        "question": question,
        "derivation_summary": _construir_derivation_summary_publico(leitura.resumo_derivacao),
    }


@router.get("/hoje-dreamspell")
def hoje_dreamspell():
    session = get_session()
    try:
        leitura = obter_ou_publicar_leitura_generica(session, GPT56SolClient())
        return _resposta_json(leitura)
    finally:
        session.close()
