"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
    __turnstileScriptPromise?: Promise<void>;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

// Garante que o script do Turnstile só é injetado uma vez, mesmo com o
// Strict Mode do React (dev) montando o componente duas vezes de propósito
// — sem isso, dois <script> concorrentes podiam acabar renderizando dois
// widgets no mesmo container, e o callback que o botão "entrar" escuta
// ficava preso numa instância desatualizada (o token nunca chegava).
function carregarScriptTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (window.__turnstileScriptPromise) return window.__turnstileScriptPromise;

  window.__turnstileScriptPromise = new Promise((resolve, reject) => {
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existente) {
      existente.addEventListener("load", () => resolve());
      existente.addEventListener("error", () => reject(new Error("falha ao carregar o script do Turnstile")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("falha ao carregar o script do Turnstile"));
    document.head.appendChild(script);
  });
  return window.__turnstileScriptPromise;
}

/**
 * Widget oficial do Cloudflare Turnstile, carregado direto do script deles
 * (sem wrapper de terceiros) — recomendação de segurança do Supabase pro
 * login anônimo. Só renderiza se NEXT_PUBLIC_TURNSTILE_SITE_KEY existir;
 * sem a chave, o chamador deve tratar como "captcha não configurado" (uso
 * local/dev, sem bloquear o fluxo).
 */
export function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let cancelado = false;

    carregarScriptTurnstile()
      .then(() => {
        if (cancelado || !ref.current || !window.turnstile) return;
        // Defesa extra contra dupla montagem: se já existe um widget vivo
        // (iframe) dentro do container, não renderiza outro por cima.
        if (ref.current.childElementCount > 0) return;
        widgetIdRef.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: onVerify,
          // "interaction-only": fica invisível na maioria das vezes, só
          // aparece se o Cloudflare realmente precisar de um desafio
          // interativo — em vez do quadro sempre visível (appearance
          // "always", o padrão), que ficava deslocado na tela de bem-vindo.
          appearance: "interaction-only",
        });
      })
      .catch((erro) => console.error("Turnstile:", erro));

    return () => {
      cancelado = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;

  return <div ref={ref} />;
}
