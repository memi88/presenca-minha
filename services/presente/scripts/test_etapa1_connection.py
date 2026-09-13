"""
Teste de conclusao da Etapa 1: app conecta ao banco e consegue ler/escrever
uma linha de teste (IMPLEMENTATION_PLAN.md, Etapa 1).
"""
import datetime

from app.db.models import Participante
from app.db.session import get_session


def main():
    session = get_session()
    try:
        existing = session.query(Participante).filter_by(nome="_teste_etapa1").first()
        if existing:
            session.delete(existing)
            session.commit()

        linha = Participante(
            nome="_teste_etapa1",
            nome_completo_nascimento="Linha De Teste",
            data_nascimento=datetime.date(2000, 1, 1),
            hora_nascimento=datetime.time(12, 0),
            local_nascimento_texto="Teste, Teste",
            latitude=0.0,
            longitude=0.0,
            timezone_nascimento="America/Sao_Paulo",
            timezone_atual="America/Sao_Paulo",
            confiabilidade_hora="alta",
        )
        session.add(linha)
        session.commit()
        session.refresh(linha)
        print(f"ESCRITA OK -- id={linha.id}")

        lido = session.query(Participante).filter_by(nome="_teste_etapa1").one()
        assert lido.nome_completo_nascimento == "Linha De Teste"
        print(f"LEITURA OK -- nome_completo_nascimento={lido.nome_completo_nascimento!r}")

        session.delete(lido)
        session.commit()
        print("LIMPEZA OK -- linha de teste removida")
        print("\nEtapa 1: conexao com Postgres local, escrita e leitura -- PASS")
    finally:
        session.close()


if __name__ == "__main__":
    main()
