# presente

Calendário Pessoal de Consciência — laboratório de 4 usuários. Ver `docs/` para PRD, plano de implementação e validação dos motores.

## Setup local

```bash
python3.13 -m venv .venv   # pyswisseph pode nao ter wheel para versoes de Python muito recentes
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env       # depois edite APP_PASSWORD e SESSION_SECRET
docker compose up -d       # Postgres local, porta 5433
python3 -m scripts.init_db
python3 -m scripts.run_pipeline_guilherme

uvicorn app.main:app --reload   # http://127.0.0.1:8000 -- pede a senha do .env
```

### Se `pip install` falhar com erro de certificado TLS

Em máquinas com agente de segurança corporativo (ex.: Netskope), variáveis de ambiente como `SSL_CERT_FILE`, `PIP_CERT` ou `REQUESTS_CA_BUNDLE` podem já estar setadas globalmente apontando para um bundle de certificado que não existe nesse caminho. Isso é configuração da máquina, não do projeto — não deve ser hardcoded no repositório.

Se acontecer, descubra o bundle de certificado válido da sua máquina (pergunte ao time de TI, ou procure por outra variável de ambiente já configurada, ex. `NETSKOPE_CERT`/`CURL_NETSKOPE_CERT`, que costuma apontar para o caminho correto) e rode a instalação sobrescrevendo temporariamente, ex.:

```bash
SSL_CERT_FILE=/caminho/valido/na/sua/maquina.pem pip install -r requirements.txt
```

## Variáveis de ambiente

Ver `.env.example` para a lista completa com comentários. Resumo:

| Variável | Local (dev) | Produção (Railway) |
|---|---|---|
| `DATABASE_URL` | Postgres do `docker-compose.yml` | injetada automaticamente pelo plugin Postgres do Railway |
| `APP_PASSWORD` | qualquer valor, definido por você no `.env` | defina em Railway → Variables |
| `SESSION_SECRET` | qualquer valor, definido por você no `.env` | defina em Railway → Variables (gere com `python3 -c "import secrets; print(secrets.token_hex(32))"`) |
| `OPENAI_API_KEY` | opcional — só necessária pra usar `GPT56SolClient` de verdade (A5, `app/alpha/modelo_gpt56sol.py`); sem ela o app sobe normalmente, só o Interpretation Engine real fica indisponível | defina em Railway → Variables quando a chave existir — **ainda não configurada nesta sessão, não testado contra a API real** |

Nenhuma credencial fica hardcoded no código — tudo lido de variável de ambiente via `app/config.py`. `DATABASE_URL` é normalizada automaticamente (aceita `postgres://`, `postgresql://` ou `postgresql+psycopg://`), então o mesmo código funciona sem alteração com Postgres local, Railway Postgres, ou um Supabase futuro.

## Banco de dados

Duas fases, sem acoplamento entre elas:
- **Desenvolvimento**: Postgres local via Docker (`docker-compose.yml`).
- **V1 publicada (Etapa 5)**: Postgres provisionado no mesmo projeto Railway do app — ver "Deploy no Railway" abaixo. Supabase continua uma possibilidade futura (ex.: se precisarmos de recursos gerenciados que o Postgres do Railway não oferece) — a troca é só mudar `DATABASE_URL`, sem mudança de schema nem de código.

## Deploy no Railway

Passos manuais (precisam da sua conta/projeto Railway — não posso fazer por você):

1. **Criar o projeto**: no dashboard do Railway, `New Project` → `Deploy from GitHub repo` (ou `Empty Project` se for subir por CLI) apontando para este repositório.
2. **Adicionar o Postgres**: dentro do projeto, `New` → `Database` → `Add PostgreSQL`. O Railway provisiona o banco e expõe `DATABASE_URL` como referência de variável (`${{Postgres.DATABASE_URL}}`).
3. **Configurar o serviço da aplicação** (o serviço apontando para este repo):
   - em `Variables`, adicione:
     - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (referencia o banco do passo 2 — use o seletor de referência do Railway, não copie o valor manualmente)
     - `APP_PASSWORD` = a senha compartilhada do laboratório
     - `SESSION_SECRET` = uma string aleatória longa (gere com o comando do `.env.example`)
   - o Railway detecta Python automaticamente (via `requirements.txt` + `.python-version`) e usa `railway.json` para o comando de start (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`) e o healthcheck (`/healthz`).
4. **Gerar o domínio público**: em `Settings` do serviço → `Networking` → `Generate Domain`. Isso dá a URL temporária `*.up.railway.app` — é essa que fica protegida por senha, sem precisar de Cloudflare/domínio próprio ainda.
5. **Rodar o schema no banco do Railway**: depois do primeiro deploy, com a `DATABASE_URL` do Railway disponível localmente (copie o valor real do painel do Postgres, não a referência), rode uma vez:
   ```bash
   DATABASE_URL="<url do Postgres do Railway>" python3 -m scripts.init_db
   ```
   (Alternativa: `railway run python3 -m scripts.init_db` usando a Railway CLI já logada, que injeta as variáveis do projeto automaticamente.)

Critério de aceite desta etapa: abrir a URL gerada sem sessão → pede senha; depois do login → mostra a página placeholder com "Banco de dados: conectado".

## Testes

```bash
python3 -m tests.test_golden_profile        # motores contra o Golden Profile de Guilherme
python3 -m tests.test_numerology_adapter    # NumerologyAdapter contra o mesmo Golden Profile
python3 -m tests.test_horizons_cache        # regras de cache/congelamento (Hoje 03:00, Semana seg-dom)
```
