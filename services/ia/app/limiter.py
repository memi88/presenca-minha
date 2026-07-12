from slowapi import Limiter
from slowapi.util import get_remote_address

# Limite por IP, não por chave de API — a chave é compartilhada entre os dois
# apps (Presença e Cuida), então limitar por chave puniria todo mundo junto
# se um app tivesse um bug de loop. Limite pensado pra uso normal (salvar uma
# entrada por vez) e ainda assim barrar um loop de retry descontrolado.
limiter = Limiter(key_func=get_remote_address)
