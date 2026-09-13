"""
Teste de conclusao da Etapa 3: cache/congelamento respeita as regras de
Hoje (fotografia as 03:00 em timezone_atual) e Semana (segunda-domingo
civil em timezone_atual) -- nao recalcula dentro do mesmo periodo, e
recalcula corretamente na virada.
"""
import datetime

from app.adapters.numerology_adapter import NumerologyAdapter
from app.db.models import ElementoCalculadoHorizonte, Participante
from app.horizons import gerar_horizonte
from app.db.session import get_session

TZ = "America/Sao_Paulo"  # UTC-3, sem horario de verao atualmente no Brasil


def _utc(y, m, d, h, mi=0):
    # horario local (America/Sao_Paulo, UTC-3) convertido para UTC ingenuo
    return datetime.datetime(y, m, d, h, mi, tzinfo=datetime.timezone.utc) + datetime.timedelta(hours=3)


def get_or_create_participante_teste(session) -> Participante:
    p = session.query(Participante).filter_by(nome="_teste_etapa3").first()
    if p is not None:
        session.query(ElementoCalculadoHorizonte).filter_by(participante_id=p.id).delete()
        session.commit()
        return p
    p = Participante(
        nome="_teste_etapa3",
        nome_completo_nascimento="Linha De Teste Cache",
        data_nascimento=datetime.date(1990, 3, 10),
        hora_nascimento=datetime.time(10, 0),
        local_nascimento_texto="Teste, Teste",
        latitude=0.0,
        longitude=0.0,
        timezone_nascimento=TZ,
        timezone_atual=TZ,
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
        participante = get_or_create_participante_teste(session)
        adapter = NumerologyAdapter()

        # --- HOJE: fotografia as 03:00 em timezone_atual --------------------
        # 14/08/2026 02:00 local -> ainda "13/08/2026" pela regra das 03:00
        r1 = gerar_horizonte(session, participante, adapter, "hoje", now=_utc(2026, 8, 14, 2, 0))
        check("Hoje 02h00 local resolve para o dia civil anterior (13/08)",
              r1.chave_periodo == "2026-08-13")

        # 14/08/2026 02h50 local (ainda antes das 03:00) -> mesma chave, MESMA linha (nao recalcula)
        r2 = gerar_horizonte(session, participante, adapter, "hoje", now=_utc(2026, 8, 14, 2, 50))
        check("Hoje nao recalcula dentro do mesmo periodo (antes das 03:00)", r2.id == r1.id)

        # 14/08/2026 03h01 local -> vira o dia civil, nova chave, nova linha
        r3 = gerar_horizonte(session, participante, adapter, "hoje", now=_utc(2026, 8, 14, 3, 1))
        check("Hoje recalcula na virada das 03:00 (chave muda para 14/08)",
              r3.chave_periodo == "2026-08-14" and r3.id != r1.id)

        # 14/08/2026 23h59 local -> mesma chave de 14/08, mesma linha que r3 (nao recalcula)
        r4 = gerar_horizonte(session, participante, adapter, "hoje", now=_utc(2026, 8, 14, 23, 59))
        check("Hoje nao recalcula ate as 03:00 do dia seguinte", r4.id == r3.id)

        # --- SEMANA: segunda-domingo civil -----------------------------------
        # domingo 16/08/2026 (dentro da semana 10-16/08) e segunda 17/08/2026 (semana seguinte)
        s1 = gerar_horizonte(session, participante, adapter, "semana", now=_utc(2026, 8, 16, 10, 0))
        check("Semana de 16/08/2026 (domingo) = 2026-W33", s1.chave_periodo == "2026-W33")

        s2 = gerar_horizonte(session, participante, adapter, "semana", now=_utc(2026, 8, 12, 10, 0))
        check("Semana nao recalcula dentro da mesma semana civil (12/08 -> mesma W33)",
              s2.id == s1.id)

        s3 = gerar_horizonte(session, participante, adapter, "semana", now=_utc(2026, 8, 17, 10, 0))
        check("Semana recalcula na virada seg-feira (17/08 = W34, nova linha)",
              s3.chave_periodo == "2026-W34" and s3.id != s1.id)

        print(f"\nResumo Etapa 3 (cache): {n_pass} PASS | {n_fail} FAIL")
        if n_fail:
            raise SystemExit(1)
    finally:
        # limpeza
        session.query(ElementoCalculadoHorizonte).filter_by(participante_id=participante.id).delete()
        session.delete(session.query(Participante).filter_by(nome="_teste_etapa3").first())
        session.commit()
        session.close()


if __name__ == "__main__":
    main()
