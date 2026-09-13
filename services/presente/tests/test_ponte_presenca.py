"""
Golden tests da Ponte Presenca (CLAUDE.md, 29/08/2026) --
GET /api/publico/hoje-dreamspell (app/ponte_presenca/). Roda 100% contra
ClienteFakeContador (sem rede, sem custo, deterministico), mesmo padrao
de tests/test_a5_interpretation.py -- NUNCA contra a API real do
GPT-5.6 Sol.

Cobre exatamente o que o time pediu pra esta etapa: idempotencia por dia
(sem participante), concorrencia real com o mesmo pg_advisory_xact_lock,
a resposta publica NUNCA vazando qa_status/prompt_version, e Hunab Ku 0.0
reusando o mesmo fallback fixo de tela (HUNAB_KU_MENSAGEM) em vez de um
texto novo.
"""
import datetime
import json
import threading
import time

from fastapi.testclient import TestClient

import app.ponte_presenca.routes as ponte_presenca_routes
from app.adapters.base import snapshot_date_hoje
from app.alpha.interpretation import PROMPT_VERSION, ResultadoAuditoria, RespostaGerada, _rodar_pipeline_qa
from app.alpha.relevance import NIVEL_NONE
from app.db.models import LeituraDiariaGenerica
from app.db.session import get_session
from app.main import app
from app.ponte_presenca.pipeline import TIMEZONE_PONTE_PRESENCA, obter_ou_publicar_leitura_generica
from app.routes_experiencia import HUNAB_KU_MENSAGEM

# Chaves que a resposta publica NUNCA pode conter -- auditoria interna do
# pipeline (texto de tentativas reprovadas incluso). Incidente real de
# 30/08/2026: a versao anterior (denylist) deixava "tentativas" passar
# inteiro. Ver app/ponte_presenca/routes.py.
CHAVES_PROIBIDAS_DERIVATION_SUMMARY = (
    "tentativas", "tentativa", "auditoria", "guardrail_motivos",
    "motivo_reprovacao", "motivo_reprovacao_1", "motivo_reprovacao_2",
    "motivo_fallback", "motivo_reescrita", "versao_prompt", "modelo",
    "status_qa", "qa_status", "personalization_status",
    "relationships_checked", "natal_oracle_context", "natal_selo_autorizado",
)
CHAVES_PERMITIDAS_DERIVATION_SUMMARY = {
    "tipo_dia", "tom_hoje", "selo_hoje", "selo_natal",
    "relation_mode", "texto_curado_tom", "texto_curado_selo", "authorized_relations",
}

PAYLOAD_GENERICO_EXEMPLO = {
    "selo_hoje": "Semente",
    "tom_hoje": "Auto-Existente",
    "tipo_dia": "REGULAR",
    "nivel_relacao": NIVEL_NONE,
    "selo_natal": None,
    "texto_curado_selo": "Potencial e florescimento — o ponto de partida de algo que ainda vai crescer.",
    "texto_curado_tom": "Auto-Existente — definir; dar forma e estrutura concreta a uma intenção.",
    "personalization_status": "NOT_AUTHORIZED",
    "authorized_relations": [],
    "natal_selo_autorizado": None,
    "natal_oracle_context": {},
    "relationships_checked": {},
}

TEXTO_LIMPO = RespostaGerada(
    reflection="Hoje pode valer observar o que chama atenção, sem pressa de tirar conclusões.",
    question="O que você percebe, se parar um momento para notar?",
)

# Datas sinteticas, exclusivas deste arquivo -- a tabela e por dia civil
# (sem participante), entao nao ha risco de colisao com outros testes.
DIA_REGULAR_1 = datetime.datetime(1991, 1, 10, 15, 0, tzinfo=datetime.timezone.utc)   # ~12h em America/Sao_Paulo
DIA_REGULAR_2 = datetime.datetime(1991, 3, 20, 15, 0, tzinfo=datetime.timezone.utc)
DIA_HUNAB_KU = datetime.datetime(2016, 2, 29, 15, 0, tzinfo=datetime.timezone.utc)


class ClienteQueNuncaDeveSerChamado:
    def gerar(self, prompt):
        raise AssertionError("gerar() nao deveria ter sido chamado")

    def auditar(self, resposta, payload):
        raise AssertionError("auditar() nao deveria ter sido chamado")


class ClienteFakeContador:
    def __init__(self, respostas_gerar, respostas_auditar, atraso=0.0, evento_inicio_geracao=None):
        self.respostas_gerar = list(respostas_gerar)
        self.respostas_auditar = list(respostas_auditar)
        self.n_gerar = 0
        self.n_auditar = 0
        self.atraso = atraso
        self.evento_inicio_geracao = evento_inicio_geracao
        self._lock = threading.Lock()

    def gerar(self, prompt):
        with self._lock:
            resposta = self.respostas_gerar[self.n_gerar]
            self.n_gerar += 1
        if self.evento_inicio_geracao is not None:
            self.evento_inicio_geracao.set()
        if self.atraso:
            time.sleep(self.atraso)
        return resposta

    def auditar(self, resposta, payload):
        with self._lock:
            resultado = self.respostas_auditar[self.n_auditar]
            self.n_auditar += 1
        return resultado


def _limpar(session, data_referencia):
    session.query(LeituraDiariaGenerica).filter_by(data_referencia=data_referencia).delete()
    session.commit()


def main():
    session = get_session()
    n_pass = n_fail = 0
    datas_usadas = set()

    def check(label, cond):
        nonlocal n_pass, n_fail
        n_pass += bool(cond)
        n_fail += not cond
        print(f"{'PASS' if cond else 'FAIL':6} {label}")

    try:
        # --- 1. Duas chamadas no mesmo dia -> mesma leitura, sem 2a geracao -----
        data_1 = None
        _limpar(session, datetime.date(1991, 1, 10))
        cliente = ClienteFakeContador(
            respostas_gerar=[TEXTO_LIMPO, TEXTO_LIMPO],  # generoso -- so 1 deveria ser consumido
            respostas_auditar=[ResultadoAuditoria(aprovado=True, motivo=""), ResultadoAuditoria(aprovado=True, motivo="")],
        )
        leitura_1a = obter_ou_publicar_leitura_generica(session, cliente, now=DIA_REGULAR_1)
        data_1 = leitura_1a.data_referencia
        datas_usadas.add(data_1)
        leitura_1b = obter_ou_publicar_leitura_generica(session, ClienteQueNuncaDeveSerChamado(), now=DIA_REGULAR_1)
        check("Duas chamadas no mesmo dia -> mesmo id de leitura", leitura_1a.id == leitura_1b.id)
        check("Duas chamadas no mesmo dia -> gerar() chamado so 1x", cliente.n_gerar == 1)
        check("Duas chamadas no mesmo dia -> auditar() chamado so 1x", cliente.n_auditar == 1)
        check(
            "Leitura publicada -- exatamente 1 linha em leituras_diarias_genericas pra esse dia",
            session.query(LeituraDiariaGenerica).filter_by(data_referencia=data_1).count() == 1,
        )
        check("Leitura publicada -- sem participante (tabela desacoplada, sem coluna participante_id)",
              not hasattr(LeituraDiariaGenerica, "participante_id"))

        # --- 2. Concorrencia real: 2 threads, dia diferente, 1 geracao so -------
        data_2 = datetime.date(1991, 3, 20)
        _limpar(session, data_2)
        evento_geracao_comecou = threading.Event()
        cliente_compartilhado = ClienteFakeContador(
            respostas_gerar=[TEXTO_LIMPO] * 4,
            respostas_auditar=[ResultadoAuditoria(aprovado=True, motivo="")] * 4,
            atraso=0.4,
            evento_inicio_geracao=evento_geracao_comecou,
        )
        resultados_threads = {}

        def _thread_a():
            s = get_session()
            try:
                resultados_threads["a"] = obter_ou_publicar_leitura_generica(s, cliente_compartilhado, now=DIA_REGULAR_2)
            finally:
                s.close()

        def _thread_b():
            evento_geracao_comecou.wait(timeout=5)
            s = get_session()
            try:
                resultados_threads["b"] = obter_ou_publicar_leitura_generica(s, cliente_compartilhado, now=DIA_REGULAR_2)
            finally:
                s.close()

        t_a = threading.Thread(target=_thread_a)
        t_b = threading.Thread(target=_thread_b)
        t_a.start()
        t_b.start()
        t_a.join(timeout=10)
        t_b.join(timeout=10)

        datas_usadas.add(data_2)
        check("Corrida: as duas threads terminaram sem excecao", "a" in resultados_threads and "b" in resultados_threads)
        check(
            "Corrida: as duas threads recebem a MESMA leitura (mesmo id)",
            resultados_threads.get("a") is not None
            and resultados_threads.get("b") is not None
            and resultados_threads["a"].id == resultados_threads["b"].id,
        )
        check("Corrida: gerar() foi chamado exatamente 1 vez (nao 2)", cliente_compartilhado.n_gerar == 1)
        check("Corrida: auditar() foi chamado exatamente 1 vez (nao 2)", cliente_compartilhado.n_auditar == 1)
        check(
            "Corrida: existe exatamente 1 linha pra esse dia",
            session.query(LeituraDiariaGenerica).filter_by(data_referencia=data_2).count() == 1,
        )

        # --- 3. Hunab Ku 0.0 -> reusa HUNAB_KU_MENSAGEM, zero chamadas ao modelo -
        data_hk = datetime.date(2016, 2, 29)
        _limpar(session, data_hk)
        datas_usadas.add(data_hk)
        leitura_hk = obter_ou_publicar_leitura_generica(session, ClienteQueNuncaDeveSerChamado(), now=DIA_HUNAB_KU)
        check("Hunab Ku: nao levanta excecao mesmo com cliente que falha se chamado", True)
        check("Hunab Ku: tipo_dia == HUNAB_KU_0_0", leitura_hk.tipo_dia == "HUNAB_KU_0_0")
        check("Hunab Ku: reflexao == None (fallback fixo fica na tela, nao no dado)", leitura_hk.reflexao is None)
        check("Hunab Ku: pergunta == None", leitura_hk.pergunta is None)

        # A rota real so usa a data civil REAL (mesma limitacao de
        # _contexto_entender_presente(), ver app/routes_experiencia.py) --
        # entao testamos a peca pura que traduz LeituraDiariaGenerica pro
        # JSON externo diretamente, com a leitura de Hunab Ku ja publicada.
        resposta_hk = ponte_presenca_routes._resposta_json(leitura_hk)
        check("Hunab Ku: resposta reusa HUNAB_KU_MENSAGEM (nao um texto novo)",
              resposta_hk["reflection"] == HUNAB_KU_MENSAGEM)
        check("Hunab Ku: question == None na resposta", resposta_hk["question"] is None)

        # --- 3b. Allowlist de derivation_summary -- reproduz o incidente real ---
        # de 30/08/2026 (denylist deixava "tentativas" inteiro vazar) e prova
        # que NUNCA mais acontece, em 2 cenarios reais do pipeline puro.

        # 3b-i. Aprovado de 1a tentativa, com relation_mode (v1.1.1) -- confirma
        # que relation_mode e extraido da tentativa PUBLICADA.
        resposta_v1_1_1 = RespostaGerada(
            reflection="Texto aprovado de primeira.",
            question="Uma pergunta aberta?",
            relation_mode="COMPLEMENTARITY",
            symbolic_relation="algo simbolico",
            human_experience="uma experiencia humana",
        )
        cliente_aprova = ClienteFakeContador(
            respostas_gerar=[resposta_v1_1_1],
            respostas_auditar=[ResultadoAuditoria(aprovado=True, motivo="")],
        )
        _, status_aprova, resumo_aprova = _rodar_pipeline_qa(PAYLOAD_GENERICO_EXEMPLO, PROMPT_VERSION, cliente_aprova)
        derivation_aprova = ponte_presenca_routes._construir_derivation_summary_publico(resumo_aprova)
        check("Allowlist (aprovado): chaves da resposta sao EXATAMENTE as permitidas",
              set(derivation_aprova.keys()) == CHAVES_PERMITIDAS_DERIVATION_SUMMARY)
        check("Allowlist (aprovado): relation_mode vem da tentativa PUBLICADA",
              derivation_aprova["relation_mode"] == "COMPLEMENTARITY")
        check("Allowlist (aprovado): tipo_dia/selo_hoje/tom_hoje corretos",
              derivation_aprova["tipo_dia"] == "REGULAR"
              and derivation_aprova["selo_hoje"] == "Semente"
              and derivation_aprova["tom_hoje"] == "Auto-Existente")
        for chave_proibida in CHAVES_PROIBIDAS_DERIVATION_SUMMARY:
            check(f"Allowlist (aprovado): NUNCA inclui '{chave_proibida}'", chave_proibida not in derivation_aprova)

        # 3b-ii. Fallback curado (guardrail/auditor reprovam as 2 tentativas) --
        # o cenario REAL que vazou em producao: resumo_aprova["tentativas"]
        # carrega o TEXTO INTEIRO das 2 tentativas reprovadas. Confirma que
        # nao sobra rastro nenhum delas na resposta publica, e que
        # relation_mode fica None (fallback e texto fixo, sem relation_mode).
        resposta_reprovada = RespostaGerada(
            reflection="Você vai ter um dia difícil amanhã.",  # violacao real de guardrail (futuro)
            question="Isso faz sentido?",  # pergunta fechada -- violacao real de auditor
            relation_mode="TENSION",
        )
        cliente_reprova = ClienteFakeContador(
            respostas_gerar=[resposta_reprovada, resposta_reprovada],
            respostas_auditar=[],  # guardrail already reprova a 1a -- auditor nunca roda nela
        )
        _, status_fallback, resumo_fallback = _rodar_pipeline_qa(PAYLOAD_GENERICO_EXEMPLO, PROMPT_VERSION, cliente_reprova)
        check("Allowlist (fallback): setup -- pipeline realmente caiu em fallback",
              status_fallback == "FALLBACK_CURATED")
        check("Allowlist (fallback): setup -- resumo interno REALMENTE carrega o texto reprovado (prova do vazamento original)",
              "Você vai ter um dia difícil amanhã." in json.dumps(resumo_fallback, ensure_ascii=False))
        derivation_fallback = ponte_presenca_routes._construir_derivation_summary_publico(resumo_fallback)
        check("Allowlist (fallback): chaves da resposta sao EXATAMENTE as permitidas",
              set(derivation_fallback.keys()) == CHAVES_PERMITIDAS_DERIVATION_SUMMARY)
        check("Allowlist (fallback): relation_mode == None (fallback e texto fixo, sem relation_mode)",
              derivation_fallback["relation_mode"] is None)
        corpo_fallback_serializado = json.dumps(derivation_fallback, ensure_ascii=False)
        check("Allowlist (fallback): o TEXTO REPROVADO nao aparece em lugar nenhum da resposta publica",
              "Você vai ter um dia difícil amanhã." not in corpo_fallback_serializado
              and "Isso faz sentido?" not in corpo_fallback_serializado)
        for chave_proibida in CHAVES_PROIBIDAS_DERIVATION_SUMMARY:
            check(f"Allowlist (fallback): NUNCA inclui '{chave_proibida}'", chave_proibida not in derivation_fallback)

        # --- 4. Nivel HTTP: rota publica, sem cookie nenhum ----------------------
        # A rota real SEMPRE usa a data civil REAL (obter_ou_publicar_leitura_
        # generica(session, modelo) sem `now`) -- nao da pra apontar pra uma
        # data sintetica do passado como nos passos 1-3. Por isso limpamos
        # a leitura de HOJE (se houver) antes de testar via TestClient.
        data_hoje_real = snapshot_date_hoje(TIMEZONE_PONTE_PRESENCA)
        datas_usadas.add(data_hoje_real)
        _limpar(session, data_hoje_real)

        client = TestClient(app)
        original_cliente = ponte_presenca_routes.GPT56SolClient

        try:
            # 4a. Primeira visita de hoje -- gera de verdade (cliente fake
            # aprova de primeira).
            cliente_http = ClienteFakeContador(
                respostas_gerar=[TEXTO_LIMPO],
                respostas_auditar=[ResultadoAuditoria(aprovado=True, motivo="")],
            )
            ponte_presenca_routes.GPT56SolClient = lambda: cliente_http
            resp = client.get("/api/publico/hoje-dreamspell")
            check("HTTP: rota publica responde 200 sem cookie nenhum", resp.status_code == 200)
            corpo = resp.json()
            check("HTTP: chaves da resposta sao exatamente reflection/question/derivation_summary",
                  set(corpo.keys()) == {"reflection", "question", "derivation_summary"})
            check("HTTP: derivation_summary tem EXATAMENTE as chaves permitidas (allowlist), nada mais",
                  set(corpo["derivation_summary"].keys()) == CHAVES_PERMITIDAS_DERIVATION_SUMMARY)
            for chave_proibida in CHAVES_PROIBIDAS_DERIVATION_SUMMARY:
                check(f"HTTP: derivation_summary NUNCA inclui '{chave_proibida}'",
                      chave_proibida not in corpo["derivation_summary"])
            check("HTTP: reflection bate com o texto gerado", corpo["reflection"] == TEXTO_LIMPO.reflection)
            check("HTTP: question bate com o texto gerado", corpo["question"] == TEXTO_LIMPO.question)

            # 4b. Segunda visita de hoje -- mesma leitura, ZERO chamada nova
            # ao modelo (usa o cliente que falha se chamado).
            ponte_presenca_routes.GPT56SolClient = lambda: ClienteQueNuncaDeveSerChamado()
            resp_2 = client.get("/api/publico/hoje-dreamspell")
            check("HTTP: 2a visita do dia responde 200 sem chamar o modelo de novo", resp_2.status_code == 200)
            corpo_2 = resp_2.json()
            check("HTTP: 2a visita devolve a MESMA reflection (idempotente)", corpo_2["reflection"] == corpo["reflection"])
            check("HTTP: existe exatamente 1 linha pra hoje mesmo apos 2 requests",
                  session.query(LeituraDiariaGenerica).filter_by(data_referencia=data_hoje_real).count() == 1)
        finally:
            ponte_presenca_routes.GPT56SolClient = original_cliente

        # --- 5. Verificacao direta: resumo_derivacao no BANCO tem versao_prompt -
        # (fica em log/DB, so nao pode vazar na resposta -- passo 4 ja provou
        # que a resposta filtra; aqui confirmamos que a informacao existe pra
        # quem precisa auditar depois).
        leitura_1_relida = session.query(LeituraDiariaGenerica).filter_by(data_referencia=data_1).first()
        check("DB: resumo_derivacao guarda versao_prompt (auditoria interna, so nao vaza na API)",
              "versao_prompt" in leitura_1_relida.resumo_derivacao)

        print(f"\nResumo Ponte Presenca: {n_pass} PASS | {n_fail} FAIL")
        if n_fail:
            raise SystemExit(1)
    finally:
        for data in datas_usadas:
            _limpar(session, data)
        session.close()


if __name__ == "__main__":
    main()
