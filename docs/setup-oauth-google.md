# Configurar login com Google (OAuth) — Google Cloud Console + Supabase

Passo a passo pra habilitar o botão "continuar com o Google" em `/conta`
(`app/conta/ContaForm.tsx`). O código já está pronto — falta só essa
configuração externa, feita uma vez.

URL do projeto Supabase: `https://tysmqeyihbedurdxujjm.supabase.co`

## 1. Google Cloud Console

### 1.1 Criar o projeto (se ainda não existir)
1. Acesse https://console.cloud.google.com/
2. Crie um projeto novo (ou use um existente) — ex: "Presença".

### 1.2 Configurar a tela de consentimento OAuth
`APIs e serviços` → `Tela de permissão OAuth`:
1. **Tipo de usuário**: "Externo".
2. **Nome do app**: Presença.
3. **E-mail de suporte do usuário**: um e-mail seu.
4. **Logo do app** (opcional, mas recomendado — usa a mesma imagem do
   `manifest.ts`, `apps/presenca/public/icons/icon-512.png`).
5. **Domínio do app** → **Página inicial**: `https://presenca.app` (ou o
   domínio de produção real).
6. **Link da política de privacidade**: `https://presenca.app/privacidade`
   (já existe em `app/privacidade/page.tsx`).
7. **Domínios autorizados**: adicione o domínio raiz, ex: `presenca.app`.
8. **E-mail de contato do desenvolvedor**: seu e-mail.
9. **Escopos**: adicione só os não-sensíveis — `.../auth/userinfo.email`,
   `.../auth/userinfo.profile`, `openid`. Não peça nada além disso: com só
   esses escopos, o Google **não exige verificação manual** do app.
10. Salve e, quando terminar toda a configuração abaixo, clique em
    **"Publicar app"** (sai do modo "Testing" pra "Em produção" — sem isso,
    só até 100 contas de teste conseguem logar).

### 1.3 Verificar o domínio (evita o aviso "app não verificado")
Desde 2022 o Google exige que o domínio usado acima esteja verificado no
[Google Search Console](https://search.google.com/search-console). Se
`presenca.app` ainda não estiver verificado lá:
1. Adicione a propriedade do domínio no Search Console.
2. Verifique via o método de registro DNS (TXT record) — mais simples que
   upload de arquivo, já que provavelmente vocês controlam o DNS.
3. Depois de verificado, ele aparece disponível pra selecionar como "domínio
   autorizado" na tela de consentimento OAuth.

Sem esse passo o login ainda funciona, mas os usuários veem um aviso extra
("O Google não verificou este app") antes de continuar — não bloqueia, mas
assusta.

### 1.4 Criar as credenciais OAuth (Client ID)
`APIs e serviços` → `Credenciais` → `Criar credenciais` → `ID do cliente
OAuth`:
1. **Tipo de aplicativo**: "Aplicativo da Web".
2. **Nome**: "Presença — Supabase".
3. **Origens JavaScript autorizadas** — os domínios de onde o app roda (só
   protocolo + domínio, sem caminho):
   ```
   https://presenca.app
   http://localhost:3000
   ```
   (o `localhost` só é necessário se for testar OAuth localmente também.)
4. **URIs de redirecionamento autorizados** — **⚠️ atenção aqui, é o ponto
   que mais confunde**: NÃO é a URL do nosso app (`/auth/callback`). É a
   URL do próprio Supabase, que faz a troca do código OAuth antes de nos
   devolver o controle:
   ```
   https://tysmqeyihbedurdxujjm.supabase.co/auth/v1/callback
   ```
5. Salve e copie o **Client ID** e o **Client Secret** gerados — vão pro
   Supabase no próximo passo.

## 2. Painel do Supabase

Acesse o [dashboard do projeto](https://supabase.com/dashboard/project/tysmqeyihbedurdxujjm).

### 2.1 Habilitar o provider Google
`Authentication` → `Sign In / Providers` → `Google`:
1. Ative o toggle.
2. Cole o **Client ID** e o **Client Secret** do passo 1.4.
3. Salve.

### 2.2 Habilitar "Allow manual linking"
`Authentication` → `Settings` (ou `Sign In / Providers` → configurações
gerais, dependendo da versão do painel):
1. Ative **"Allow manual linking"**.

Sem esse toggle, o `linkIdentity()` que o código chama (`ContaForm.tsx`)
retorna erro em runtime mesmo com o Google configurado certo — é ele que
permite vincular uma identidade OAuth a uma sessão **anônima** já existente
(preservando o mesmo `auth.uid()`), em vez de criar uma conta nova.

### 2.3 Conferir a Redirect URL do projeto
`Authentication` → `URL Configuration`:
1. **Site URL**: `https://presenca.app` (produção) ou
   `http://localhost:3000` (dev).
2. **Redirect URLs**: adicione `https://presenca.app/auth/callback` (e,
   pra testar localmente, `http://localhost:3000/auth/callback`) — essa é
   a lista de URLs que o Supabase aceita como `redirectTo`/`emailRedirectTo`
   depois de processar o login (OAuth ou link mágico).

## 3. Testar

1. Acesse `/conta` logado como conta anônima.
2. Clique em "continuar com o Google".
3. Deve abrir a tela de consentimento do Google → escolher conta → voltar
   pro app já em `/home` (ou onde o `next` apontar), sessão convertida.
4. Confirme no dashboard do Supabase (`Authentication` → `Users`) que o
   mesmo usuário (mesmo UUID) agora tem uma identidade "google" vinculada,
   em vez de aparecer como um usuário novo.

## Nota sobre o link mágico

O mesmo `NEXT_PUBLIC_SITE_URL` (`.env.local`) e a mesma lista de "Redirect
URLs" acima (passo 2.3) também valem pro login por link mágico
(`enviarLinkMagico`, `signInWithOtp`) — os dois fluxos retornam pro mesmo
`/auth/callback`.
