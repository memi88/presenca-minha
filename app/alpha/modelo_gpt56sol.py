"""
modelo_gpt56sol.py

Implementacao REAL do ModeloClient (app/alpha/interpretation.py) usando o
SDK padrao da OpenAI (`pip install openai`, ja em requirements.txt),
model="gpt-5.6-sol" (nome completo fixado, nao o alias "gpt-5.6" --
decisao do time: alias pode mudar de destino no futuro, o nome completo
nao). Usa a Responses API (recomendada pela OpenAI pra este modelo, tem
os recursos de reasoning/tool-use mais novos), com JSON estruturado pra
extrair reflection/question sem parsing fragil de texto livre.

*** TESTADO CONTRA A API DE VERDADE EM 19/08/2026 ***
Chave de producao do projeto "presente" criada na OpenAI, billing
configurado ($10 de credito, projeto OpenAI dedicado "presente"). Smoke
test manual (gerar() + auditar(), fora da suite automatizada -- custa
dinheiro real, nao roda em CI) confirmou o pipeline ponta a ponta:
gerar() produziu uma reflexao dentro dos principios, o guardrail
deterministico passou, e o auditor ISOLADO reprovou por causalidade
implicita sutil que o regex nao pega ("pode inspirar", "talvez torne...
presente") -- exatamente o tipo de nuance que a segunda camada de QA
existe para capturar.

*** ARMADILHA DE AMBIENTE, REGISTRADA AQUI PRA NAO SE REPETIR ***
Se OPENAI_API_KEY estiver exportada globalmente no shell (`echo
$OPENAI_API_KEY` fora deste projeto), ela GANHA do valor em `.env` --
pydantic-settings prioriza variavel de ambiente do SO sobre o arquivo
`.env` (comportamento padrao, nao um bug daqui). Isso mascarou uma chave
antiga de outro projeto OpenAI (sem o billing deste projeto) por varias
tentativas antes de identificarmos a causa via o header
`openai-project` da resposta de erro. Pra testar contra a chave DESTE
projeto especificamente quando o shell tiver uma OPENAI_API_KEY global,
rode com `env -u OPENAI_API_KEY` na frente do comando.

Mesma disciplina ja aplicada ao deploy do Railway na A2 (nao mexer em
ambiente compartilhado sem pedir) -- aqui e o analogo para credencial:
nao gastar chamadas reais contra a API sem a chave/billing serem
confirmados explicitamente pelo time primeiro.
"""
import json

from openai import OpenAI

from app.alpha.interpretation import ModeloClient, ResultadoAuditoria, RespostaGerada
from app.config import settings

MODEL_ID = "gpt-5.6-sol"  # nome completo, nao o alias "gpt-5.6" (ver docstring)

# Pricing confirmado pelo time (bate com o calculo de custo do piloto):
# $5/M tokens de entrada, $30/M de saida. Nao usado neste arquivo (nenhum
# calculo de custo em runtime ainda) -- registrado aqui pra nao se perder,
# ate existir uma etapa que precise rastrear gasto por leitura.
PRECO_ENTRADA_POR_MILHAO_USD = 5.0
PRECO_SAIDA_POR_MILHAO_USD = 30.0

_INSTRUCOES_AUDITOR = """Você é um auditor de qualidade independente para textos do Presente, um \
instrumento de observação simbólica (não previsão, não terapia).

Reprove qualquer texto que:
- afirme que algo vai acontecer;
- estabeleça causalidade explícita entre o Kin/Selo e eventos do dia;
- diagnostique a pessoa ("você é [característica]");
- presuma o que a pessoa está fazendo, sentindo ou vivendo hoje de forma específica, sem relação \
estrutural declarada por trás (ex.: "você está tentando ficar parado quando deveria se mover") -- \
mesmo que pareça sutil, bem escrito, ou uma consequência "lógica" de um arquétipo geral do dia;
- invoque autoridade externa ("o universo", "isso significa que você deve");
- contenha uma pergunta fechada (sim/não) que não deixe espaço para "não faz sentido pra mim".

Responda em JSON estrito com exatamente duas chaves: "aprovado" (true/false) e "motivo" \
(string -- vazia se aprovado, motivo específico da reprovação caso contrário)."""

# QA v1.1 / v1.1.1 (Gate 1.5, 20/08/2026) -- auditor isolado, COMPARTILHADO
# pelas duas candidatas (app/alpha/interpretation.py, PROMPT_VERSION_V1_1 e
# PROMPT_VERSION_V1_1_1) -- julga o JSON de saida (relation_mode/
# symbolic_relation/human_experience/reflection/question), nao qual prompt
# gerou, entao nao precisa saber a versao de geracao. Superset do auditor
# original: mesma lista de reprovação de sempre, MAIS 8 campos
# estruturados (6 da v1.1 original + 2 do ajuste de relation_mode da
# v1.1.1). 4 deles sao bloqueantes -- ver _auditar_v1_1() abaixo, que faz
# o override deterministico (nao confia so no "aprovado" auto-reportado
# pelo modelo pra esses 4).
_INSTRUCOES_AUDITOR_V1_1 = """Você é um auditor de qualidade independente para textos do Presente v1.1, \
um instrumento de observação simbólica (não previsão, não terapia) baseado no Dreamspell/Sincronário \
das 13 Luas.

Reprove ("aprovado": false) qualquer texto que:
- afirme que algo vai acontecer;
- estabeleça causalidade explícita entre o Kin/Selo e eventos do dia;
- diagnostique a pessoa ("você é [característica]");
- presuma o que a pessoa está fazendo, sentindo ou vivendo hoje de forma específica, sem relação \
estrutural declarada por trás -- mesmo que pareça sutil, bem escrito, ou uma consequência "lógica" de \
um arquétipo geral do dia;
- invoque autoridade externa ("o universo", "isso significa que você deve");
- contenha uma pergunta fechada (sim/não) que não deixe espaço para "não faz sentido pra mim".

Além disso, avalie e reporte cada um destes 6 pontos como true/false, com base no "Modo de relação", \
"Relação simbólica", "Experiência humana", "Reflexão" e "Pergunta" candidatos abaixo, e no contexto do \
dia (Selo/Tom/relações autorizadas):
- human_experience_supported_by_inputs: a experiência humana declarada nasce de verdade do Selo/Tom/ \
relação simbólica de hoje (e da relação natal autorizada, se houver), sem depender de nada fora disso?
- invented_user_context: o texto (reflexão, pergunta ou experiência humana) presume, cita ou insinua \
QUALQUER fato sobre a vida real da pessoa hoje que não esteja no contexto abaixo (biografia, evento, \
sentimento específico, decisão)? [true = violação]
- forced_opposition: o modo escolhido foi TENSION (ou a reflexão soa como oposição/conflito) mas essa \
oposição parece fabricada/forçada em vez de genuinamente presente entre os elementos? [true = violação]
- narrative_adds_meaning_not_facts: a reflexão elabora a experiência humana com sentido/nuance, sem \
inventar fatos novos (eventos, detalhes biográficos) que não estavam na experiência humana declarada?
- question_derives_from_human_experience: a pergunta nasce claramente da experiência humana declarada \
(não é uma pergunta genérica sobre o Selo/Tom só recolorida)?
- personalization_supported_by_relevance: SE o texto trata a leitura de hoje como pessoalmente \
significativa/coincidente para a pessoa, isso está apoiado nas "Relações autorizadas hoje" do contexto? \
Se personalization_status for NOT_AUTHORIZED e o texto ainda assim insinuar coincidência pessoal, isto \
é false. Se o texto não insinua nada pessoal, ou se insinua e está apoiado numa relação autorizada, \
isto é true.

Além dos 6 pontos acima, avalie também estes 2 sobre a escolha do MODO DA RELAÇÃO (TENSION/CONTRAST/ \
COMPLEMENTARITY/ENCOUNTER/SIMPLE_LENS -- os cinco modos têm força interpretativa crescente nesta ordem: \
SIMPLE_LENS < ENCOUNTER < CONTRAST/COMPLEMENTARITY < TENSION):
- relation_mode_supported_by_inputs: existe evidência semântica real, nos dois elementos do dia (Selo/ \
Tom/relação natal autorizada, se houver), para o modo escolhido? Ou o modo foi escolhido sem essa \
evidência específica -- ex.: chamado de COMPLEMENTARITY só porque os elementos "não se contradizem", \
sem nada que mostre que um de fato completa/sustenta/amplia o outro; ou chamado de TENSION só porque \
pareceria mais interessante?
- stronger_mode_used_without_need: o modo escolhido é MAIS FORTE do que a evidência sustenta -- ou \
seja, um modo mais fraco na escala acima descreveria a relação igual ou melhor, mas um mais forte foi \
escolhido mesmo assim (tipicamente pra tornar a reflexão mais "rica" ou "profunda")? Isto inclui o caso \
de COMPLEMENTARITY ser usado como resposta padrão só porque parece uma escolha segura e harmoniosa. \
[true = violação]

Responda em JSON estrito com exatamente 10 chaves: "aprovado" (true/false -- reprove se qualquer \
critério da primeira lista falhar OU se invented_user_context/forced_opposition/stronger_mode_used_without_need \
forem true OU se personalization_supported_by_relevance for false), "motivo" (string, \
vazia se aprovado), "human_experience_supported_by_inputs" (true/false), "invented_user_context" \
(true/false), "forced_opposition" (true/false), "narrative_adds_meaning_not_facts" (true/false), \
"question_derives_from_human_experience" (true/false), "personalization_supported_by_relevance" \
(true/false), "relation_mode_supported_by_inputs" (true/false), "stronger_mode_used_without_need" \
(true/false)."""


class GPT56SolClient:
    """Implementacao real, usando client.responses.create(). Nao
    instanciar sem OPENAI_API_KEY configurada (ver docstring do modulo)."""

    def __init__(self):
        if not settings.openai_api_key:
            raise RuntimeError(
                "OPENAI_API_KEY nao configurada -- GPT56SolClient nao pode ser "
                "instanciado. Configure a variavel de ambiente (local: .env; "
                "Railway: Variables do servico) antes de usar o Interpretation "
                "Engine de verdade. Para testes/desenvolvimento sem chave, use "
                "ClienteSimulado (tests/test_a5_interpretation.py)."
            )
        self._client = OpenAI(api_key=settings.openai_api_key)
        # Lido via getattr() por app/alpha/interpretation.py::_rodar_pipeline_qa
        # pra registrar "qual model" em resumo_derivacao, sem interpretation.py
        # precisar importar deste modulo (evitaria import circular -- este
        # arquivo ja importa DE interpretation.py).
        self.model_id = MODEL_ID

    def gerar(self, prompt: str) -> RespostaGerada:
        resposta = self._client.responses.create(
            model=MODEL_ID,
            input=prompt,
            text={"format": {"type": "json_object"}},
        )
        dados = json.loads(resposta.output_text)
        return RespostaGerada(
            reflection=dados["reflection"],
            question=dados["question"],
            # so presente no prompt candidato de tensao (ver
            # PROMPT_VERSION_TENSAO_CANDIDATO em interpretation.py) --
            # .get() porque o JSON da versao de producao nem tem essa chave.
            tension=dados.get("tension_chosen"),
            # so presentes na v1.1 (PROMPT_VERSION_V1_1) -- .get() pelo
            # mesmo motivo acima; nenhuma versao anterior tem essas chaves.
            relation_mode=dados.get("relation_mode"),
            symbolic_relation=dados.get("symbolic_relation"),
            human_experience=dados.get("human_experience"),
        )

    def auditar(self, resposta: RespostaGerada, payload: dict) -> ResultadoAuditoria:
        # relation_mode SO existe no JSON da v1.1 -- usado aqui como o
        # discriminador de qual auditor rodar, sem precisar mudar a
        # assinatura de ModeloClient.auditar() (que nao recebe versao_prompt
        # -- ver docstring de RespostaGerada em interpretation.py).
        if resposta.relation_mode:
            return self._auditar_v1_1(resposta, payload)

        # "Isolado" -- nao recebe o prompt da chamada de geracao (payload
        # basta pra julgar se o texto faz sentido pro dia), so o texto
        # candidato. Ver ModeloClient.auditar() em interpretation.py.
        # `tension` (quando presente) tambem e texto candidato, nao o
        # prompt de geracao -- inclui-lo aqui nao quebra o isolamento, e
        # da ao auditor o contexto de qual tensao foi escolhida, pra poder
        # julgar se ela vazou pra presuncao sobre a pessoa.
        prompt_auditoria = (
            f"{_INSTRUCOES_AUDITOR}\n\n"
            f"Contexto do dia: Selo={payload['selo_hoje']}, Tom={payload['tom_hoje']}, "
            f"nível de relação={payload['nivel_relacao']}.\n\n"
        )
        if resposta.tension:
            prompt_auditoria += f'Tensão arquetípica escolhida pelo processo de geração: "{resposta.tension}"\n\n'
        prompt_auditoria += (
            f'Reflexão candidata: "{resposta.reflection}"\n'
            f'Pergunta candidata: "{resposta.question}"'
        )
        saida = self._client.responses.create(
            model=MODEL_ID,
            input=prompt_auditoria,
            text={"format": {"type": "json_object"}},
        )
        dados = json.loads(saida.output_text)
        return ResultadoAuditoria(aprovado=bool(dados["aprovado"]), motivo=dados.get("motivo", ""))

    def _auditar_v1_1(self, resposta: RespostaGerada, payload: dict) -> ResultadoAuditoria:
        """QA v1.1/v1.1.1 (Gate 1.5) -- COMPARTILHADO pelas duas
        candidatas (julga o JSON de saida, nao qual prompt gerou). Isolado
        do mesmo jeito que o auditor original -- so texto candidato +
        payload, nunca o prompt de geracao. Defesa em profundidade: 4 dos
        8 campos estruturados sao bloqueantes por decisao explicita do
        time, aplicada AQUI no codigo (nao so confiando no "aprovado" que
        o proprio modelo reporta) -- mesmo raciocinio de
        verificar_guardrail() em interpretation.py, so que aqui a
        checagem e semantica (nao da pra fazer em regex), entao o
        "guardrail determinístico" vira "ler os campos estruturados do
        auditor e decidir em código, sem reinterpretar". stronger_mode_
        used_without_need (ajuste v1.1.1, ver interpretation.py) e o 4o
        bloqueante -- adicionado aqui, nao numa copia separada do
        auditor, porque a checagem de "o modo escolhido tem evidencia
        suficiente" vale igual pra qualquer resposta que declare um
        relation_mode, independente de qual prompt pediu pra declarar."""
        prompt_auditoria = (
            f"{_INSTRUCOES_AUDITOR_V1_1}\n\n"
            f"Contexto do dia: Selo={payload['selo_hoje']}, Tom={payload['tom_hoje']}, "
            f"personalization_status={payload.get('personalization_status')}, "
            f"authorized_relations={payload.get('authorized_relations')}.\n\n"
            f'Modo de relação escolhido: "{resposta.relation_mode}"\n'
            f'Relação simbólica: "{resposta.symbolic_relation}"\n'
            f'Experiência humana: "{resposta.human_experience}"\n'
            f'Reflexão candidata: "{resposta.reflection}"\n'
            f'Pergunta candidata: "{resposta.question}"'
        )
        saida = self._client.responses.create(
            model=MODEL_ID,
            input=prompt_auditoria,
            text={"format": {"type": "json_object"}},
        )
        dados = json.loads(saida.output_text)

        aprovado = bool(dados.get("aprovado"))
        # Override deterministico -- default "True" (violacao) se a chave
        # vier ausente do JSON, erro pra tras (reprovar), nunca pra frente.
        invented_user_context = bool(dados.get("invented_user_context", True))
        forced_opposition = bool(dados.get("forced_opposition", True))
        personalization_supported = bool(dados.get("personalization_supported_by_relevance", False))
        stronger_mode_used_without_need = bool(dados.get("stronger_mode_used_without_need", True))
        if invented_user_context or forced_opposition or stronger_mode_used_without_need or not personalization_supported:
            aprovado = False

        motivo = dados.get("motivo", "")
        if not aprovado and not motivo:
            motivos_bloqueio = []
            if invented_user_context:
                motivos_bloqueio.append("invented_user_context=true")
            if forced_opposition:
                motivos_bloqueio.append("forced_opposition=true")
            if stronger_mode_used_without_need:
                motivos_bloqueio.append("stronger_mode_used_without_need=true")
            if not personalization_supported:
                motivos_bloqueio.append("personalization_supported_by_relevance=false")
            motivo = "; ".join(motivos_bloqueio) or "reprovado pelo auditor v1.1 (motivo não especificado)"

        return ResultadoAuditoria(
            aprovado=aprovado,
            motivo=motivo,
            detalhes={
                "human_experience_supported_by_inputs": dados.get("human_experience_supported_by_inputs"),
                "invented_user_context": invented_user_context,
                "forced_opposition": forced_opposition,
                "relation_mode_supported_by_inputs": dados.get("relation_mode_supported_by_inputs"),
                "stronger_mode_used_without_need": stronger_mode_used_without_need,
                "narrative_adds_meaning_not_facts": dados.get("narrative_adds_meaning_not_facts"),
                "question_derives_from_human_experience": dados.get("question_derives_from_human_experience"),
                "personalization_supported_by_relevance": personalization_supported,
            },
        )
