// Service worker mínimo — existe só pra satisfazer o critério de
// instalabilidade de PWA do Chrome (beforeinstallprompt exige um service
// worker registrado com listener de fetch). Não faz cache nem intercepta
// nada: toda request segue pra rede normalmente, sem event.respondWith().
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});
