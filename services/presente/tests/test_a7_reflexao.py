"""
Golden tests da A7 (CLAUDE.md secao 5) -- fechamento do dia (ReflexaoDiaria).
Cobre exatamente os 6 casos obrigatorios do briefing + a extensao do
teste de isolamento (sem duplicar a suite inteira de
tests/test_auth_identidade.py -- so confirma que /fechamento passa pela
mesma checagem participante-vs-sessao).
"""
import datetime

from fastapi.testclient import TestClient

from app.adapters.dreamspell_adapter import DreamspellAdapter
from app.alpha.daily_moment import obter_ou_criar_momento_diario
from app.alpha.interpretation import ResultadoAuditoria, RespostaGerada, obter_ou_publicar_leitura_diaria
from app.alpha.reflexao import (
    RespostasLaboratorioInvalidas,
    ReflexaoJaCongelada,
    obter_reflexao_diaria,
    salvar_reflexao_diaria,
)
from app.alpha.relevance import obter_ou_criar_resultado_relevancia
from app.auth import COOKIE_NAME, criar_cookie_sessao
from app.db.models import LeituraDiaria, MomentoDiario, Participante, PerfilNatalDreamspell, ReflexaoDiaria, ResultadoRelevancia
from app.db.session import get_session
from app.main import app
from app.pessoa import gerar_ou_obter_perfil_dreamspell

TZ_SP = "America/Sao_Paulo"
NOME_TESTE = "_teste_a7_reflexao"


def _utc_sp(y, m, d, h, mi=0):
    return datetime.datetime(y, m, d, h, mi, tzinfo=datetime.timezone.utc) + datetime.timedelta(hours=3)


def _limpar(session, participante_id):
    session.query(LeituraDiaria).filter_by(participante_id=participante_id).delete()
    session.query(ResultadoRelevancia).filter_by(participante_id=participante_id).delete()
    session.query(MomentoDiario).filter_by(participante_id=participante_id).delete()
    session.query(ReflexaoDiaria).filter_by(participante_id=participante_id).delete()
    session.commit()


def _get_or_create_participante(session) -> Participante:
    p = session.query(Participante).filter_by(nome=NOME_TESTE).first()
    if p is not None:
        _limpar(session, p.id)
        return p
    p = Participante(
        nome=NOME_TESTE,
        nome_completo_nascimento="Teste A7 Reflexao",
        data_nascimento=datetime.date(1990, 3, 10),
        hora_nascimento=datetime.time(10, 0),
        local_nascimento_texto="Teste, Teste",
        latitude=0.0, longitude=0.0,
        timezone_nascimento=TZ_SP, timezone_atual=TZ_SP,
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
    participante = None
    try:
        participante = _get_or_create_participante(session)
        agora = _utc_sp(2026, 8, 19, 20, 0)  # 20h local, bem depois das 03:00
        hoje = datetime.date(2026, 8, 19)
        ontem = datetime.date(2026, 8, 18)

        # --- 1. Criar e ler no mesmo dia ----------------------------------------
        r1 = salvar_reflexao_diaria(
            session, participante, hoje,
            texto_livre="Foi um dia tranquilo.", marcador_rapido="ECO",
            respostas_laboratorio={"permanencia_espontanea": "uma_vez"},
            now=agora,
        )
        check("Criar: retorna uma ReflexaoDiaria com id", r1.id is not None)
        check("Criar: texto_livre gravado corretamente", r1.texto_livre == "Foi um dia tranquilo.")

        lida = obter_reflexao_diaria(session, participante, now=agora)
        check("Ler no mesmo dia: encontra a linha criada", lida is not None and lida.id == r1.id)
        check("Ler no mesmo dia: texto bate", lida.texto_livre == "Foi um dia tranquilo.")

        # --- 2. Atualizar no mesmo dia -- sobrescreve, nao duplica ---------------
        r2 = salvar_reflexao_diaria(
            session, participante, hoje,
            texto_livre="Editei -- na verdade foi um dia intenso.", marcador_rapido="PERCEPCAO_DIFERENTE",
            respostas_laboratorio={"permanencia_espontanea": "muitas_vezes"},
            now=agora,
        )
        check("Atualizar: mesmo id da linha original (não duplicou)", r2.id == r1.id)
        check("Atualizar: texto_livre sobrescrito", r2.texto_livre == "Editei -- na verdade foi um dia intenso.")
        check("Atualizar: marcador_rapido sobrescrito", r2.marcador_rapido == "PERCEPCAO_DIFERENTE")
        total = session.query(ReflexaoDiaria).filter_by(participante_id=participante.id, data_referencia=hoje).count()
        check("Atualizar: existe exatamente 1 linha pra esse (participante, dia)", total == 1)

        # --- 3. Tentar editar data_referencia de ontem -- bloqueado --------------
        # Simula uma ReflexaoDiaria que existia quando "ontem" ainda era hoje,
        # e agora tenta ser editada com o relogio ja em "hoje" (19/08).
        session.add(ReflexaoDiaria(
            participante_id=participante.id, data_referencia=ontem,
            texto_livre="Registro de ontem.", marcador_rapido=None, respostas_laboratorio={},
        ))
        session.commit()
        excecao_levantada = False
        try:
            salvar_reflexao_diaria(session, participante, ontem, texto_livre="Tentando editar depois que virou.", now=agora)
        except ReflexaoJaCongelada:
            excecao_levantada = True
        check("Editar data_referencia de ontem -> ReflexaoJaCongelada levantada", excecao_levantada)
        session.rollback()
        ontem_relido = session.query(ReflexaoDiaria).filter_by(participante_id=participante.id, data_referencia=ontem).first()
        check("Registro de ontem NÃO foi alterado pela tentativa bloqueada",
              ontem_relido is not None and ontem_relido.texto_livre == "Registro de ontem.")

        # --- 4. Escrever reflexão NÃO altera o daily_present correspondente ------
        momento = obter_ou_criar_momento_diario(session, participante, now=agora)
        resultado = obter_ou_criar_resultado_relevancia(session, participante, momento)

        class _ClienteFake:
            def gerar(self, prompt):
                return RespostaGerada(reflection="Reflexão gerada pela manhã, imutável.", question="Pergunta do dia?")

            def auditar(self, resposta, payload):
                return ResultadoAuditoria(aprovado=True, motivo="")

        leitura = obter_ou_publicar_leitura_diaria(session, participante, momento, resultado, _ClienteFake())
        texto_original_leitura = leitura.reflexao
        publicado_em_original = leitura.publicado_em

        salvar_reflexao_diaria(
            session, participante, hoje,
            texto_livre="Escrevendo minha reflexão pessoal do fechamento, bem diferente da gerada de manhã.",
            now=agora,
        )
        session.refresh(leitura)
        check("LeituraDiaria.reflexao (gerada de manhã) continua idêntica após salvar ReflexaoDiaria",
              leitura.reflexao == texto_original_leitura)
        check("LeituraDiaria.publicado_em não mudou (não foi tocada)", leitura.publicado_em == publicado_em_original)

        # --- 5. practice_experience só aceita valor com practice_done=true -------
        # Decisão registrada (app/alpha/reflexao.py): REJEITADO, não ignorado.
        excecao_invalida = False
        try:
            validar = salvar_reflexao_diaria(
                session, participante, hoje,
                respostas_laboratorio={"practice_done": "nao", "practice_experience": "ajudou"},
                now=agora,
            )
        except RespostasLaboratorioInvalidas:
            excecao_invalida = True
        check("practice_experience sem practice_done=='sim' -> REJEITADO (RespostasLaboratorioInvalidas)",
              excecao_invalida)

        # Confirma que o registro anterior (válido) não foi corrompido pela tentativa rejeitada.
        session.rollback()
        relido_apos_rejeicao = session.query(ReflexaoDiaria).filter_by(participante_id=participante.id, data_referencia=hoje).first()
        check("Registro existente não foi alterado pela tentativa inválida",
              relido_apos_rejeicao is not None and relido_apos_rejeicao.respostas_laboratorio.get("practice_experience") != "ajudou")

        # Caso válido, pra confirmar que a combinação correta passa normalmente.
        valido = salvar_reflexao_diaria(
            session, participante, hoje,
            respostas_laboratorio={"practice_done": "sim", "practice_experience": "ajudou"},
            now=agora,
        )
        check("practice_experience COM practice_done=='sim' -> aceito normalmente",
              valido.respostas_laboratorio.get("practice_experience") == "ajudou")

        # --- 6. Isolamento: /fechamento passa pela mesma checagem participante-vs-sessão --
        outro_nome = "_teste_a7_isolamento_outro"
        outro = session.query(Participante).filter_by(nome=outro_nome).first()
        if outro is None:
            outro = Participante(
                nome=outro_nome, nome_completo_nascimento="Outro A7",
                data_nascimento=datetime.date(1991, 5, 5), hora_nascimento=datetime.time(8, 0),
                local_nascimento_texto="Teste, Teste", latitude=0.0, longitude=0.0,
                timezone_nascimento=TZ_SP, timezone_atual=TZ_SP, confiabilidade_hora="alta",
            )
            session.add(outro)
            session.commit()
            session.refresh(outro)

        cliente = TestClient(app, follow_redirects=False)
        cliente.cookies.set(COOKIE_NAME, criar_cookie_sessao(NOME_TESTE))
        r_get = cliente.get(f"/{outro_nome}/fechamento")
        check("GET /{outro}/fechamento com sessão de outro participante -> bloqueado (303)",
              r_get.status_code == 303 and r_get.headers.get("location") == f"/{NOME_TESTE}/hoje")
        r_post = cliente.post(f"/{outro_nome}/fechamento", data={"texto_livre": "tentando escrever no lugar de outro"})
        check("POST /{outro}/fechamento com sessão de outro participante -> bloqueado (303)",
              r_post.status_code == 303 and r_post.headers.get("location") == f"/{NOME_TESTE}/hoje")
        check("Nada foi gravado na ReflexaoDiaria do outro participante",
              session.query(ReflexaoDiaria).filter_by(participante_id=outro.id).count() == 0)

        r_propria = cliente.get(f"/{NOME_TESTE}/fechamento")
        check("GET na própria URL de fechamento continua funcionando (200)", r_propria.status_code == 200)

        session.delete(session.query(Participante).filter_by(nome=outro_nome).first())
        session.commit()

        print(f"\nResumo A7 (ReflexaoDiaria): {n_pass} PASS | {n_fail} FAIL")
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
