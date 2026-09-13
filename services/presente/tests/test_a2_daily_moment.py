"""
Golden tests da A2 (CLAUDE.md secao 5) -- contrato MomentoDiario
(daily_moment): corte de 03:00, idempotencia (incluindo corrida real
simulada), timezone diferente do servidor, e DAY_OUT_OF_TIME/HUNAB_KU_0_0
passando pelo contrato completo (nao so pelo motor puro).
"""
import datetime

from app.alpha.daily_moment import obter_ou_criar_momento_diario
from app.db.models import MomentoDiario, Participante
from app.db.session import get_session

TZ_SP = "America/Sao_Paulo"  # UTC-3, sem horario de verao atualmente no Brasil
TZ_AUCKLAND = "Pacific/Auckland"  # UTC+12 em agosto (inverno NZ, sem DST)

NOME_TESTE = "_teste_a2_momento_diario"


def _utc_sp(y, m, d, h, mi=0):
    # horario local em America/Sao_Paulo (UTC-3) convertido para UTC ingenuo
    return datetime.datetime(y, m, d, h, mi, tzinfo=datetime.timezone.utc) + datetime.timedelta(hours=3)


def _get_or_create_participante(session, timezone_atual=TZ_SP) -> Participante:
    p = session.query(Participante).filter_by(nome=NOME_TESTE).first()
    if p is not None:
        session.query(MomentoDiario).filter_by(participante_id=p.id).delete()
        p.timezone_atual = timezone_atual
        session.commit()
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
        timezone_atual=timezone_atual,
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

    try:
        participante = _get_or_create_participante(session, TZ_SP)

        # --- 1. Golden Profile de Guilherme, timezone padrao ------------------
        # 25/08/1988, bem depois das 03:00 local -> reference_date = 25/08/1988,
        # mesmo dia do Golden Profile / Gate 0 (Kin 169).
        m = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(1988, 8, 25, 12, 0))
        check("Golden Profile: data_referencia = 25/08/1988", m.data_referencia == datetime.date(1988, 8, 25))
        check("Golden Profile: Kin == 169 (bate com Gate 0)", m.kin == 169)
        check("Golden Profile: selo/cor == Lua Vermelho", (m.selo, m.selo_cor) == ("Lua", "Vermelho"))
        check("Golden Profile: tom == Cosmico", m.tom == "Cosmico")
        check("Golden Profile: tipo_dia == REGULAR", m.tipo_dia == "REGULAR")
        check("Golden Profile: timezone_usado grava o timezone_atual no momento do calculo",
              m.timezone_usado == TZ_SP)
        check("Golden Profile: versao_motor gravada", bool(m.versao_motor))

        # --- 2. Corte de 03:00 nos dois lados -----------------------------------
        session.query(MomentoDiario).filter_by(participante_id=participante.id).delete()
        session.commit()

        antes = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(2026, 8, 19, 2, 59))
        check("02h59 local -> reference_date = dia anterior (18/08)",
              antes.data_referencia == datetime.date(2026, 8, 18))

        depois = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(2026, 8, 19, 3, 0))
        check("03h00 local -> reference_date = hoje (19/08)",
              depois.data_referencia == datetime.date(2026, 8, 19))
        check("02h59 e 03h00 geram registros DIFERENTES (dias civis diferentes)",
              antes.id != depois.id)

        # --- 3. Idempotencia: duas chamadas no mesmo dia == mesma linha --------
        r1 = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(2026, 8, 19, 10, 0))
        r2 = obter_ou_criar_momento_diario(session, participante, now=_utc_sp(2026, 8, 19, 20, 0))
        check("Duas chamadas no mesmo dia -> mesmo id (nao duplica)", r1.id == r2.id)
        check("Duas chamadas no mesmo dia -> mesmo calculado_em (nao recalcula)", r1.calculado_em == r2.calculado_em)
        check("Nenhuma linha duplicada para (participante, 19/08) na tabela",
              session.query(MomentoDiario).filter_by(
                  participante_id=participante.id, data_referencia=datetime.date(2026, 8, 19)
              ).count() == 1)

        # --- 3b. Corrida real simulada: dois "processos" disputam o primeiro
        # acesso do dia. session_b vence a corrida DEPOIS do SELECT de
        # session_a mas ANTES do commit de session_a -- testa o except
        # IntegrityError de obter_ou_criar_momento_diario de verdade, nao so
        # a constraint do banco isoladamente.
        session.query(MomentoDiario).filter_by(participante_id=participante.id).delete()
        session.commit()

        session_a = get_session()
        session_b = get_session()
        try:
            participante_a = session_a.query(Participante).filter_by(nome=NOME_TESTE).first()
            now_corrida = _utc_sp(2026, 8, 20, 10, 0)

            estado = {"momento_b": None}
            commit_original = session_a.commit

            def commit_com_corrida_simulada():
                if estado["momento_b"] is None:
                    participante_b = session_b.query(Participante).filter_by(nome=NOME_TESTE).first()
                    estado["momento_b"] = obter_ou_criar_momento_diario(session_b, participante_b, now=now_corrida)
                commit_original()

            session_a.commit = commit_com_corrida_simulada
            momento_a = obter_ou_criar_momento_diario(session_a, participante_a, now=now_corrida)

            check("Corrida real: session_b venceu e comitou primeiro (setup do teste)",
                  estado["momento_b"] is not None)
            check("Corrida real: quem perde a corrida recebe a MESMA linha do vencedor (IntegrityError tratado)",
                  momento_a.id == estado["momento_b"].id)
            check("Corrida real: nenhuma linha duplicada para (participante, 20/08) apos a corrida",
                  session.query(MomentoDiario).filter_by(
                      participante_id=participante.id, data_referencia=datetime.date(2026, 8, 20)
                  ).count() == 1)
        finally:
            session_a.close()
            session_b.close()

        # --- 4. timezone_atual diferente do fuso do servidor (Railway = UTC) ---
        # 19/08/2026 20:00 UTC -> em Pacific/Auckland (UTC+12, sem DST em agosto)
        # ja e 20/08/2026 08:00 local, depois das 03:00 -> reference_date=20/08,
        # um dia inteiro a frente do calendario UTC do servidor.
        participante_nz = _get_or_create_participante(session, TZ_AUCKLAND)
        agora_utc = datetime.datetime(2026, 8, 19, 20, 0, tzinfo=datetime.timezone.utc)
        m_nz = obter_ou_criar_momento_diario(session, participante_nz, now=agora_utc)
        check("Timezone Pacific/Auckland (UTC+12): reference_date = 20/08 (um dia a frente do UTC do servidor)",
              m_nz.data_referencia == datetime.date(2026, 8, 20))
        check("timezone_usado grava Pacific/Auckland, nao UTC nem o fuso de nascimento",
              m_nz.timezone_usado == TZ_AUCKLAND)

        # --- 5. DAY_OUT_OF_TIME e HUNAB_KU_0_0 pelo contrato completo ----------
        session.query(MomentoDiario).filter_by(participante_id=participante.id).delete()
        session.commit()
        participante_sp = _get_or_create_participante(session, TZ_SP)

        doot = obter_ou_criar_momento_diario(session, participante_sp, now=_utc_sp(2016, 7, 25, 12, 0))
        check("25/07/2016 (Dia Fora do Tempo): tipo_dia == DAY_OUT_OF_TIME", doot.tipo_dia == "DAY_OUT_OF_TIME")
        check("25/07/2016: Kin existe e NAO e None (avanca normalmente)", doot.kin is not None)
        check("25/07/2016: selo/tom populados (nao nulos por default de schema)",
              doot.selo is not None and doot.tom is not None)

        session.query(MomentoDiario).filter_by(participante_id=participante.id).delete()
        session.commit()

        hk = obter_ou_criar_momento_diario(session, participante_sp, now=_utc_sp(2016, 2, 29, 12, 0))
        check("29/02/2016 (Hunab Ku 0.0): tipo_dia == HUNAB_KU_0_0", hk.tipo_dia == "HUNAB_KU_0_0")
        check("29/02/2016: kin == None (nao tem Kin proprio, nao veio um 0 ou default)", hk.kin is None)
        check("29/02/2016: selo == None", hk.selo is None)
        check("29/02/2016: selo_cor == None", hk.selo_cor is None)
        check("29/02/2016: tom == None", hk.tom is None)
        check("29/02/2016: mesmo com todos os campos None, o registro existe (chegou ao banco)",
              session.query(MomentoDiario).filter_by(id=hk.id).first() is not None)

        print(f"\nResumo A2 (MomentoDiario): {n_pass} PASS | {n_fail} FAIL")
        if n_fail:
            raise SystemExit(1)
    finally:
        session.query(MomentoDiario).filter_by(participante_id=participante.id).delete()
        session.delete(session.query(Participante).filter_by(nome=NOME_TESTE).first())
        session.commit()
        session.close()


if __name__ == "__main__":
    main()
