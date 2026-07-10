import hmac
import os

from fastapi import Header, HTTPException


def _api_key() -> str:
    key = os.environ.get("IA_API_KEY")
    if not key:
        # Falha alto e cedo: sem chave configurada, o serviço não deveria
        # nem aceitar tráfego — não existe um "modo aberto" aceitável aqui,
        # é compute caro e exposto na internet.
        raise RuntimeError("IA_API_KEY não configurada no ambiente do serviço.")
    return key


async def exigir_chave(authorization: str = Header(default="")) -> None:
    esperado = _api_key()
    recebido = authorization.removeprefix("Bearer ").strip()
    if not recebido or not hmac.compare_digest(recebido, esperado):
        raise HTTPException(status_code=401, detail="chave de API inválida ou ausente")
