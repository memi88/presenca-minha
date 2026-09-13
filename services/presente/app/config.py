from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    # Sem default -- uma senha/segredo adivinhavel em produção é pior do
    # que o app recusar subir. Precisam ser definidos explicitamente via
    # variável de ambiente (local: .env; Railway: Variables do serviço).
    app_password: str
    session_secret: str
    # Optional (com default None) de proposito, ao contrario dos campos
    # acima -- a A5 (Interpretation Engine, ver app/alpha/modelo_gpt56sol.py)
    # e a unica parte do app que precisa disso, e o app inteiro nao deveria
    # recusar subir so porque a chave da OpenAI ainda nao foi configurada.
    # A falta da chave vira erro explicito SO quando o cliente real e
    # instanciado (nao testado contra a API de verdade nesta sessao --
    # ver app/alpha/modelo_gpt56sol.py).
    openai_api_key: Optional[str] = None

    @field_validator("database_url")
    @classmethod
    def normalizar_database_url(cls, v: str) -> str:
        """Railway e Supabase entregam DATABASE_URL como `postgres://` ou
        `postgresql://` -- este projeto usa o driver psycopg3
        (`postgresql+psycopg://`). Normalizar aqui, uma vez só, é o que
        permite trocar Postgres local -> Railway Postgres -> Supabase sem
        tocar em nenhum outro módulo (nenhum deles lê DATABASE_URL
        diretamente, todos passam por `settings.database_url`)."""
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://"):]
        scheme = v.split("://", 1)[0]
        if scheme == "postgresql":
            v = "postgresql+psycopg://" + v[len("postgresql://"):]
        return v


settings = Settings()
