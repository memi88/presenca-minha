# Dockerfile explícito em vez de deixar o Railpack detectar automaticamente
# -- necessário porque pyswisseph (Design Humano) precisa de libsqlite3.so.0
# em runtime, e a imagem runtime enxuta do Railpack não a inclui por padrão
# (build passava normalmente; o import só falhava ao subir o container,
# porque nada tinha exercitado o import de swisseph em produção até a
# Etapa 8 -- Numerologia e Dreamspell não dependem dele).
FROM python:3.13-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libsqlite3-0 libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
