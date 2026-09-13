"""
Teste de follow-up (19/08/2026): os 3 call sites do DreamspellAdapter que
chamam kin_today_or_for() (compute_pessoa, compute_horizonte "hoje" e
"semana") nao podem mais crashar em Hunab Ku 0.0 (29/02) desde que
kin_today_or_for() passou a devolver None nesse dia (ver
ENGINE_VALIDATION.md secao 8).

"Stack completa" aqui = adapter -> gerar_horizonte()/persistencia real no
Postgres -> _card_dreamspell() (a mesma funcao que as rotas HTTP usam pra
montar o card exibido) -- nao sobe ate uma chamada HTTP de verdade, mas
exercita todas as camadas que decidem o dado e o card, nao so o motor.
"""
import datetime

from app.adapters.base import HorizonteNaoSuportado, ParticipanteInput
from app.adapters.dreamspell_adapter import DreamspellAdapter
from app.db.models import ElementoCalculadoHorizonte, Participante
from app.db.session import get_session
from app.horizons import gerar_horizonte
from app.routes_experiencia import _card_dreamspell

TZ_SP = "America/Sao_Paulo"
NOME_TESTE = "_teste_hunab_ku_callsites"


def _utc_sp(y, m, d, h, mi=0):
    return datetime.datetime(y, m, d, h, mi, tzinfo=datetime.timezone.utc) + datetime.timedelta(hours=3)


def _get_or_create_participante(session, data_nascimento, hora_nascimento) -> Participante:
    p = session.query(Participante).filter_by(nome=NOME_TESTE).first()
    if p is not None:
        session.query(ElementoCalculadoHorizonte).filter_by(participante_id=p.id).delete()
        p.data_nascimento = data_nascimento
        p.hora_nascimento = hora_nascimento
        session.commit()
        return p
    p = Participante(
        nome=NOME_TESTE,
        nome_completo_nascimento="Teste Hunab Ku",
        data_nascimento=data_nascimento,
        hora_nascimento=hora_nascimento,
        local_nascimento_texto="Teste, Teste",
        latitude=0.0,
        longitude=0.0,
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

    adapter = DreamspellAdapter()
    participante = None
    try:
        # --- 1. compute_pessoa: nascimento em 29/02 antes de 12:00 -> 28/02 ---
        participante = _get_or_create_participante(
            session, datetime.date(2016, 2, 29), datetime.time(6, 0)
        )
        entrada = ParticipanteInput(
            nome_completo_nascimento=participante.nome_completo_nascimento,
            data_nascimento=participante.data_nascimento,
            hora_nascimento=participante.hora_nascimento,
            timezone_nascimento=participante.timezone_nascimento,
            timezone_atual=participante.timezone_atual,
            latitude=participante.latitude,
            longitude=participante.longitude,
        )
        pessoa_antes = adapter.compute_pessoa(entrada)
        check("compute_pessoa nao crasha para nascimento em 29/02 antes de 12:00", True)
        check("29/02 antes de 12:00 -> assinatura de 28/02 (Kin 71)", pessoa_antes["kin"] == 71)
        check("29/02 antes de 12:00 -> kin nunca None", pessoa_antes["kin"] is not None)

        # --- 1b. mesma data, depois de 12:00 -> assinatura de 01/03 -----------
        participante = _get_or_create_participante(
            session, datetime.date(2016, 2, 29), datetime.time(18, 0)
        )
        entrada = ParticipanteInput(
            nome_completo_nascimento=participante.nome_completo_nascimento,
            data_nascimento=participante.data_nascimento,
            hora_nascimento=participante.hora_nascimento,
            timezone_nascimento=participante.timezone_nascimento,
            timezone_atual=participante.timezone_atual,
            latitude=participante.latitude,
            longitude=participante.longitude,
        )
        pessoa_depois = adapter.compute_pessoa(entrada)
        check("29/02 depois de 12:00 -> assinatura de 01/03 (Kin 72)", pessoa_depois["kin"] == 72)

        # --- 2. compute_horizonte "hoje" pousando em 29/02 (participante   ---
        # nascido em data normal -- o que importa aqui e o DIA CONSULTADO,
        # nao o nascimento) -- via gerar_horizonte(), persistencia real.
        participante = _get_or_create_participante(
            session, datetime.date(1990, 3, 10), datetime.time(10, 0)
        )
        linha_hoje = gerar_horizonte(session, participante, adapter, "hoje", now=_utc_sp(2016, 2, 29, 12, 0))
        check("gerar_horizonte('hoje') nao crasha quando o dia e Hunab Ku 0.0", True)
        check("Hoje=29/02: kin persistido == None", linha_hoje.elementos_json["kin"] is None)
        check("Hoje=29/02: tipo_dia persistido == HUNAB_KU_0_0", linha_hoje.elementos_json["tipo_dia"] == "HUNAB_KU_0_0")

        card_hoje = _card_dreamspell(session, linha_hoje)
        check("_card_dreamspell('hoje') nao crasha em Hunab Ku (SELO_COR_EXIBICAO[None] evitado)", True)
        check("Card 'hoje' de Hunab Ku sinaliza isso no dado_principal", card_hoje["dado_principal"] == "Hunab Ku 0.0")

        # --- 3. compute_horizonte "semana" cobrindo a semana com 29/02/2016 --
        # 29/02/2016 foi uma segunda-feira -> semana de 29/02 a 06/03/2016.
        linha_semana = gerar_horizonte(session, participante, adapter, "semana", now=_utc_sp(2016, 3, 2, 12, 0))
        check("gerar_horizonte('semana') nao crasha numa semana que contem Hunab Ku", True)
        dia_2902 = next(d for d in linha_semana.elementos_json["dias"] if d["data"] == "2016-02-29")
        check("Semana: o dia 29/02 tem kin == None dentro de 'dias'", dia_2902["kin"] is None)
        outros_dias = [d for d in linha_semana.elementos_json["dias"] if d["data"] != "2016-02-29"]
        check("Semana: os outros 6 dias continuam com Kin numerico normal",
              all(d["kin"] is not None for d in outros_dias) and len(outros_dias) == 6)

        card_semana = _card_dreamspell(session, linha_semana)
        check("_card_dreamspell('semana') nao crasha com um dia Hunab Ku dentro da semana", True)
        check("Card 'semana' usa '—' no lugar do Kin ausente de 29/02", "—" in card_semana["dado_principal"])

        # --- 4. Dia Fora do Tempo (25/07) continua com Kin normal, sem GAP ---
        linha_doot = gerar_horizonte(session, participante, adapter, "hoje", now=_utc_sp(2016, 7, 25, 12, 0))
        check("Hoje=25/07 (Dia Fora do Tempo): kin existe normalmente", linha_doot.elementos_json["kin"] is not None)
        check("Hoje=25/07: tipo_dia == DAY_OUT_OF_TIME", linha_doot.elementos_json["tipo_dia"] == "DAY_OUT_OF_TIME")
        card_doot = _card_dreamspell(session, linha_doot)
        check("_card_dreamspell('hoje') em Dia Fora do Tempo usa o caminho normal (nao o de Hunab Ku)",
              card_doot["dado_principal"] != "Hunab Ku 0.0")

        # --- 5. horizonte nao suportado continua levantando a excecao certa --
        try:
            adapter.compute_horizonte(entrada, "ano", datetime.date(2026, 8, 19))
            check("compute_horizonte('ano') deveria levantar HorizonteNaoSuportado", False)
        except HorizonteNaoSuportado:
            check("compute_horizonte('ano') ainda levanta HorizonteNaoSuportado normalmente", True)

        print(f"\nResumo (call sites Hunab Ku): {n_pass} PASS | {n_fail} FAIL")
        if n_fail:
            raise SystemExit(1)
    finally:
        if participante is not None:
            session.query(ElementoCalculadoHorizonte).filter_by(participante_id=participante.id).delete()
        p = session.query(Participante).filter_by(nome=NOME_TESTE).first()
        if p is not None:
            session.delete(p)
        session.commit()
        session.close()


if __name__ == "__main__":
    main()
