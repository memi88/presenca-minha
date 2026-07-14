"use client";

import { usePathname } from "next/navigation";

import { CirculoRespirando } from "../CirculoRespirando";
import styles from "./MarketingHeader.module.css";

export function MarketingHeader() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <a className={styles.wordmark} href="/">
        <CirculoRespirando className={styles.dot} />
        presença
      </a>
      <nav className={styles.nav}>
        <a
          className={`${styles.navItem} ${pathname === "/para-voce" ? styles.navItemAtual : ""}`}
          href="/para-voce"
        >
          Para você
        </a>
        <a
          className={`${styles.navItem} ${pathname === "/para-terapeutas" ? styles.navItemAtual : ""}`}
          href="/para-terapeutas"
        >
          Para terapeutas
        </a>
        <a className={`${styles.navItem} ${pathname === "/sobre" ? styles.navItemAtual : ""}`} href="/sobre">
          Sobre
        </a>
        <a className={styles.entrar} href="/login">
          Entrar
        </a>
        <a className={styles.comecar} href="/bem-vindo">
          Começar
        </a>
      </nav>
    </header>
  );
}
