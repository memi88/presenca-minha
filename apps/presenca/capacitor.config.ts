import type { CapacitorConfig } from "@capacitor/cli";

// Modo remoto de propósito: o Presença é SSR no Cloudflare Workers (via
// OpenNext), não dá pra fazer export estático. O WebView carrega o site de
// produção direto — o app nativo é a casca (ícone, splash, push), não uma
// cópia offline do conteúdo.
//
// `url` fica só a origem (sem path) de propósito — é ela que o Capacitor
// usa pra decidir se uma navegação é "do app" ou "externa" (compara por
// prefixo de string). Com path incluído, qualquer outra rota do mesmo
// domínio (ex: /login) deixava de bater no prefixo e abria no Safari por
// engano. `server.appStartPath` resolveria isso em teoria, mas exige que o
// mesmo caminho exista dentro de `webDir` local — quebra em modo remoto
// puro (erro "must exist as a resource directory" ao abrir).
//
// Em vez disso: a entrada em /bem-vindo (não "/", que é a home de
// marketing — só-web, ver docs/presenca-extensao-app-mobile.md §4.1)
// acontece via `appendUserAgent` — o site detecta esse marcador no
// user-agent e redireciona "/" pra "/bem-vindo" sozinho quando não há
// sessão (ver app/(marketing)/page.tsx).
const config: CapacitorConfig = {
  appId: "app.presenca.mobile",
  appName: "Presença",
  webDir: "public",
  appendUserAgent: "PresencaApp",
  server: {
    url: "https://presenca.app",
    cleartext: false,
  },
};

export default config;
