FROM python:3.13-slim

WORKDIR /app

# pyswisseph não tem wheel pré-compilada pra essa combinação de plataforma/
# Python — pip precisa compilar a extensão C na hora do build. `gcc` sozinho
# não bastou (faltavam os headers da libc, ex. math.h) — build-essential
# garante gcc + libc6-dev + make juntos, sem depender de resolução implícita
# de dependências do apt.
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# CPU-only wheel do torch — o build padrão do PyPI inclui suporte CUDA que
# não serve pra nada em Render/Railway (sem GPU) e infla a imagem em vários
# GB à toa.
COPY requirements.txt .
RUN pip install --no-cache-dir \
      --extra-index-url https://download.pytorch.org/whl/cpu \
      -r requirements.txt

COPY app ./app

# Baixa e cacheia o modelo na imagem, não no primeiro request — evita um
# cold start lento (ou um health check falhando) na primeira chamada real
# depois do deploy.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('intfloat/multilingual-e5-small')"

ENV HF_HUB_OFFLINE=1

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
