"use client";

import { usePathname } from "next/navigation";

import styles from "./AmbienteShell.module.css";

// Mapeamento fixo por tela (PRD seção 6) — Livro Vivo, Meditação (+ Fôlego,
// sua prática interativa) e Diário são os "cômodos escuros".
const PREFIXOS_ESCUROS = ["/livro-vivo", "/meditacao", "/folego", "/diario"];

function ambienteDaRota(pathname: string): "claro" | "escuro" {
  const escuro = PREFIXOS_ESCUROS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return escuro ? "escuro" : "claro";
}

export function AmbienteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ambiente = ambienteDaRota(pathname);

  return (
    <div className={styles.fundo}>
      <div data-ambiente={ambiente} key={pathname} className={styles.coluna}>
        {children}
      </div>
    </div>
  );
}
