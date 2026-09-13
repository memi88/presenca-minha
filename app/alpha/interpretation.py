"""
interpretation.py

A5 (CLAUDE.md secao 5) -- Interpretation Engine (GPT-5.6 Sol) + QA
(guardrails deterministicos + auditor isolado) + fallback curado,
publicando em LeituraDiaria (`daily_present`).

Pipeline (ordem fixa, ver briefing da A5):
  1. tipo_dia == HUNAB_KU_0_0 -> fallback fixo, status_qa=FIXED_HUNAB_KU,
     NUNCA chama o modelo. Fim.
  2. monta payload minimo (Selo/Tom do dia, nivel_relacao, Selo natal SO
     se SAME_SEAL, textos curados de Selo+Tom -- sem Onda nesta etapa).
  3. chamada 1: gerar (GPT-5.6 Sol).
  4. guardrail deterministico na saida -> reprovou: vai pra reescrita (6).
  5. chamada 2: auditor isolado (SEM o prompt da chamada 1 -- o auditor
     recebe so o texto candidato + o payload, nunca o prompt de geracao)
     -> reprovou: reescrita (6). Aprovou: publica, APPROVED_FIRST_TRY. Fim.
  6. reescrita (so acontece 1x): nova chamada de geracao com o motivo da
     reprovacao anexado ao prompt -> repete guardrail + auditor.
     Aprovou: publica, APPROVED_AFTER_REWRITE. Reprovou de novo: fallback.
  7. fallback curado: publica texto pre-aprovado, sem personalizacao,
     status_qa=FALLBACK_CURATED. NENHUMA chamada de modelo depois disso.

Idempotencia/concorrencia: get-or-create com um pg_advisory_xact_lock
ANTES da primeira chamada ao modelo (nao so na escrita) -- diferente do
padrao de A2/A4 (catch de IntegrityError), porque aqui uma corrida perdida
tarde demais significa ter GASTO TOKENS a toa, nao so ter perdido uma
insercao. Ver obter_ou_publicar_leitura_diaria().

Versionamento de prompt (atualizado 20/08/2026): PROMPT_VERSION e a versao
EM PRODUCAO -- e o default de obter_ou_publicar_leitura_diaria(), entao e
o que roda pra todo mundo a menos que `versao_prompt` seja passado
explicitamente.

HISTORICO (nenhuma versao anterior e apagada quando uma nova e promovida
-- rastreabilidade e um requisito explicito, nao um acidente de nao ter
limpado o codigo):
  1. "reflection-1.0.0" (PROMPT_VERSION_ANTERIOR) -- versao original
     "harmoniosa". Producao ate 19/08/2026.
  2. "reflection-tension-1.0.0" (PROMPT_VERSION_TENSAO_CANDIDATO) --
     ELEMENTOS -> POSSIVEIS TENSOES -> ESCOLHER UMA -> REFLEXAO ->
     PERGUNTA (ver _INSTRUCOES_BASE_TENSAO). Promovida em 19/08/2026 apos
     scripts/testar_prompt_candidato_tensao.py (8 pares, 8/8 aprovados).
     Producao ate 20/08/2026.
  3. "reflection-human-experience-1.1.0" (PROMPT_VERSION_V1_1) --
     pipeline elementos autorizados -> relacao simbolica -> modo da
     relacao -> experiencia humana -> arco narrativo -> reflexao ->
     pergunta (Gate 1.5). NUNCA foi producao -- bateria de 12 pares
     revelou convergencia de 11/12 em relation_mode=COMPLEMENTARITY,
     corrigida na v1.1.1 antes de promover qualquer coisa.
  4. "reflection-human-experience-1.1.1" (PROMPT_VERSION_V1_1_1) --
     DEFAULT ATUAL, promovida em 20/08/2026. Ajuste pontual da etapa 3
     (MODO DA RELAÇÃO) da v1.1 -- ver _INSTRUCOES_BASE_V1_1_1 e o
     benchmark/baseline registrado no comentario da constante, poucas
     linhas abaixo.

Reverter e trivial: trocar so a linha `PROMPT_VERSION = PROMPT_VERSION_
V1_1_1` (poucas linhas abaixo) pra qualquer uma das constantes acima --
construir_prompt() decide qual bloco de instrucoes usar comparando o
VALOR de versao_prompt, nao qual constante foi usada pra chama-la.

v1.1 (20/08/2026, Gate 1.5 -> evolucao do Interpretation Engine): NOVA
CANDIDATA, PROMPT_VERSION_V1_1 ("reflection-human-experience-1.1.0").
NAO e o default (PROMPT_VERSION continua == PROMPT_VERSION_TENSAO_
CANDIDATO) -- por pedido explicito do time, so vira producao depois de
revisar o resultado da bateria comparativa (ver scripts/testar_prompt_
v1_1_vs_v1.py). v1.0 e a tensao candidata NAO foram apagadas nem
alteradas -- construir_prompt()/verificar_guardrail() continuam
produzindo exatamente o mesmo resultado de antes pra essas duas versoes;
v1.1 e um branch inteiramente novo.

Pipeline conceitual da v1.1 (ver _INSTRUCOES_BASE_V1_1): elementos
autorizados -> relacao simbolica -> modo da relacao (TENSION/CONTRAST/
COMPLEMENTARITY/ENCOUNTER/SIMPLE_LENS, NAO so TENSION forcado) ->
experiencia humana -> arco narrativo (2-4 paragrafos curtos) -> reflexao
-> pergunta (nasce da experiencia humana, nao das palavras-chave cruas).
O JSON da v1.1 tem 5 chaves (relation_mode/symbolic_relation/
human_experience/reflection/question) em vez das 2-3 das versoes
anteriores -- RespostaGerada ganhou campos novos, todos Optional (None
nas versoes antigas, preenchidos so na v1.1).

QA v1.1 (app/alpha/modelo_gpt56sol.py, GPT56SolClient.auditar): alem do
guardrail deterministico de sempre, o auditor isolado agora reporta 6
campos estruturados (human_experience_supported_by_inputs/
invented_user_context/forced_opposition/narrative_adds_meaning_not_facts/
question_derives_from_human_experience/personalization_supported_by_
relevance). 3 deles sao BLOQUEANTES por decisao explicita do time
(invented_user_context=true, forced_opposition=true, ou
personalization_supported_by_relevance=false reprovam sempre, mesmo que
o proprio "aprovado" do modelo diga outra coisa -- mesma defesa em
profundidade de verificar_guardrail(), so que aqui o guardrail
determinstico nao tem como checar semantica, entao o override fica no
codigo QUE LE a resposta do auditor, nao dentro do prompt do auditor).

Payload v1.1 (montar_payload_minimo -- estendido, nao duplicado): alem
das chaves de sempre, ganhou personalization_status/authorized_relations
(Gate 1.5, app/alpha/relevance.py -- a lista COMPLETA de relacoes que
autorizam personalizacao hoje, nunca colapsada) e natal_oracle_context
(so as posicoes de Oraculo natal que estao especificamente autorizadas).
v1/tensao candidata ignoram essas chaves -- continuam olhando so
nivel_relacao/selo_natal, exatamente como antes.

v1.1.1 (20/08/2026, mesmo dia -- ajuste pontual, PROMPT_VERSION_V1_1_1
"reflection-human-experience-1.1.1"): a bateria de 12 pares da v1.1
convergiu 11/12 em relation_mode=COMPLEMENTARITY e 0/12 em CONTRAST/
ENCOUNTER/SIMPLE_LENS -- trocou o viés "tudo vira TENSION" (do prompt
pre-19/08) por um viés novo "tudo vira COMPLEMENTARITY". v1.1.1 reescreve
SO a etapa 3 (MODO DA RELAÇÃO, ver _INSTRUCOES_BASE_V1_1_1): exige
evidencia semantica real proporcional a forca interpretativa do modo
(escala SIMPLE_LENS < ENCOUNTER < CONTRAST/COMPLEMENTARITY < TENSION),
regra de desempate pro modo mais fraco, e proibe explicitamente escolher
um modo pela "profundidade" da narrativa. Elementos autorizados/
experiencia humana/arco narrativo/regras de personalizacao/Oraculo/QA
v1.1 continuam IDENTICOS -- nao foram tocados. v1.1 (1.1.0) fica
CONGELADA, nao reescrita -- os resultados ja reportados sobre ela
continuam validos pra aquele texto exato.

QA v1.1.1: o auditor isolado (GPT56SolClient._auditar_v1_1, app/alpha/
modelo_gpt56sol.py) ganhou 2 campos novos -- relation_mode_supported_by_
inputs (informativo) e stronger_mode_used_without_need (BLOQUEANTE: true
forca reescrita, mesmo override deterministico dos outros 3 campos
bloqueantes). Esse auditor e COMPARTILHADO entre v1.1 e v1.1.1 (julga o
JSON de saida, nao qual prompt gerou -- nao ha necessidade de duplicar a
logica de auditoria por versao de geracao). relation_mode_collapse_
detected NAO e um campo do auditor isolado (um auditor olhando 1 caso de
cada vez nao pode detectar colapso de distribuicao) -- e uma metrica
calculada no SCRIPT da bateria, olhando a distribuicao do lote inteiro
(ver scripts/testar_prompt_v1_1_1_relation_mode.py)."""
import datetime
import re
from dataclasses import dataclass
from typing import Optional, Protocol

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.models import LeituraDiaria, MomentoDiario, Participante, ResultadoRelevancia
from app.engines.dreamspell_engine import numero_do_tom
from app.knowledge import buscar_conhecimento
from app.alpha.relevance import (
    NIVEL_ANALOG_MATCH,
    NIVEL_ANTIPODE_MATCH,
    NIVEL_GUIDE_MATCH,
    NIVEL_OCCULT_MATCH,
    NIVEL_SAME_SEAL,
)

# Versao anterior (harmoniosa) -- mantida acessivel de proposito, so pra
# reverter ser trivial (ver docstring do modulo). NAO e mais o default.
# PRESERVADA PARA RASTREABILIDADE -- nenhuma versao antiga e apagada
# quando uma nova e promovida (mesmo principio de PROMPT_VERSION_ANTERIOR
# ja aplicado desde 19/08/2026, so que agora com 2 versoes anteriores
# preservadas, nao 1).
PROMPT_VERSION_ANTERIOR = "reflection-1.0.0"
# Ex-candidata de tensao, promovida a producao em 19/08/2026, substituida
# pela v1.1.1 em 20/08/2026. PRESERVADA.
PROMPT_VERSION_TENSAO_CANDIDATO = "reflection-tension-1.0.0"
# v1.1 (Gate 1.5, 20/08/2026) -- ver docstring do modulo. Nunca foi
# promovida a producao (a bateria de 12 pares mostrou convergencia de
# 11/12 em COMPLEMENTARITY, corrigida na v1.1.1) -- fica congelada,
# PRESERVADA pra rastreabilidade.
PROMPT_VERSION_V1_1 = "reflection-human-experience-1.1.0"
# v1.1.1 (20/08/2026) -- ajuste pontual da etapa 3 (MODO DA RELAÇÃO) da
# v1.1. VALIDATED e PROMOVIDA A PRODUCAO em 20/08/2026 apos: bateria de 42
# pares (40/42 aprovados, relation_mode_collapse_detected=False, ver
# scripts/testar_prompt_v1_1_1_relation_mode.py) + investigacao dedicada
# dos 2 casos de fallback (scripts/investigar_fallback_v1_1_1.py,
# classificados: Mago+Eletrico=EXPECTED_SAFETY_FALLBACK, Noite+Planetario=
# inconclusivo/nao reproduzido, corrigido pelo rewrite na reinvestigacao).
# Baseline do benchmark registrado aqui pra nao se perder (nao re-otimizar
# estes numeros sem decisao explicita do time):
#   bateria=42 casos | aprovados=40/42 | first_pass=22/42 |
#   recovered_by_rewrite=18/42 | fallback=2/42 |
#   known_rejected_output_published=0 | relation_mode_collapse_detected=False |
#   SIMPLE_LENS=0/40 (observacao aberta, NAO bloqueador)
PROMPT_VERSION_V1_1_1 = "reflection-human-experience-1.1.1"
# DEFAULT ativo em producao agora -- ver docstring do modulo pra como
# reverter (trocar so esta linha; construir_prompt() decide pelo VALOR,
# nao por qual constante foi usada).
PROMPT_VERSION = PROMPT_VERSION_V1_1_1

STATUS_APPROVED_FIRST_TRY = "APPROVED_FIRST_TRY"
STATUS_APPROVED_AFTER_REWRITE = "APPROVED_AFTER_REWRITE"
STATUS_FALLBACK_CURATED = "FALLBACK_CURATED"
STATUS_FIXED_HUNAB_KU = "FIXED_HUNAB_KU"

# --- Fallback curados (texto fixo, pre-aprovado, sem personalizacao --
# CLAUDE.md secao 7: preferir "talvez"/"pode valer observar", nunca
# afirmar futuro nem diagnosticar). Publicados sem envolver o modelo.
FALLBACK_REFLEXAO = (
    "Hoje não veio uma leitura personalizada a tempo de publicar. Talvez valha "
    "observar o que chama atenção ao longo do dia, sem pressa de decidir o que "
    "isso significa."
)
FALLBACK_PERGUNTA = "O que você percebe, se parar um momento para notar?"

# Hunab Ku 0.0 NAO grava um texto fixo em reflexao/pergunta -- fica None
# nos dois (briefing da A5: "null quando HUNAB_KU_0_0 (usa fallback
# fixo)" -- o fallback fixo e uma mensagem de TELA, nao um dado gravado).
# A6 (tela diaria) precisa checar status_qa == FIXED_HUNAB_KU e mostrar
# sua propria mensagem fixa quando reflexao is None -- mesmo padrao ja
# usado no card de "hoje" em app/routes_experiencia.py (_card_dreamspell).


@dataclass
class RespostaGerada:
    reflection: str
    question: str
    # So preenchido pelo prompt candidato de tensao (PROMPT_VERSION_TENSAO_
    # CANDIDATO) -- a formulacao de tensao arquetipica escolhida pelo
    # modelo antes de escrever a reflexao. None na versao de producao
    # (o JSON dela nem tem essa chave). Guardado pra poder reportar "qual
    # tensao foi escolhida" nas saidas aprovadas, e pra dar contexto extra
    # ao auditor isolado (ver modelo_gpt56sol.py).
    tension: Optional[str] = None
    # So preenchidos pela v1.1 (PROMPT_VERSION_V1_1) -- None em todas as
    # versoes anteriores (nem existem nos JSON delas). relation_mode e o
    # unico usado pra DETECTAR "isto e uma resposta v1.1" (ver auditar()
    # em modelo_gpt56sol.py) -- nao ha necessidade de passar versao_prompt
    # explicitamente pro auditor por causa disso.
    relation_mode: Optional[str] = None
    symbolic_relation: Optional[str] = None
    human_experience: Optional[str] = None


@dataclass
class ResultadoAuditoria:
    aprovado: bool
    motivo: str  # sempre presente -- string vazia quando aprovado
    # So preenchido pela v1.1 -- os 6 campos estruturados do QA v1.1 (ver
    # docstring do modulo), guardado pra reporte/depuracao na bateria
    # comparativa. None nas versoes anteriores.
    detalhes: Optional[dict] = None


class ModeloClient(Protocol):
    """Interface mockavel do Interpretation Engine. Duas operacoes
    distintas de proposito (nao uma so 'chamar o modelo'), porque o
    auditor precisa ser estruturalmente incapaz de receber o prompt da
    chamada de geracao -- 'isolado' e garantido pela assinatura, nao por
    disciplina de quem implementa."""

    def gerar(self, prompt: str) -> RespostaGerada: ...

    def auditar(self, resposta: RespostaGerada, payload: dict) -> ResultadoAuditoria: ...


# --- Guardrails deterministicos (regex/checklist) ---------------------------
# Lista minima do briefing da A5. Aplicada ao texto de reflexao+pergunta
# juntos (a maioria das regras vale pros dois campos); a checagem de
# "pergunta fechada" e especifica do campo pergunta.
_PADROES_PROIBIDOS = [
    (re.compile(r"\bvai\b", re.IGNORECASE), "afirmação de futuro ('vai'/'vai acontecer'/'vai ser')"),
    (re.compile(r"\bir[aá]\b", re.IGNORECASE), "afirmação de futuro (futuro simples)"),
    (re.compile(r"por causa d[eo]\b", re.IGNORECASE), "causalidade explícita ('por causa de')"),
    (re.compile(r"porque o kin\b", re.IGNORECASE), "causalidade explícita ('porque o Kin')"),
    (re.compile(r"\bvoc[eê]\s+[eé]\s+(um|uma|alguém)?", re.IGNORECASE), "diagnóstico ('você é [característica]')"),
    (re.compile(r"\bo universo\b", re.IGNORECASE), "linguagem de autoridade externa ('o universo')"),
    (re.compile(r"isso significa que voc[eê] deve", re.IGNORECASE), "linguagem de autoridade externa/prescritiva"),
]

# Aberturas tipicas de pergunta fechada (sim/nao), sem espaco para
# "nao faz sentido pra mim" -- heuristica, nao uma gramatica completa.
_ABERTURAS_PERGUNTA_FECHADA = re.compile(
    r"^\s*(você é|isso é|você concorda|é verdade que|você vai|não é mesmo)\b", re.IGNORECASE
)


def verificar_guardrail(resposta: RespostaGerada) -> list[str]:
    """Retorna a lista de motivos de reprovacao (vazia = aprovado).
    Pura, deterministica -- nenhuma chamada de rede."""
    motivos: list[str] = []
    # Inclui `tension`/campos novos da v1.1 no texto escaneado (defesa em
    # profundidade -- se algum padrao proibido vazar num campo estruturado
    # sem aparecer em reflection/question, ainda queremos pegar). `or ""`
    # cobre as versoes que nao tem esses campos (sempre None).
    texto_completo = (
        f"{resposta.reflection} {resposta.question} {resposta.tension or ''} "
        f"{resposta.human_experience or ''} {resposta.symbolic_relation or ''}"
    )
    for padrao, descricao in _PADROES_PROIBIDOS:
        if padrao.search(texto_completo):
            motivos.append(descricao)
    if _ABERTURAS_PERGUNTA_FECHADA.match(resposta.question.strip()):
        motivos.append("pergunta fechada (sim/não), sem espaço para 'não faz sentido pra mim'")
    return motivos


def passa_guardrail(resposta: RespostaGerada) -> bool:
    return not verificar_guardrail(resposta)


# --- Payload + prompt --------------------------------------------------------

_CAMPO_NATAL_SEAL_POR_NIVEL = {
    NIVEL_GUIDE_MATCH: "natal_guide_seal",
    NIVEL_ANALOG_MATCH: "natal_analog_seal",
    NIVEL_ANTIPODE_MATCH: "natal_antipode_seal",
    NIVEL_OCCULT_MATCH: "natal_occult_seal",
}


def montar_payload_minimo(session: Session, momento: MomentoDiario, resultado: ResultadoRelevancia) -> dict:
    """Payload do briefing original (selo_hoje, tom_hoje, tipo_dia,
    nivel_relacao, selo_natal SO se SAME_SEAL, textos curados de Selo+Tom)
    -- ESTENDIDO no Gate 1.5/v1.1 com personalization_status/
    authorized_relations/natal_oracle_context (ver docstring do modulo).
    v1/tensao candidata leem so as chaves de sempre (nivel_relacao/
    selo_natal, comportamento byte-identico a antes); so a v1.1 le as
    chaves novas -- 1 payload so, nao duas funcoes duplicadas. Sem Onda
    nesta etapa (decisao de conteudo em aberto, ver mensagem anterior do
    time)."""
    texto_selo = None
    if momento.selo is not None:
        c = buscar_conhecimento(session, "dreamspell", "selo", momento.selo)
        texto_selo = c.texto_curado if c is not None else None

    texto_tom = None
    if momento.tom is not None:
        numero = numero_do_tom(momento.tom)
        c = buscar_conhecimento(session, "dreamspell", "tom", str(numero))
        texto_tom = c.texto_curado if c is not None else None

    # Gate 1.5: detalhe["relacoes_autorizadas"] e a fonte de verdade (lista
    # completa, nunca colapsada -- ver app/alpha/relevance.py). `or []`
    # cobre resultados calculados sob o ruleset legado (RULESET_VERSION_1_0),
    # que nunca gravou essa chave.
    autorizadas = resultado.detalhe.get("relacoes_autorizadas") or []
    relationships_checked = resultado.detalhe.get("relationships_checked") or {}
    natal_oracle_context = {
        campo: relationships_checked.get(campo)
        for nivel, campo in _CAMPO_NATAL_SEAL_POR_NIVEL.items()
        if nivel in autorizadas
    }

    return {
        "selo_hoje": momento.selo,
        "tom_hoje": momento.tom,
        "tipo_dia": momento.tipo_dia,
        "nivel_relacao": resultado.nivel_relacao,
        "selo_natal": resultado.detalhe.get("selo_natal") if resultado.nivel_relacao == NIVEL_SAME_SEAL else None,
        "texto_curado_selo": texto_selo,
        "texto_curado_tom": texto_tom,
        # --- Gate 1.5 / v1.1 (ver docstring do modulo) ----------------------
        "personalization_status": "AUTHORIZED" if autorizadas else "NOT_AUTHORIZED",
        "authorized_relations": autorizadas,
        "natal_selo_autorizado": resultado.detalhe.get("selo_natal") if autorizadas else None,
        "natal_oracle_context": natal_oracle_context,
        # Dump COMPLETO do Relationship Detector (Gate 1) -- same_earth_family/
        # same_tone/same_wavespell inclusos, mesmo NAO autorizando nada. So
        # pra registro/auditoria (resumo_derivacao, ver _rodar_pipeline_qa) --
        # _construir_prompt_v1_1_familia() NAO le esta chave, entao isso nao
        # muda o que o modelo recebe, so o que fica gravado no historico.
        "relationships_checked": relationships_checked,
    }


_INSTRUCOES_BASE = """Você escreve uma reflexão simbólica curta para o Presente, um instrumento de \
observação pessoal baseado no Dreamspell/Sincronário das 13 Luas.

Princípios inegociáveis:
- Consciência antes de previsão -- nunca afirme que algo vai acontecer, nunca dê conselho prescritivo.
- Possibilidade antes de regra -- ofereça uma lente de observação, não determine comportamento.
- Nunca diagnostique ("você é [característica]"), nunca invoque autoridade externa ("o universo").
- Nunca afirme causalidade direta entre o Kin/Selo e eventos do dia.
- Prefira "talvez", "uma lente possível", "pode valer observar".
- A pergunta deve ser aberta -- precisa permitir "não faz sentido pra mim" como resposta válida.

Responda em JSON estrito com exatamente duas chaves: "reflection" (2-4 frases) e "question" \
(uma pergunta aberta curta)."""


# --- Busca de tensao -- EM PRODUCAO desde 19/08/2026 (era _INSTRUCOES_BASE
# ate essa data; ver docstring do modulo e PROMPT_VERSION_ANTERIOR pra
# reverter) --------------------------------------------------------------
#
# Hipotese testada e confirmada pelo protocolo de 19/08/2026 (8 pares
# Selo/Tom reais, incluindo 1 SAME_SEAL, 8/8 aprovados -- ver
# scripts/testar_prompt_candidato_tensao.py e
# scripts/_resultado_teste_prompt_tensao.json): o mesmo par Selo/Tom, pedido
# direto (_INSTRUCOES_BASE), tende a produzir uma sintese harmoniosa entre
# os dois arquetipos ("segura" demais, sem tensao real). Esta versao insere
# uma etapa deliberada de buscar o conflito conceitual entre os dois ANTES
# de escrever, produzindo uma reflexao mais viva sem aumentar a taxa de
# reprovacao do QA.
_INSTRUCOES_BASE_TENSAO = """Você escreve uma reflexão simbólica curta para o Presente, um instrumento de \
observação pessoal baseado no Dreamspell/Sincronário das 13 Luas.

Este processo de escrita busca a tensão real entre os dois arquétipos do dia antes de escrever a \
reflexão, em vez de combiná-los direto numa síntese harmoniosa.

Antes de escrever, siga este processo (o resultado final mostra só a tensão escolhida, não o raciocínio inteiro):
1. ELEMENTOS -- identifique o Selo e o Tom de hoje como dois arquétipos gerais, ideias, não fatos \
sobre a pessoa que vai ler.
2. POSSÍVEIS TENSÕES -- gere 2-3 formulações diferentes de conflito conceitual entre os dois \
arquétipos (ex.: "movimento × estabilidade", "início × repetição") -- ideias gerais sobre os \
arquétipos em si, não sobre o dia de ninguém específico.
3. ESCOLHA UMA -- a formulação que parecer mais viva e concreta, não a mais confortável ou a mais \
fácil de suavizar.
4. REFLEXÃO -- escreva a partir dessa tensão escolhida.
5. PERGUNTA -- convide a pessoa a procurar essa tensão em si mesma.

RESTRIÇÃO OBRIGATÓRIA, a mais importante desta versão: a tensão escolhida tem que permanecer no \
nível conceitual/arquetípico dos dois elementos -- uma ideia geral sobre os arquétipos (ex.: \
"movimento × estabilidade" como ideia, não como fato). Ela NUNCA pode virar uma afirmação sobre o \
que a pessoa está fazendo, sentindo ou vivendo hoje especificamente -- é PROIBIDO, por exemplo, \
"você está tentando ficar parado quando deveria se mover". A pergunta final deve convidar a pessoa \
a encontrar essa tensão em si mesma, nunca afirmar que ela já está vivendo essa tensão de um jeito \
específico. Isto é o mesmo guardrail de sempre -- "personalização inventada sem relação estrutural \
real por trás" -- aplicado a esta etapa nova; é o motivo mais provável de reprovação nesta versão, \
então revise a reflexão e a pergunta com isso em mente antes de responder.

Princípios inegociáveis (os mesmos de sempre):
- Consciência antes de previsão -- nunca afirme que algo vai acontecer, nunca dê conselho prescritivo.
- Possibilidade antes de regra -- ofereça uma lente de observação, não determine comportamento.
- Nunca diagnostique ("você é [característica]"), nunca invoque autoridade externa ("o universo").
- Nunca afirme causalidade direta entre o Kin/Selo e eventos do dia.
- Prefira "talvez", "uma lente possível", "pode valer observar".
- A pergunta deve ser aberta -- precisa permitir "não faz sentido pra mim" como resposta válida.

Responda em JSON estrito com exatamente três chaves: "tension_chosen" (a formulação de tensão \
escolhida, em poucas palavras, nível arquetípico -- ex.: "movimento × estabilidade"), "reflection" \
(2-4 frases) e "question" (uma pergunta aberta curta)."""


# --- v1.1 (Gate 1.5, 20/08/2026) -- pipeline: elementos autorizados ->
# relação simbólica -> modo da relação -> experiência humana -> arco
# narrativo -> reflexão -> pergunta. CANDIDATA, nao promovida ainda (ver
# docstring do modulo) ------------------------------------------------------
_INSTRUCOES_BASE_V1_1 = """Você escreve uma reflexão simbólica curta para o Presente, um instrumento de \
observação pessoal baseado no Dreamspell/Sincronário das 13 Luas.

Esta versão (v1.1) segue um pipeline de escrita em etapas -- o resultado final expõe as etapas \
intermediárias como campos do JSON, não como um raciocínio solto no meio do texto:

1. ELEMENTOS AUTORIZADOS -- parta SOMENTE do Selo e do Tom de hoje como dois arquétipos gerais, mais a \
relação estrutural com o mapa natal da pessoa SE (e só se) "Relações autorizadas hoje" abaixo listar \
alguma. Você não tem acesso a nada mais sobre a vida real da pessoa hoje -- nenhuma biografia, evento \
ou sentimento específico.

2. RELAÇÃO SIMBÓLICA -- nomeie em poucas palavras o que aproxima ou separa esses elementos \
(ex.: "receptividade × sintonia").

3. MODO DA RELAÇÃO -- escolha UM destes cinco modos, o que descrever de verdade o que existe entre os \
elementos, sem forçar:
   - TENSION: os elementos puxam em direções opostas.
   - CONTRAST: são diferentes, mas não exatamente opostos.
   - COMPLEMENTARITY: se completam.
   - ENCOUNTER: se cruzam, sem tensão nem complementaridade clara.
   - SIMPLE_LENS: nenhuma relação especial se impõe -- só uma lente de observação lado a lado.
   NUNCA escolha TENSION só por parecer a opção "mais forte" -- se a oposição só existe forçando a mão, \
use outro modo. SIMPLE_LENS é uma escolha legítima, às vezes a mais honesta.

4. EXPERIÊNCIA HUMANA -- antes de escrever a reflexão, responda: "que experiência humana reconhecível \
pode existir entre esses movimentos?". Isso é diferente de descrever os arquétipos com outras palavras. \
Exemplo real (Mago/receptividade + Ressonante/sintonia, modo CONTRAST): "a diferença entre procurar uma \
resposta e estar disponível para perceber o que chega". A experiência humana:
   - NUNCA usa biografia que não esteja no payload;
   - NUNCA inventa acontecimentos;
   - NÃO é só trocar as palavras do Selo/Tom por sinônimos -- precisa nomear algo reconhecível na \
experiência humana de viver, não repetir o arquétipo com roupagem nova;
   - NÃO força uma tensão que o modo escolhido não pede;
   - NÃO converte o símbolo num traço psicológico da pessoa (nunca "você é alguém que...").

5. ARCO NARRATIVO -- a partir da experiência humana, escreva a reflexão como uma pequena história em \
2 a 4 parágrafos curtos: situação humana reconhecível -> nuance/contraste dentro dela -> abertura. NÃO \
entregue só uma frase-resumo tipo "uma lente possível é observar X e Y" -- a narrativa precisa CONDUZIR \
o leitor até a reflexão, não anunciá-la de cara.

6. PERGUNTA -- nasce da experiência humana da etapa 4, não das palavras-chave do Selo/Tom direto. Deve \
ser simples, permitir "não faz sentido pra mim" como resposta válida, evitar ter uma resposta óbvia, \
nunca recomendar uma decisão e nunca exigir que a pessoa confirme que a leitura "bateu".

Princípios inegociáveis (os mesmos de sempre):
- Consciência antes de previsão -- nunca afirme que algo vai acontecer, nunca dê conselho prescritivo.
- Possibilidade antes de regra -- ofereça uma lente de observação, não determine comportamento.
- Nunca diagnostique ("você é [característica]"), nunca invoque autoridade externa ("o universo").
- Nunca afirme causalidade direta entre o Kin/Selo e eventos do dia.
- Prefira "talvez", "uma lente possível", "pode valer observar".

Sobre o mapa natal -- MUITO IMPORTANTE: só mencione, insinue ou aproveite QUALQUER coincidência com o \
mapa natal da pessoa se "Relações autorizadas hoje" (abaixo, no contexto do dia) listar pelo menos uma. \
Se a lista estiver vazia, escreva inteiramente a partir do Selo/Tom de hoje -- nenhuma referência ao \
mapa natal, nem sutil.

Responda em JSON estrito com exatamente cinco chaves: "relation_mode" (uma das cinco palavras da etapa \
3, maiúsculas), "symbolic_relation" (a relação simbólica da etapa 2, poucas palavras), \
"human_experience" (1-2 frases, a experiência humana da etapa 4), "reflection" (2-4 parágrafos curtos, \
a narrativa da etapa 5) e "question" (a pergunta da etapa 6)."""


# --- v1.1.1 (20/08/2026, mesmo dia -- ajuste pontual) -- ÚNICA mudança
# real: a etapa 3 (MODO DA RELAÇÃO). Tudo o resto (elementos autorizados,
# experiência humana, arco narrativo, pergunta, princípios inegociáveis,
# regra do mapa natal) é IDÊNTICO à v1.1 -- copiado, não refatorado por
# trás de uma função de template, pra manter cada versão inteiramente
# autocontida e auditável isoladamente (mesmo padrão de _INSTRUCOES_BASE_
# TENSAO vs _INSTRUCOES_BASE: nunca foi feito diff-based nesta base de
# codigo).
#
# Motivo do ajuste: a bateria da v1.1 (12 pares, ver scripts/testar_prompt_
# v1_1_vs_v1.py) convergiu 11/12 em COMPLEMENTARITY e 0/12 em CONTRAST/
# ENCOUNTER/SIMPLE_LENS -- a v1.1 tinha resolvido "não force TENSION"
# trocando por "quase sempre COMPLEMENTARITY", nao pelo modo emergir de
# verdade da evidencia semantica entre os elementos. PROMPT_VERSION_V1_1
# fica CONGELADA como estava (nao foi reescrita) -- os resultados ja
# reportados sobre ela continuam validos pra aquele texto exato.
_INSTRUCOES_BASE_V1_1_1 = """Você escreve uma reflexão simbólica curta para o Presente, um instrumento de \
observação pessoal baseado no Dreamspell/Sincronário das 13 Luas.

Esta versão segue um pipeline de escrita em etapas -- o resultado final expõe as etapas intermediárias \
como campos do JSON, não como um raciocínio solto no meio do texto:

1. ELEMENTOS AUTORIZADOS -- parta SOMENTE do Selo e do Tom de hoje como dois arquétipos gerais, mais a \
relação estrutural com o mapa natal da pessoa SE (e só se) "Relações autorizadas hoje" abaixo listar \
alguma. Você não tem acesso a nada mais sobre a vida real da pessoa hoje -- nenhuma biografia, evento \
ou sentimento específico.

2. RELAÇÃO SIMBÓLICA -- nomeie em poucas palavras o que aproxima ou separa esses elementos \
(ex.: "receptividade × sintonia").

3. MODO DA RELAÇÃO -- antes de escolher, avalie a EVIDÊNCIA SEMÂNTICA real entre os dois elementos (e a \
relação natal autorizada, se houver). O modo tem que EMERGIR dessa evidência -- nunca ser escolhido \
pela preferência por uma narrativa mais "profunda", mais "rica" ou mais "harmoniosa". Os cinco modos \
têm força interpretativa CRESCENTE (o quanto você está afirmando existir de verdade entre os \
elementos):

   SIMPLE_LENS  <  ENCOUNTER  <  CONTRAST / COMPLEMENTARITY  <  TENSION

   Quanto maior a força, MAIOR a evidência exigida nos próprios elementos -- nunca invente ou force \
evidência só para justificar um modo mais forte.

   - TENSION: os elementos puxam GENUINAMENTE em direções diferentes -- há um atrito real entre eles, \
não fabricado. Use só quando esse puxão em direções opostas é claramente reconhecível nos próprios \
arquétipos.
   - CONTRAST: revelam perspectivas distintas SEM necessariamente entrar em conflito -- são diferentes, \
mas não estão puxando um contra o outro.
   - COMPLEMENTARITY: use SOMENTE quando um elemento REALMENTE completa, sustenta ou amplia o outro -- \
não é o modo "seguro" padrão, nem uma forma de garantir uma narrativa harmoniosa. Exige evidência \
concreta de que um elemento precisa do outro (ou o fortalece de um jeito específico), não só que os \
dois "convivem bem" ou "não se contradizem".
   - ENCOUNTER: os elementos apenas se encontram, e a relação entre eles ainda é aberta/ambígua -- não \
há evidência suficiente pra afirmar tensão, contraste ou complementaridade, mas também não é nada.
   - SIMPLE_LENS: não existe relação forte o suficiente pra justificar nenhum dos quatro modos acima -- \
os elementos só oferecem uma lente de observação lado a lado, sem uma relação declarada entre eles. \
Esta é uma saída PERFEITAMENTE BOA e esperada em boa parte dos dias -- NÃO é uma falha nem um sinal de \
que você "não encontrou nada"; é o modo mais honesto quando a evidência entre os dois elementos é fraca.

   REGRA DE DESEMPATE: se duas opções parecerem igualmente plausíveis, escolha SEMPRE a de MENOR força \
interpretativa (mais à esquerda na escala acima). Nunca escolha um modo mais forte só porque ele \
renderia uma reflexão mais interessante, mais profunda ou mais "completa" -- isso é exatamente o viés \
que esta regra existe para evitar.

   NÃO EXISTE DISTRIBUIÇÃO-ALVO entre os cinco modos. Cada dia é avaliado isoladamente, a partir só da \
evidência entre os elementos DESSE dia -- nunca tente variar, balancear ou "não repetir" o modo por \
causa de dias anteriores (você não tem acesso a eles, e mesmo que tivesse, isso não seria motivo válido \
pra escolher um modo).

4. EXPERIÊNCIA HUMANA -- antes de escrever a reflexão, responda: "que experiência humana reconhecível \
pode existir entre esses movimentos?". Isso é diferente de descrever os arquétipos com outras palavras. \
Exemplo real (Mago/receptividade + Ressonante/sintonia, modo CONTRAST): "a diferença entre procurar uma \
resposta e estar disponível para perceber o que chega". A experiência humana:
   - NUNCA usa biografia que não esteja no payload;
   - NUNCA inventa acontecimentos;
   - NÃO é só trocar as palavras do Selo/Tom por sinônimos -- precisa nomear algo reconhecível na \
experiência humana de viver, não repetir o arquétipo com roupagem nova;
   - NÃO força uma tensão (ou uma complementaridade) que o modo escolhido não pede;
   - NÃO converte o símbolo num traço psicológico da pessoa (nunca "você é alguém que...").

5. ARCO NARRATIVO -- a partir da experiência humana, escreva a reflexão como uma pequena história em \
2 a 4 parágrafos curtos: situação humana reconhecível -> nuance/contraste dentro dela -> abertura. NÃO \
entregue só uma frase-resumo tipo "uma lente possível é observar X e Y" -- a narrativa precisa CONDUZIR \
o leitor até a reflexão, não anunciá-la de cara. Isso vale pra qualquer modo escolhido, incluindo \
SIMPLE_LENS -- a narrativa não precisa fabricar uma relação mais forte do que a etapa 3 estabeleceu só \
para "ter mais o que contar".

6. PERGUNTA -- nasce da experiência humana da etapa 4, não das palavras-chave do Selo/Tom direto. Deve \
ser simples, permitir "não faz sentido pra mim" como resposta válida, evitar ter uma resposta óbvia, \
nunca recomendar uma decisão e nunca exigir que a pessoa confirme que a leitura "bateu".

Princípios inegociáveis (os mesmos de sempre):
- Consciência antes de previsão -- nunca afirme que algo vai acontecer, nunca dê conselho prescritivo.
- Possibilidade antes de regra -- ofereça uma lente de observação, não determine comportamento.
- Nunca diagnostique ("você é [característica]"), nunca invoque autoridade externa ("o universo").
- Nunca afirme causalidade direta entre o Kin/Selo e eventos do dia.
- Prefira "talvez", "uma lente possível", "pode valer observar".

Sobre o mapa natal -- MUITO IMPORTANTE: só mencione, insinue ou aproveite QUALQUER coincidência com o \
mapa natal da pessoa se "Relações autorizadas hoje" (abaixo, no contexto do dia) listar pelo menos uma. \
Se a lista estiver vazia, escreva inteiramente a partir do Selo/Tom de hoje -- nenhuma referência ao \
mapa natal, nem sutil.

Responda em JSON estrito com exatamente cinco chaves: "relation_mode" (uma das cinco palavras da etapa \
3, maiúsculas), "symbolic_relation" (a relação simbólica da etapa 2, poucas palavras), \
"human_experience" (1-2 frases, a experiência humana da etapa 4), "reflection" (2-4 parágrafos curtos, \
a narrativa da etapa 5) e "question" (a pergunta da etapa 6)."""

# Rótulos humanos das relações autorizadas (Gate 1.5) -- usados na
# construção dos prompts v1.1/v1.1.1, nunca repetidos em outro lugar
# (fonte unica: app/alpha/relevance.py define os tokens, este dict so
# traduz pra frase).
_RELATION_LABELS_V1_1 = {
    NIVEL_SAME_SEAL: "O Selo de hoje é o mesmo Selo do mapa natal da pessoa.",
    NIVEL_GUIDE_MATCH: "O Selo de hoje ocupa a posição de Guia (poder de direção/alinhamento) no mapa natal da pessoa.",
    NIVEL_ANALOG_MATCH: "O Selo de hoje ocupa a posição de Análogo (poder de apoio) no mapa natal da pessoa.",
    NIVEL_ANTIPODE_MATCH: "O Selo de hoje ocupa a posição de Antípoda (poder de desafio/fortalecimento) no mapa natal da pessoa.",
    NIVEL_OCCULT_MATCH: "O Selo de hoje ocupa a posição de Oculto (poder escondido) no mapa natal da pessoa.",
}


def _construir_prompt_v1_1_familia(instrucoes: str, versao_prompt: str, payload: dict, motivo_reprovacao: Optional[str] = None) -> str:
    """Compartilhada por v1.1 e v1.1.1 -- as duas so diferem no bloco de
    instrucoes (`instrucoes`); a montagem do contexto do dia (Selo/Tom/
    textos curados/relacoes autorizadas/motivo de reescrita) e identica,
    entao fica em 1 lugar so pra nao duplicar essa parte (que NAO mudou)."""
    partes = [
        instrucoes,
        f"\nVersão do prompt: {versao_prompt}",
        f"Selo de hoje: {payload['selo_hoje']}",
        f"Tom de hoje: {payload['tom_hoje']}",
    ]
    if payload["texto_curado_selo"]:
        partes.append(f"Sobre este Selo: {payload['texto_curado_selo']}")
    if payload["texto_curado_tom"]:
        partes.append(f"Sobre este Tom: {payload['texto_curado_tom']}")

    autorizadas = payload.get("authorized_relations") or []
    if autorizadas:
        linhas = [_RELATION_LABELS_V1_1[nivel] for nivel in autorizadas if nivel in _RELATION_LABELS_V1_1]
        partes.append(
            "\nRelações autorizadas hoje (pode mencionar como possibilidade de observação, nunca como "
            "fato garantido):\n- " + "\n- ".join(linhas)
        )
    else:
        partes.append(
            "\nRelações autorizadas hoje: nenhuma. Escreva só a partir do Selo/Tom de hoje -- não "
            "mencione nem insinue nenhuma coincidência com o mapa natal da pessoa."
        )

    if motivo_reprovacao:
        partes.append(
            f"\nATENÇÃO: uma tentativa anterior foi reprovada pelo seguinte motivo: {motivo_reprovacao}. "
            "Reescreva evitando exatamente isso."
        )
    return "\n".join(partes)


def construir_prompt(payload: dict, versao_prompt: str, motivo_reprovacao: Optional[str] = None) -> str:
    if versao_prompt == PROMPT_VERSION_V1_1:
        return _construir_prompt_v1_1_familia(_INSTRUCOES_BASE_V1_1, PROMPT_VERSION_V1_1, payload, motivo_reprovacao)
    if versao_prompt == PROMPT_VERSION_V1_1_1:
        return _construir_prompt_v1_1_familia(_INSTRUCOES_BASE_V1_1_1, PROMPT_VERSION_V1_1_1, payload, motivo_reprovacao)

    instrucoes_base = (
        _INSTRUCOES_BASE_TENSAO if versao_prompt == PROMPT_VERSION_TENSAO_CANDIDATO else _INSTRUCOES_BASE
    )
    partes = [
        instrucoes_base,
        f"\nVersão do prompt: {versao_prompt}",
        f"Selo de hoje: {payload['selo_hoje']}",
        f"Tom de hoje: {payload['tom_hoje']}",
    ]
    if payload["texto_curado_selo"]:
        partes.append(f"Sobre este Selo: {payload['texto_curado_selo']}")
    if payload["texto_curado_tom"]:
        partes.append(f"Sobre este Tom: {payload['texto_curado_tom']}")
    if payload["nivel_relacao"] == NIVEL_SAME_SEAL and payload["selo_natal"]:
        partes.append(
            f"Hoje o Selo do dia coincide com o Selo natal da pessoa ({payload['selo_natal']}) -- "
            "pode mencionar essa coincidência como uma possibilidade de observação, sem prescrever nada."
        )
    if motivo_reprovacao:
        partes.append(
            f"\nATENÇÃO: uma tentativa anterior foi reprovada pelo seguinte motivo: {motivo_reprovacao}. "
            "Reescreva evitando exatamente isso."
        )
    return "\n".join(partes)


# --- Persistencia / pipeline --------------------------------------------------

def _chave_lock(participante_id: int, data_referencia: datetime.date) -> int:
    """Chave de pg_advisory_xact_lock -- bigint assinado de 64 bits.
    participante_id nos 32 bits altos, ordinal da data nos 32 bits baixos
    -- unico por (participante, dia), determinístico, sem precisar de
    tabela auxiliar de locks."""
    return (participante_id << 32) | (data_referencia.toordinal() & 0xFFFFFFFF)


def _buscar_leitura(session: Session, participante_id: int, data_referencia: datetime.date) -> Optional[LeituraDiaria]:
    return (
        session.query(LeituraDiaria)
        .filter_by(participante_id=participante_id, data_referencia=data_referencia)
        .first()
    )


def _publicar(
    session: Session,
    participante: Participante,
    momento: MomentoDiario,
    resultado: ResultadoRelevancia,
    *,
    reflexao: Optional[str],
    pergunta: Optional[str],
    status_qa: str,
    versao_prompt: str,
    resumo_derivacao: dict,
) -> LeituraDiaria:
    linha = LeituraDiaria(
        participante_id=participante.id,
        data_referencia=momento.data_referencia,
        momento_diario_id=momento.id,
        resultado_relevancia_id=resultado.id,
        reflexao=reflexao,
        pergunta=pergunta,
        pratica=None,  # sem biblioteca de praticas curadas seedada ainda -- ver CLAUDE.md
        resumo_derivacao=resumo_derivacao,
        status_qa=status_qa,
        versao_prompt=versao_prompt,
        versao_ruleset_usada=resultado.versao_ruleset,
    )
    session.add(linha)
    session.commit()
    session.refresh(linha)
    return linha


def _resposta_para_log(resposta: RespostaGerada) -> dict:
    """Serializa uma RespostaGerada pro log de uma tentativa em
    resumo_derivacao["tentativas"] -- nomes alinhados com o vocabulario do
    pipeline conceitual da v1.1/v1.1.1 (elementos autorizados -> relacao
    simbolica -> modo da relacao -> experiencia humana -> arco narrativo
    -> reflexao -> pergunta). narrative_arc e reflection sao o MESMO
    campo (a reflexao de 2-4 paragrafos JA E o arco narrativo) -- listado
    2x de proposito, pra quem le o log nao precisar saber esse detalhe de
    implementacao pra encontrar o que procura por qualquer um dos 2 nomes.
    `tension` so e nao-None nas versoes anteriores a v1.1."""
    return {
        "relation_mode": resposta.relation_mode,
        "symbolic_relation": resposta.symbolic_relation,
        "human_experience": resposta.human_experience,
        "narrative_arc": resposta.reflection,
        "reflection": resposta.reflection,
        "question": resposta.question,
        "tension": resposta.tension,
    }


def _auditoria_para_log(auditoria: Optional[ResultadoAuditoria]) -> Optional[dict]:
    if auditoria is None:
        return None
    return {"aprovado": auditoria.aprovado, "motivo": auditoria.motivo, "detalhes": auditoria.detalhes}


def _rodar_pipeline_qa(payload: dict, versao_prompt: str, modelo: ModeloClient) -> tuple[Optional[RespostaGerada], str, dict]:
    """Nucleo puro do pipeline gerar->guardrail->auditor->reescrita->
    fallback, SEM persistencia -- extraido de dentro de
    obter_ou_publicar_leitura_diaria() pra ser reutilizavel por scripts de
    teste de prompt candidato (ver scripts/testar_prompt_candidato_tensao.py),
    que precisam rodar o mesmo QA real contra pares Selo/Tom sinteticos sem
    publicar LeituraDiaria (que so aceita 1 registro por participante/dia,
    entao nao daria pra comparar 2 versoes de prompt no mesmo dia de
    qualquer forma). Comportamento identico ao codigo anterior -- mesma
    ordem, mesmas contagens de chamada, mesma checagem dupla de guardrail
    (defesa em profundidade, ver docstring do modulo). Maximo de 1
    reescrita, 2a reprovacao -> fallback seguro -- isso NAO mudou.

    Retorna (resposta, status_qa, resumo_derivacao_parcial). `resposta` e
    None so no caso de fallback -- quem persiste decide o texto fixo
    (FALLBACK_REFLEXAO/FALLBACK_PERGUNTA); quem so quer inspecionar o
    resultado do teste trata None como "reprovou nas 2 tentativas".

    Observabilidade (20/08/2026 -- gap corrigido apos investigacao dos 2
    casos de FALLBACK_CURATED da bateria v1.1.1, ampliado ao promover
    v1.1.1 pra producao): resumo_derivacao agora sempre carrega
    "tentativas" (lista com 1 ou 2 entradas, uma por chamada real ao
    modelo) -- cada entrada com relation_mode/symbolic_relation/
    human_experience/narrative_arc/question/guardrail_motivos/auditoria
    completa (aprovado+motivo+os 8 campos estruturados do QA v1.1, quando
    aplicavel) -- em TODOS os status finais, nao so no fallback. As
    chaves antigas (motivo_reescrita, motivo_reprovacao_1/2, tentativa)
    continuam existindo do mesmo jeito, por compatibilidade com quem ja
    le resumo_derivacao (rotas/scripts existentes)."""
    modelo_usado = getattr(modelo, "model_id", None)
    tentativas_log: list[dict] = []

    prompt_1 = construir_prompt(payload, versao_prompt)
    resposta_1 = modelo.gerar(prompt_1)
    motivos_guardrail_1 = verificar_guardrail(resposta_1)
    log_1 = {"numero": 1, **_resposta_para_log(resposta_1), "guardrail_motivos": motivos_guardrail_1}

    if not motivos_guardrail_1:
        auditoria_1 = modelo.auditar(resposta_1, payload)
        log_1["auditoria"] = _auditoria_para_log(auditoria_1)
        if not verificar_guardrail(resposta_1) and auditoria_1.aprovado:
            log_1["aprovado"] = True
            tentativas_log.append(log_1)
            return resposta_1, STATUS_APPROVED_FIRST_TRY, {
                **payload, "tentativa": 1, "versao_prompt": versao_prompt,
                "modelo": modelo_usado, "tentativas": tentativas_log,
            }
        motivo_1 = auditoria_1.motivo or "reprovado pelo auditor (motivo não especificado)"
    else:
        log_1["auditoria"] = None
        motivo_1 = "; ".join(motivos_guardrail_1)

    log_1["aprovado"] = False
    log_1["motivo_reprovacao"] = motivo_1
    tentativas_log.append(log_1)

    # --- reescrita (so 1x) ----------------------------------------------------
    prompt_2 = construir_prompt(payload, versao_prompt, motivo_reprovacao=motivo_1)
    resposta_2 = modelo.gerar(prompt_2)
    motivos_guardrail_2 = verificar_guardrail(resposta_2)
    log_2 = {"numero": 2, **_resposta_para_log(resposta_2), "guardrail_motivos": motivos_guardrail_2}

    if not motivos_guardrail_2:
        auditoria_2 = modelo.auditar(resposta_2, payload)
        log_2["auditoria"] = _auditoria_para_log(auditoria_2)
        if not verificar_guardrail(resposta_2) and auditoria_2.aprovado:
            log_2["aprovado"] = True
            tentativas_log.append(log_2)
            return resposta_2, STATUS_APPROVED_AFTER_REWRITE, {
                **payload, "tentativa": 2, "versao_prompt": versao_prompt, "modelo": modelo_usado,
                "motivo_reescrita": motivo_1, "tentativas": tentativas_log,
            }
        motivo_2 = auditoria_2.motivo or "reprovado pelo auditor (motivo não especificado)"
    else:
        log_2["auditoria"] = None
        motivo_2 = "; ".join(motivos_guardrail_2)

    log_2["aprovado"] = False
    log_2["motivo_reprovacao"] = motivo_2
    tentativas_log.append(log_2)

    return None, STATUS_FALLBACK_CURATED, {
        **payload,
        "tentativa": "fallback",
        "versao_prompt": versao_prompt,
        "modelo": modelo_usado,
        "motivo_reprovacao_1": motivo_1,
        "motivo_reprovacao_2": motivo_2,
        "motivo_fallback": f"1ª tentativa: {motivo_1} | 2ª tentativa: {motivo_2}",
        "tentativas": tentativas_log,
    }


def obter_ou_publicar_leitura_diaria(
    session: Session,
    participante: Participante,
    momento: MomentoDiario,
    resultado: ResultadoRelevancia,
    modelo: ModeloClient,
    versao_prompt: str = PROMPT_VERSION,
) -> LeituraDiaria:
    """Get-or-create da leitura do dia. Protegida por
    pg_advisory_xact_lock ANTES de qualquer chamada ao modelo -- quem
    perde a corrida bloqueia no lock (nao gasta tokens), e ao destravar
    (a transacao vencedora ja fez commit) reencontra a linha publicada e
    a devolve sem gerar nada."""
    existente = _buscar_leitura(session, participante.id, momento.data_referencia)
    if existente is not None:
        return existente

    session.execute(text("SELECT pg_advisory_xact_lock(:chave)"), {"chave": _chave_lock(participante.id, momento.data_referencia)})

    # Double-checked locking: outra transacao pode ter publicado enquanto
    # esperavamos o lock -- se sim, e ela quem gerou, nao nos.
    existente = _buscar_leitura(session, participante.id, momento.data_referencia)
    if existente is not None:
        return existente

    if momento.tipo_dia == "HUNAB_KU_0_0":
        return _publicar(
            session, participante, momento, resultado,
            reflexao=None, pergunta=None, status_qa=STATUS_FIXED_HUNAB_KU,
            versao_prompt=versao_prompt,
            resumo_derivacao={"tipo_dia": "HUNAB_KU_0_0", "motivo": "sem Kin/Selo/Tom proprios nesse dia"},
        )

    payload = montar_payload_minimo(session, momento, resultado)
    resposta, status_qa, resumo_derivacao = _rodar_pipeline_qa(payload, versao_prompt, modelo)

    if resposta is not None:
        return _publicar(
            session, participante, momento, resultado,
            reflexao=resposta.reflection, pergunta=resposta.question,
            status_qa=status_qa, versao_prompt=versao_prompt,
            resumo_derivacao=resumo_derivacao,
        )

    # fallback curado (2a falha) -- nenhuma chamada de modelo daqui em diante
    return _publicar(
        session, participante, momento, resultado,
        reflexao=FALLBACK_REFLEXAO, pergunta=FALLBACK_PERGUNTA,
        status_qa=status_qa, versao_prompt=versao_prompt,
        resumo_derivacao=resumo_derivacao,
    )
