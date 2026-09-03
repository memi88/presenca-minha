"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AcessoBloqueado } from "./AcessoBloqueado";
import styles from "./AmbienteShell.module.css";

// Redesign visual reduz o escopo do escuro (docs/redesign/presenca-handoff-claude-code.md
// §2 e docs/redesign/presenca-redesign-sistema-visual-status.md §2): só
// Livro Vivo e Diário continuam "cômodos escuros". Práticas vira
// claro/híbrido — /folego não é mais rota própria (dobrada dentro de
// praticas/[id] como estado local, ver FolegoInline.tsx; a experiência
// continua escura por design, só que com cor fixa em vez de depender
// deste token).
const PREFIXOS_ESCUROS = ["/livro-vivo", "/diario"];

function ambienteDaRota(pathname: string): "claro" | "escuro" {
  const escuro = PREFIXOS_ESCUROS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return escuro ? "escuro" : "claro";
}

type Props = {
  children: React.ReactNode;
  // Vem do layout raiz (checagem server-side, ver lib/acessoMobile.ts).
  acessoLiberado: boolean;
};

export function AmbienteShell({ children, acessoLiberado }: Props) {
  const pathname = usePathname();
  const ambiente = ambienteDaRota(pathname);

  // Registra o service worker mínimo (public/sw.js) — sem ele, o Chrome
  // nunca dispara beforeinstallprompt (InstalarPWABanner.tsx fica sem
  // botão, só a instrução manual de iOS). Roda uma vez só: este componente
  // não desmonta entre navegações (só o pathname muda a key da div interna).
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // O bloqueio (docs/presenca-extensao-app-mobile.md §2) só existe dentro
  // do app empacotado — o site continua aberto normalmente pra quem acessa
  // pelo navegador. `isNativePlatform()` só é confiável depois de montado,
  // por isso começa "não bloqueado" e só muda depois do efeito (evita
  // divergência entre o HTML do servidor e a primeira renderização).
  const [bloqueado, setBloqueado] = useState(false);
  useEffect(() => {
    setBloqueado(Capacitor.isNativePlatform() && !acessoLiberado);
  }, [acessoLiberado]);

  return (
    <div className={styles.fundo}>
      <div data-ambiente={ambiente} key={pathname} className={styles.coluna}>
        {bloqueado ? <AcessoBloqueado /> : children}
      </div>
    </div>
  );
}
