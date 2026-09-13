"""
Golden tests da A6 (CLAUDE.md secao 5) -- tela diaria do Alpha
(/{participante}/presente). Roda via TestClient (integracao real: ASGI +
middleware de auth + Jinja2 + Postgres real), mas SEM chamar a API real
do GPT-5.6 Sol -- app.routes_experiencia.GPT56SolClient e monkeypatched
por um cliente fake dentro de cada teste (mesmo principio de
tests/test_a5_interpretation.py: determinismo, sem custo, sem rede).

Nota sobre o teste de "estado de carregamento": o Starlette TestClient
espera BackgroundTasks terminarem antes de devolver a resposta ao
processo de teste (comportamento documentado, verificado empiricamente),
entao nao da pra provar aqui o timing real de "o browser recebe a tela
de carregamento enquanto o servidor ainda gera" -- isso exigiria um
servidor ASGI de verdade + cliente HTTP externo, fora do escopo desta
suite. O que ESTE teste prova, com precisao: a resposta da PRIMEIRA
visita do dia (antes da LeituraDiaria existir) e o HTML da tela de
carregamento, no BODY da resposta -- nao o conteudo final -- confirmando
que a rota decide isso ANTES de disparar a geracao, nao depois.
"""
import datetime
import threading
import time

from fastapi.testclient import TestClient

import app.routes_experiencia as routes_experiencia
from app.adapters.dreamspell_adapter import DreamspellAdapter
from app.alpha.daily_moment import obter_ou_criar_momento_diario
from app.alpha.interpretation import ResultadoAuditoria, RespostaGerada
from app.alpha.relevance import obter_ou_criar_resultado_relevancia
from app.auth import COOKIE_NAME, criar_cookie_sessao
from app.db.models import ElementoCalculadoHorizonte, LeituraDiaria, MomentoDiario, Participante, PerfilNatalDreamspell, ResultadoRelevancia
from app.db.session import get_session
from app.engines.dreamspell_engine import full_reading, kin_today_or_for
from app.main import app
from app.pessoa import gerar_ou_obter_perfil_dreamspell
from app.routes_experiencia import HUNAB_KU_MENSAGEM, _contexto_entender_presente

NOME_TESTE = "_teste_a6_presente"

TEXTO_LIMPO = RespostaGerada(
    reflection="Hoje pode valer observar o que chama atenção, sem pressa de tirar conclusões.",
    question="O que você percebe, se parar um momento para notar?",
)

# Strings que NUNCA podem vazar pra UI (briefing da A6: campos de
# auditoria interna, nao de experiencia).
CAMPOS_PROIBIDOS_NA_UI = [
    "APPROVED_FIRST_TRY", "APPROVED_AFTER_REWRITE", "FALLBACK_CURATED",
    "reflection-1.0.0", "relevance-1.0.0", "SAME_SEAL", "NONE",
    "ruleset_version", "prompt_version", "qa_status", "tentativa",
]


class ClienteFakeSimples:
    """Aprova sempre, na 1a tentativa -- suficiente pros testes de UI que
    nao precisam exercitar reescrita/fallback (isso ja e coberto em
    tests/test_a5_interpretation.py; aqui o foco e o que a TELA faz com
    um resultado ja publicado)."""

    def __init__(self):
        self.n_gerar = 0

    def gerar(self, prompt):
        self.n_gerar += 1
        return TEXTO_LIMPO

    def auditar(self, resposta, payload):
        return ResultadoAuditoria(aprovado=True, motivo="")


class ClienteFakeContadorComAtraso:
    """Como ClienteFakeSimples, mas com atraso artificial em gerar() e
    contador protegido por lock -- usado no teste de reload concorrente
    (secao 5), onde varias threads podem chamar gerar()/auditar() ao
    mesmo tempo se a protecao da rota/pipeline falhar."""

    def __init__(self, atraso: float = 0.0):
        self.n_gerar = 0
        self.atraso = atraso
        self._lock = threading.Lock()

    def gerar(self, prompt):
        with self._lock:
            self.n_gerar += 1
        if self.atraso:
            time.sleep(self.atraso)
        return TEXTO_LIMPO

    def auditar(self, resposta, payload):
        return ResultadoAuditoria(aprovado=True, motivo="")


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
    # Nascimento = HOJE (nao 25/08/1988) de proposito: garante Kin/Selo
    # natal == Kin/Selo do dia por CONSTRUCAO (SAME_SEAL certo), em vez de
    # depender da coincidencia de o teste rodar exatamente num 25/08 --
    # a rota /presente sempre usa a data civil real, sem "now" injetavel.
    p = Participante(
        nome=NOME_TESTE,
        nome_completo_nascimento="Teste A6 Nascido Hoje",
        data_nascimento=datetime.date.today(),
        hora_nascimento=datetime.time(0, 40),
        local_nascimento_texto="Cachoeirinha, RS, Brasil",
        latitude=-29.95,
        longitude=-51.09,
        timezone_nascimento="America/Sao_Paulo",
        timezone_atual="America/Sao_Paulo",
        confiabilidade_hora="alta",
    )
    session.add(p)
    session.commit()
    session.refresh(p)
    return p


def main():
    n_pass = n_fail = 0

    def check(label, cond):
        nonlocal n_pass, n_fail
        n_pass += bool(cond)
        n_fail += not cond
        print(f"{'PASS' if cond else 'FAIL':6} {label}")

    session = get_session()
    client = TestClient(app)
    client.cookies.set(COOKIE_NAME, criar_cookie_sessao(NOME_TESTE))

    participante = None
    cliente_original = routes_experiencia.GPT56SolClient
    try:
        participante = _get_or_create_participante(session)
        gerar_ou_obter_perfil_dreamspell(session, participante, DreamspellAdapter())

        # --- 1. Dia regular aprovado na 1a tentativa: elementos visiveis, ---
        # nada de auditoria vazando. A geracao roda dentro do BackgroundTask
        # da 1a chamada (TestClient espera ele terminar -- ver docstring).
        fake = ClienteFakeSimples()
        routes_experiencia.GPT56SolClient = lambda: fake

        r1 = client.get(f"/{NOME_TESTE}/presente")
        check("GET /presente (1a visita do dia) -> HTTP 200", r1.status_code == 200)
        corpo1 = r1.text
        check("1a visita: body e a tela de carregamento (nao o conteudo final)",
              "Preparando a leitura de hoje" in corpo1 and TEXTO_LIMPO.reflection not in corpo1)

        r2 = client.get(f"/{NOME_TESTE}/presente")
        check("2a visita (mesmo dia, ja gerado em background) -> HTTP 200", r2.status_code == 200)
        corpo2 = r2.text
        check("Reflexao aparece no corpo principal", TEXTO_LIMPO.reflection in corpo2)
        check("Pergunta aparece, visualmente marcada como pergunta", TEXTO_LIMPO.question in corpo2 and "Uma pergunta" in corpo2)

        kin_hoje = kin_today_or_for(datetime.date.today())
        selo_hoje_nome = full_reading(kin_hoje).seal
        selo_hoje_pt = routes_experiencia.SELO_COR_EXIBICAO[selo_hoje_nome]
        check(f"Selo do dia ({selo_hoje_pt}) aparece no cabeçalho", selo_hoje_pt in corpo2)

        vazou = [c for c in CAMPOS_PROIBIDOS_NA_UI if c in corpo2]
        check(f"Nenhum campo de auditoria interna vazou pra UI (achados: {vazou})", not vazou)

        # --- 2. practice=null -> bloco de pratica AUSENTE, nao vazio --------
        check("Bloco de Prática não aparece quando practice=null", "Prática" not in corpo2 and "◌ Prática" not in corpo2)

        # --- 3. Entender o porquê explica em linguagem simples -------------
        check("'Entender o porquê' está presente e expansível", "Entender o porquê" in corpo2)
        check("Menciona o Selo do dia em linguagem legível (não crua)", "Selo do dia" in corpo2)
        check("Não expõe o token técnico SAME_SEAL/NONE cru no texto", "SAME_SEAL" not in corpo2)
        # Participante nascido hoje -> Selo do dia == Selo natal -> SAME_SEAL garantido por construcao.
        check("Entender explica a relação SAME_SEAL em frase legível (não o token cru)",
              "mesmo do seu mapa natal" in corpo2)

        check("Exatamente 1 chamada real ao gerar() (não regenerou na 2a visita)", fake.n_gerar == 1)

        # --- 4. Hunab Ku 0.0 -> reusa a MESMA mensagem de _card_dreamspell ---
        _limpar(session, participante.id)
        fake_hk = ClienteFakeSimples()  # nao deveria ser chamado nem uma vez
        routes_experiencia.GPT56SolClient = lambda: fake_hk

        # A rota /presente sempre usa a data civil REAL (nao aceita "now"
        # injetado) -- alcançar Hunab Ku de verdade via TestClient so
        # aconteceria em 29/02. Em vez de mockar datetime.now() global (
        # arriscado, afeta outras partes do processo), testamos as DUAS
        # pecas reutilizaveis diretamente com "now" injetado (mesmo padrao
        # de teste ja usado em A2/A4/A5): _card_dreamspell() (ja existente,
        # ja teve seu proprio teste completo em test_hunab_ku_call_sites.py)
        # e _contexto_entender_presente() (nova, da A6) -- confirmando que
        # as duas leem da MESMA constante HUNAB_KU_MENSAGEM.
        agora_hunab_ku = datetime.datetime(2016, 2, 29, 15, 0, tzinfo=datetime.timezone.utc)
        momento_hk = obter_ou_criar_momento_diario(session, participante, now=agora_hunab_ku)
        obter_ou_criar_resultado_relevancia(session, participante, momento_hk)

        linha_horizonte_hk = ElementoCalculadoHorizonte(
            participante_id=participante.id, sistema="dreamspell", horizonte="hoje",
            data_referencia=momento_hk.data_referencia, chave_periodo="teste-hk",
            elementos_json={"kin": None, "selo": None, "selo_cor": None, "tom": None,
                             "tom_numero": None, "onda_selo": None, "onda_cor": None,
                             "tipo_dia": "HUNAB_KU_0_0"},
            composition_status="nativo",
        )
        card_horizonte_hk = routes_experiencia._card_dreamspell(session, linha_horizonte_hk)
        # leitura=None e valido aqui -- o ramo de Hunab Ku de
        # _contexto_entender_presente() decide so por momento.tipo_dia,
        # nunca toca em leitura.resumo_derivacao nesse caminho.
        contexto_presente_hk = _contexto_entender_presente(leitura=None, momento=momento_hk)
        check("Card de horizonte (já existente) usa HUNAB_KU_MENSAGEM",
              card_horizonte_hk["leitura"] == HUNAB_KU_MENSAGEM)
        check("Tela /presente (A6) usa a MESMA constante HUNAB_KU_MENSAGEM, não uma segunda mensagem",
              HUNAB_KU_MENSAGEM in contexto_presente_hk["linhas"])
        check("As duas mensagens são literalmente o mesmo texto (fonte única)",
              card_horizonte_hk["leitura"] == contexto_presente_hk["linhas"][0])

        # --- 5. Revisao: reload NO MEIO da geracao (nao so 2 primeiras -----
        # visitas simultaneas -- aqui, N requests reais na ROTA, cada uma
        # enfileirando seu PROPRIO BackgroundTask via /presente, imitando
        # o auto-refresh da tela de carregamento). So testes anteriores
        # (A5) cobriam duas chamadas diretas ao pipeline competindo pelo
        # lock -- este cobre a camada da rota (multiplos BackgroundTasks
        # enfileirados de fato), que e uma peca nova da A6.
        _limpar(session, participante.id)
        fake_lento = ClienteFakeContadorComAtraso(atraso=0.4)
        routes_experiencia.GPT56SolClient = lambda: fake_lento

        resultados_polling = []
        erros_polling = []

        def _poll():
            try:
                c = TestClient(app)
                c.cookies.set(COOKIE_NAME, criar_cookie_sessao(NOME_TESTE))
                resultados_polling.append(c.get(f"/{NOME_TESTE}/presente"))
            except Exception as exc:  # noqa: BLE001 -- queremos ver qualquer falha da thread
                erros_polling.append(exc)

        threads = [threading.Thread(target=_poll) for _ in range(3)]
        for t in threads:
            t.start()
            time.sleep(0.05)  # escalona um pouco, simulando reloads chegando em sequencia rapida
        for t in threads:
            t.join(timeout=10)

        check("Polling concorrente (3 reloads durante a geração): nenhuma exceção nas threads", not erros_polling)
        check("Polling concorrente: as 3 respostas vieram HTTP 200",
              len(resultados_polling) == 3 and all(r.status_code == 200 for r in resultados_polling))
        check("Polling concorrente: gerar() foi chamado exatamente 1 vez, mesmo com reloads no meio",
              fake_lento.n_gerar == 1)
        check("Polling concorrente: existe exatamente 1 LeituraDiaria publicada",
              session.query(LeituraDiaria).filter_by(participante_id=participante.id).count() == 1)

        # --- 6. Revisao: isolamento entre participantes na mesma sessão ----
        # NAO ha vinculo entre a sessao autenticada (senha compartilhada,
        # cookie so {"ok": True}) e um participante especifico -- nenhuma
        # rota checa isso hoje. Registrado como GAP explicito, nao como
        # comportamento correto ANTES da correcao (19/08/2026) -- ver
        # tests/test_auth_identidade.py pra suite dedicada ao fluxo
        # inteiro (login -> escolha de identidade -> bloqueio de
        # mismatch). Aqui so confirmamos que a rota /presente
        # especificamente respeita isso.
        outro_nome = "_teste_a6_isolamento_outro"
        outro = session.query(Participante).filter_by(nome=outro_nome).first()
        if outro is None:
            outro = Participante(
                nome=outro_nome, nome_completo_nascimento="Outro Participante Teste",
                data_nascimento=datetime.date(1990, 3, 10), hora_nascimento=datetime.time(10, 0),
                local_nascimento_texto="Teste, Teste", latitude=0.0, longitude=0.0,
                timezone_nascimento="America/Sao_Paulo", timezone_atual="America/Sao_Paulo",
                confiabilidade_hora="alta",
            )
            session.add(outro)
            session.commit()
            session.refresh(outro)
        gerar_ou_obter_perfil_dreamspell(session, outro, DreamspellAdapter())

        cliente_sessao_guilherme = TestClient(app, follow_redirects=False)
        cliente_sessao_guilherme.cookies.set(COOKIE_NAME, criar_cookie_sessao(NOME_TESTE))
        routes_experiencia.GPT56SolClient = lambda: ClienteFakeSimples()
        r_outro = cliente_sessao_guilherme.get(f"/{outro_nome}/presente")
        check("Sessão de um participante tentando acessar /{outro}/presente é REDIRECIONADA (303), não 200",
              r_outro.status_code == 303)
        check("O redirecionamento manda de volta pra própria tela, não pra do outro participante",
              r_outro.headers.get("location") == f"/{NOME_TESTE}/hoje")

        r_seguindo = cliente_sessao_guilherme.get(f"/{outro_nome}/presente", follow_redirects=True)
        check("Seguindo o redirecionamento, o conteúdo é da PRÓPRIA pessoa, não do outro participante",
              outro_nome not in r_seguindo.text and r_seguindo.url.path == f"/{NOME_TESTE}/hoje")

        session.query(LeituraDiaria).filter_by(participante_id=outro.id).delete()
        session.query(ResultadoRelevancia).filter_by(participante_id=outro.id).delete()
        session.query(MomentoDiario).filter_by(participante_id=outro.id).delete()
        session.query(PerfilNatalDreamspell).filter_by(participante_id=outro.id).delete()
        session.delete(outro)
        session.commit()

        print(f"\nResumo A6 (tela /presente): {n_pass} PASS | {n_fail} FAIL")
        if n_fail:
            raise SystemExit(1)
    finally:
        routes_experiencia.GPT56SolClient = cliente_original
        if participante is not None:
            _limpar(session, participante.id)
            session.query(PerfilNatalDreamspell).filter_by(participante_id=participante.id).delete()
            session.delete(session.query(Participante).filter_by(nome=NOME_TESTE).first())
        session.commit()
        session.close()


if __name__ == "__main__":
    main()
