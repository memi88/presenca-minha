"""
auth.py (ponte_presenca)

Auth servidor-a-servidor pro endpoint personalizado -- mesmo padrão já
provado em services/ia/app/auth.py (Bearer + hmac.compare_digest, falha
alto e cedo se a chave não estiver configurada, "não existe modo aberto
aceitável aqui"). Escopo isolado desta pasta de propósito -- não mistura
com app/auth.py (senha compartilhada + cookie de sessão do Alpha), que é
um modelo de auth completamente diferente (usuário humano, não
serviço-a-serviço).
"""
import hmac
import os

from fastapi import Header, HTTPException


def _api_key() -> str:
    key = os.environ.get("PONTE_PRESENCA_API_KEY")
    if not key:
        raise RuntimeError("PONTE_PRESENCA_API_KEY não configurada no ambiente do serviço.")
    return key


async def exigir_chave(authorization: str = Header(default="")) -> None:
    esperado = _api_key()
    recebido = authorization.removeprefix("Bearer ").strip()
    if not recebido or not hmac.compare_digest(recebido, esperado):
        raise HTTPException(status_code=401, detail="chave de API inválida ou ausente")
