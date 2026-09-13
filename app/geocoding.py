"""
geocoding.py

Autocomplete de cidade no /cadastro (local de nascimento -> latitude,
longitude, fuso horário automáticos). Dois serviços externos, papéis
diferentes:
  - Nominatim (OpenStreetMap, gratuito, sem chave) -- busca de texto ->
    lista de lugares candidatos com lat/lon. Único request de rede daqui.
  - timezonefinder (biblioteca Python, offline, sem API) -- deriva o
    fuso horário IANA a partir de lat/lon já obtidos do Nominatim. Evita
    uma segunda chamada de rede só para o fuso.

Política de uso do Nominatim (https://operations.osmfoundation.org/policies/nominatim/)
proíbe autocomplete "a cada tecla" sem throttling -- o debounce que
protege isso fica no client (cadastro.html, ~450ms parado + mínimo de 3
caracteres), não aqui; este módulo só formata o request com um
User-Agent identificável (exigido pela política) e não faz retry
agressivo.
"""
import httpx
import truststore
from timezonefinder import TimezoneFinder

# Usa o keychain/trust store nativo do SO em vez do bundle da certifi --
# mais robusto contra interceptação SSL de proxy corporativo (Netskope,
# ambiente de dev local) do que apontar pra um .pem exportado estático,
# que pode ficar incompleto/desatualizado. Idempotente, seguro em
# produção (Railway/Linux) onde não há interceptação nenhuma -- so passa
# a usar o trust store do container, que tem as CAs publicas normais.
truststore.inject_into_ssl()

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
# Identifica o uso pra política do Nominatim -- laboratório privado,
# volume baixo (4 participantes), não precisa de contato pessoal.
USER_AGENT = "presente-lab-privado/1.0 (uso interno, cadastro de participantes)"

_tf = TimezoneFinder()


def buscar_cidades(termo: str, limite: int = 5) -> list[dict]:
    """Retorna ate `limite` lugares candidatos pro texto digitado, cada
    um ja com fuso horario calculado. Lista vazia (sem excecao) pra termo
    curto demais ou se o Nominatim nao responder -- autocomplete e uma
    conveniencia, uma falha aqui nao pode travar o cadastro (o campo
    continua editavel manualmente, ver cadastro.html)."""
    termo = termo.strip()
    if len(termo) < 3:
        return []

    try:
        resposta = httpx.get(
            NOMINATIM_URL,
            params={"q": termo, "format": "jsonv2", "addressdetails": 1, "limit": limite},
            headers={"User-Agent": USER_AGENT},
            timeout=5.0,
        )
        resposta.raise_for_status()
        dados = resposta.json()
    except (httpx.HTTPError, ValueError):
        return []

    resultados = []
    for item in dados:
        try:
            lat, lon = float(item["lat"]), float(item["lon"])
        except (KeyError, TypeError, ValueError):
            continue
        fuso = _tf.timezone_at(lat=lat, lng=lon)
        resultados.append({
            "nome_exibicao": item.get("display_name", termo),
            "latitude": lat,
            "longitude": lon,
            "timezone": fuso,
        })
    return resultados
