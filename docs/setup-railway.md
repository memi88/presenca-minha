# Configurar/redeployar `services/ia` no Railway

Passo a passo pra subir (ou redeployar) o microsserviço de IA — embeddings do
Diário (`/embed`) e cálculo de Human Design (`/human-design`). O serviço já
tem `Dockerfile` pronto (`services/ia/Dockerfile`), então o Railway builda
direto sem configuração extra de build.

## Quando redeployar (não só na primeira vez)

`requirements.txt` ganhou dependências novas nesta rodada — `pyswisseph`,
`geopy`, `timezonefinder`, `pytz` (pro cálculo de Human Design). Se o serviço
já estava rodando no Railway antes dessas mudanças, **é obrigatório
redeployar** — sem isso, `/human-design` vai falhar (import error) mesmo com
o código do Next.js certo, porque a imagem antiga não tem essas libs.

## 1. Criar/conectar o serviço

Se o projeto no Railway ainda não existe:
1. https://railway.app/ → `New Project` → `Deploy from GitHub repo`.
2. Selecione o repositório `presenca-minha`.
3. **Root Directory**: `services/ia` (o monorepo tem `apps/`, `packages/` e
   `services/` — sem isso o Railway tenta buildar da raiz errada).
4. O Railway detecta o `Dockerfile` automaticamente e builda com ele — não
   precisa configurar build/start command manualmente (já está no
   `CMD` do Dockerfile: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`).

Se o serviço já existe e é só redeploy: `Deployments` → `Redeploy` (ou
simplesmente um novo push na branch conectada já dispara automaticamente,
se o auto-deploy estiver ligado nas configurações do serviço).

## 2. Variável de ambiente

`Settings` → `Variables`:
```
IA_API_KEY=<mesma chave usada em apps/presenca/.env.local como IA_SERVICE_API_KEY>
```
Essa é uma chave de serviço-a-serviço (não é `service_role` do Supabase nem
senha de banco) — autentica as chamadas do Next.js pro microsserviço via
header `Authorization: Bearer <chave>` (`exigir_chave`, usado nas duas rotas
`/embed` e `/human-design`). Se for gerar uma nova:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```
O mesmo valor precisa estar configurado nos dois lados: aqui no Railway e em
`IA_SERVICE_API_KEY` no ambiente do Next.js (Cloudflare Workers — variável
de produção, não só `.env.local`).

Não precisa configurar `PORT` manualmente — o Railway injeta essa variável
sozinho e o `Dockerfile` já lê `${PORT:-8000}`.

## 3. Depois do deploy: pegar a URL pública e configurar no Next.js

1. No Railway, `Settings` → `Networking` → `Generate Domain` (se ainda não
   tiver uma) — gera algo como `https://presenca-ia-production.up.railway.app`.
2. Essa URL vai em `IA_SERVICE_URL` no ambiente do Next.js (produção,
   Cloudflare Workers), **sem barra no final** — é o valor lido em
   `apps/presenca/lib/humanDesign.ts` e `apps/presenca/lib/embed.ts`.

## 4. Verificar que o deploy funcionou

```bash
curl https://<sua-url-do-railway>/health
```
Deve responder `200`. Esse endpoint não exige `Authorization` (é só
liveness check, sem dependência de nenhuma chave) — se ele já responde mas
`/embed` ou `/human-design` falham, o problema é a variável `IA_API_KEY`
(ausente, ou diferente da configurada no Next.js), não o build em si.

Teste autenticado do endpoint novo (Human Design), pra confirmar que as
libs novas (`pyswisseph`/`geopy`/`timezonefinder`) subiram certo:
```bash
curl -X POST https://<sua-url-do-railway>/human-design \
  -H "Authorization: Bearer <IA_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"data_nascimento": "1990-05-15", "hora_nascimento": "14:30", "local_nascimento": "São Paulo, SP", "latitude": null, "longitude": null}'
```
Uma resposta com o gráfico calculado (não um 500) confirma que o build
pegou as dependências novas.

## Nota sobre custo/cold start

O `Dockerfile` já baixa e cacheia o modelo de embedding (`multilingual-e5-small`)
**durante o build**, não no primeiro request — isso evita que o primeiro
health check do Railway falhe por timeout enquanto baixa o modelo. Não é
preciso nenhuma configuração extra de healthcheck além da padrão do Railway
(`/health`, já default no `Dockerfile`/serviço).
