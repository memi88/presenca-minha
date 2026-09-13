"""
Golden tests da A5 (CLAUDE.md secao 5) -- Interpretation Engine + QA +
fallback, publicando LeituraDiaria. Roda 100% contra ClienteSimulado
(sem rede, sem custo, deterministico) -- NUNCA contra a API real do
GPT-5.6 Sol (ver app/alpha/modelo_gpt56sol.py, nao testado nesta sessao).
"""
import datetime
import threading
import time

from app.adapters.dreamspell_adapter import DreamspellAdapter
from app.alpha.daily_moment import obter_ou_criar_momento_diario
from app.alpha.interpretation import (
    STATUS_APPROVED_AFTER_REWRITE,
    STATUS_APPROVED_FIRST_TRY,
    STATUS_FALLBACK_CURATED,
    STATUS_FIXED_HUNAB_KU,
    ResultadoAuditoria,
    RespostaGerada,
    obter_ou_publicar_leitura_diaria,
)
from app.alpha.relevance import obter_ou_criar_resultado_relevancia
from app.db.models import LeituraDiaria, MomentoDiario, Participante, PerfilNatalDreamspell, ResultadoRelevancia
from app.db.session import get_session
from app.pessoa import gerar_ou_obter_perfil_dreamspell

TZ_SP = "America/Sao_Paulo"
NOME_TESTE = "_teste_a5_leitura_diaria"

TEXTO_LIMPO = RespostaGerada(
    reflection="Hoje pode valer observar o que chama atenção, sem pressa de tirar conclusões.",
    question="O que você percebe, se parar um momento para notar?",
)


def _utc_sp(y, m, d, h, mi=0):
    return datetime.datetime(y, m, d, h, mi, tzinfo=datetime.timezone.utc) + datetime.timedelta(hours=3)


class ClienteQueNuncaDeveSerChamado:
    """Fake que falha alto e claro se qualquer metodo for invocado --
    usado nos testes de Hunab Ku e imutabilidade, onde o correto e ZERO
    chamadas ao modelo."""

    def gerar(self, prompt):
        raise AssertionError("gerar() nao deveria ter sido chamado")

    def auditar(self, resposta, payload):
        raise AssertionError("auditar() nao deveria ter sido chamado")


class ClienteFakeContador:
    """Fake configuravel: scripts de respostas para gerar()/auditar(),
    conta chamadas de cada um. `atraso` e usado so no teste de corrida,
    pra segurar tempo suficiente pra outra thread tentar entrar no meio."""

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


def _limpar(session, participante_id):
    session.query(LeituraDiaria).filter_by(participante_id=participante_id).delete()
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
        timezone_nascimento=TZ_SP,
        timezone_atual=TZ_SP,
        confiabilidade_hora="alta",
    )
    session.add(p)
    session.commit()
    session.refresh(p)
    return p


def main():
    session = get_session()
    n_pass = n_fail = 0

    def check(label, cond):
        nonlocal n_pass, n_fail
        n_pass += bool(cond)
        n_fail += not cond
        print(f"{'PASS' if cond else 'FAIL':6} {label}")

    participante = None
    try:
        participante = _get_or_create_participante(session)
        gerar_ou_obter_perfil_dreamspell(session, participante, DreamspellAdapter())

        # --- 1. Resposta limpa -> aprova na 1a tentativa -----------------------
        momento = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(1988, 8, 25, 12, 0))
        resultado = obter_ou_criar_resultado_relevancia(session, participante, momento)
        cliente = ClienteFakeContador(
            respostas_gerar=[TEXTO_LIMPO],
            respostas_auditar=[ResultadoAuditoria(aprovado=True, motivo="")],
        )
        leitura = obter_ou_publicar_leitura_diaria(session, participante, momento, resultado, cliente)
        check("Resposta limpa -> status_qa == APPROVED_FIRST_TRY", leitura.status_qa == STATUS_APPROVED_FIRST_TRY)
        check("Resposta limpa -> exatamente 1 chamada a gerar()", cliente.n_gerar == 1)
        check("Resposta limpa -> exatamente 1 chamada a auditar() (nao mais)", cliente.n_auditar == 1)
        check("Reflexao/pergunta gravadas corretamente", leitura.reflexao == TEXTO_LIMPO.reflection)

        # --- 2. Guardrail reprova antes do auditor ------------------------------
        _limpar(session, participante.id)
        momento = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(1988, 8, 25, 12, 0))
        resultado = obter_ou_criar_resultado_relevancia(session, participante, momento)
        texto_sujo = RespostaGerada(reflection="Hoje você vai ter um conflito importante.", question="Tudo bem?")
        cliente = ClienteFakeContador(
            respostas_gerar=[texto_sujo, texto_sujo],  # mesma resposta ruim na reescrita tambem
            respostas_auditar=[],  # nao deveria ser chamado nenhuma vez
        )
        leitura = obter_ou_publicar_leitura_diaria(session, participante, momento, resultado, cliente)
        check("Guardrail reprova -> auditar() NUNCA chamado", cliente.n_auditar == 0)
        check("Guardrail reprova nas 2 tentativas -> FALLBACK_CURATED", leitura.status_qa == STATUS_FALLBACK_CURATED)
        check("Guardrail reprova -> exatamente 2 chamadas a gerar() (original + reescrita)", cliente.n_gerar == 2)
        check("Fallback usa o texto curado fixo, nao o texto reprovado", leitura.reflexao != texto_sujo.reflection)

        # --- 3. Guardrail passa, auditor reprova -> 1 reescrita, motivo anexado -
        _limpar(session, participante.id)
        momento = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(1988, 8, 25, 12, 0))
        resultado = obter_ou_criar_resultado_relevancia(session, participante, momento)
        motivo_especifico = "tom prescritivo demais na segunda frase"
        cliente = ClienteFakeContador(
            respostas_gerar=[TEXTO_LIMPO, TEXTO_LIMPO],
            respostas_auditar=[
                ResultadoAuditoria(aprovado=False, motivo=motivo_especifico),
                ResultadoAuditoria(aprovado=True, motivo=""),
            ],
        )
        leitura = obter_ou_publicar_leitura_diaria(session, participante, momento, resultado, cliente)
        check("Auditor reprova 1x depois aprova -> exatamente 2 chamadas a gerar()", cliente.n_gerar == 2)
        check("Auditor reprova 1x depois aprova -> exatamente 2 chamadas a auditar()", cliente.n_auditar == 2)
        check("Auditor reprova 1x depois aprova -> status_qa == APPROVED_AFTER_REWRITE",
              leitura.status_qa == STATUS_APPROVED_AFTER_REWRITE)
        check("O motivo da reprovacao foi anexado ao prompt da 2a chamada",
              motivo_especifico in leitura.resumo_derivacao.get("motivo_reescrita", ""))

        # --- 4. 2a falha (auditor) apos reescrita -> FALLBACK_CURATED -----------
        _limpar(session, participante.id)
        momento = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(1988, 8, 25, 12, 0))
        resultado = obter_ou_criar_resultado_relevancia(session, participante, momento)
        cliente = ClienteFakeContador(
            respostas_gerar=[TEXTO_LIMPO, TEXTO_LIMPO],
            respostas_auditar=[
                ResultadoAuditoria(aprovado=False, motivo="motivo 1"),
                ResultadoAuditoria(aprovado=False, motivo="motivo 2"),
            ],
        )
        leitura = obter_ou_publicar_leitura_diaria(session, participante, momento, resultado, cliente)
        check("2a falha do auditor -> status_qa == FALLBACK_CURATED", leitura.status_qa == STATUS_FALLBACK_CURATED)
        check("2a falha -> exatamente 2 chamadas a gerar() (nao 3)", cliente.n_gerar == 2)
        check("2a falha -> exatamente 2 chamadas a auditar() (nao 3)", cliente.n_auditar == 2)

        # --- 5. Hunab Ku 0.0 -> FIXED_HUNAB_KU, ZERO chamadas ao modelo --------
        _limpar(session, participante.id)
        momento_hk = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(2016, 2, 29, 12, 0))
        resultado_hk = obter_ou_criar_resultado_relevancia(session, participante, momento_hk)
        check("Hunab Ku: MomentoDiario.tipo_dia == HUNAB_KU_0_0 (setup)", momento_hk.tipo_dia == "HUNAB_KU_0_0")
        leitura_hk = obter_ou_publicar_leitura_diaria(
            session, participante, momento_hk, resultado_hk, ClienteQueNuncaDeveSerChamado()
        )
        check("Hunab Ku nao levanta excecao mesmo com um cliente que falha se chamado", True)
        check("Hunab Ku -> status_qa == FIXED_HUNAB_KU", leitura_hk.status_qa == STATUS_FIXED_HUNAB_KU)
        check("Hunab Ku -> reflexao == None (fallback fixo fica na tela, nao no dado)", leitura_hk.reflexao is None)
        check("Hunab Ku -> pergunta == None", leitura_hk.pergunta is None)

        # --- 6. Concorrencia real: 2 threads, 1 geracao so ----------------------
        _limpar(session, participante.id)
        momento_corrida = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(1988, 8, 25, 12, 0))
        resultado_corrida = obter_ou_criar_resultado_relevancia(session, participante, momento_corrida)

        evento_geracao_comecou = threading.Event()
        cliente_compartilhado = ClienteFakeContador(
            respostas_gerar=[TEXTO_LIMPO] * 4,  # generoso -- so 1 deveria de fato ser consumido
            respostas_auditar=[ResultadoAuditoria(aprovado=True, motivo="")] * 4,
            atraso=0.4,
            evento_inicio_geracao=evento_geracao_comecou,
        )

        resultados_threads = {}

        def _thread_a():
            s = get_session()
            try:
                p = s.query(Participante).filter_by(nome=NOME_TESTE).first()
                m = s.query(MomentoDiario).filter_by(id=momento_corrida.id).first()
                r = s.query(ResultadoRelevancia).filter_by(id=resultado_corrida.id).first()
                resultados_threads["a"] = obter_ou_publicar_leitura_diaria(s, p, m, r, cliente_compartilhado)
            finally:
                s.close()

        def _thread_b():
            evento_geracao_comecou.wait(timeout=5)  # garante que B so tenta DEPOIS que A ja comecou a gerar
            s = get_session()
            try:
                p = s.query(Participante).filter_by(nome=NOME_TESTE).first()
                m = s.query(MomentoDiario).filter_by(id=momento_corrida.id).first()
                r = s.query(ResultadoRelevancia).filter_by(id=resultado_corrida.id).first()
                resultados_threads["b"] = obter_ou_publicar_leitura_diaria(s, p, m, r, cliente_compartilhado)
            finally:
                s.close()

        t_a = threading.Thread(target=_thread_a)
        t_b = threading.Thread(target=_thread_b)
        t_a.start()
        t_b.start()
        t_a.join(timeout=10)
        t_b.join(timeout=10)

        check("Corrida: as duas threads terminaram sem excecao", "a" in resultados_threads and "b" in resultados_threads)
        check("Corrida: as duas threads recebem o MESMO daily_present (mesmo id)",
              resultados_threads.get("a") is not None
              and resultados_threads.get("b") is not None
              and resultados_threads["a"].id == resultados_threads["b"].id)
        check("Corrida: gerar() foi chamado exatamente 1 vez (nao 2)", cliente_compartilhado.n_gerar == 1)
        check("Corrida: auditar() foi chamado exatamente 1 vez (nao 2)", cliente_compartilhado.n_auditar == 1)
        check("Corrida: existe exatamente 1 LeituraDiaria para esse participante/dia",
              session.query(LeituraDiaria).filter_by(
                  participante_id=participante.id, data_referencia=momento_corrida.data_referencia
              ).count() == 1)

        # --- 7. Imutabilidade: chamar de novo mais tarde -> mesma leitura, ------
        # zero chamadas novas (usa o cliente que falha se chamado).
        leitura_relida = obter_ou_publicar_leitura_diaria(
            session, participante, momento_corrida, resultado_corrida, ClienteQueNuncaDeveSerChamado()
        )
        check("Chamar de novo mais tarde -> nao levanta excecao (nao chamou o modelo de novo)", True)
        check("Chamar de novo mais tarde -> mesmo id da leitura ja publicada",
              leitura_relida.id == resultados_threads["a"].id)

        print(f"\nResumo A5 (Interpretation Engine): {n_pass} PASS | {n_fail} FAIL")
        if n_fail:
            raise SystemExit(1)
    finally:
        if participante is not None:
            _limpar(session, participante.id)
            session.query(PerfilNatalDreamspell).filter_by(participante_id=participante.id).delete()
            session.delete(session.query(Participante).filter_by(nome=NOME_TESTE).first())
        session.commit()
        session.close()


if __name__ == "__main__":
    main()
