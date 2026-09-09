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

// /diario/pergunta é claro por decisão do mockup (docs/redesign/
// pergunta_do_terapeuta) — tela focada e independente, herdava o escuro
// só por começar com "/diario". Exceção explícita, não some do prefixo
// pai porque o resto do Diário continua escuro.
const EXCECOES_CLARAS = ["/diario/pergunta"];

function ambienteDaRota(pathname: string): "claro" | "escuro" {
  if (EXCECOES_CLARAS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return "claro";
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

  // O bloqueio (docs/presenca-extensao-app-mobile.md §2) só existe dentro
  // do app empacotado — o site continua aberto normalmente pra quem acessa
  // pelo navegador. `isNativePlatform()` só é confiável depois de montado,
  // por isso começa "não bloqueado" e só muda depois do efeito (evita
  // divergência entre o HTML do servidor e a primeira renderização).
  const [bloqueado, setBloqueado] = useState(false);
  useEffect(() => {
    setBloqueado(Capacitor.isNativePlatform() && !acessoLiberado);
  }, [acessoLiberado]);

  // `--bg` só é redefinido dentro do escopo `[data-ambiente="escuro"]`
  // (globals.css) — variável CSS cascateia pai→filho, então setar o
  // atributo só em `.coluna` (abaixo) nunca alcança `body`/`.fundo`
  // (ancestrais). Isso deixava o body sempre claro no overscroll/bounce
  // do iOS, mesmo em rotas escuras (achado testando no celular real).
  // Espelhar o atributo no body de verdade resolve `var(--bg)` certo
  // também pra esse fallback.
  useEffect(() => {
    document.body.dataset.ambiente = ambiente;
  }, [ambiente]);

  return (
    <div className={styles.fundo}>
      <div data-ambiente={ambiente} key={pathname} className={styles.coluna}>
        {bloqueado ? <AcessoBloqueado /> : children}
      </div>
    </div>
  );
}
