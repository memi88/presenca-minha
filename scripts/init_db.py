"""Cria todas as tabelas do schema (Etapa 1) no Postgres apontado por DATABASE_URL."""
from app.db.base import Base
from app.db.session import engine
from app.db import models  # noqa: F401  -- garante que os modelos sao registrados no metadata

if __name__ == "__main__":
    Base.metadata.create_all(engine)
    print("Schema criado/atualizado com sucesso.")
    print("Tabelas:", sorted(Base.metadata.tables.keys()))
