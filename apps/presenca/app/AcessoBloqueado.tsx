"use client";

import { Browser } from "@capacitor/browser";

import styles from "./AcessoBloqueado.module.css";

const URL_PLANOS = "https://presenca.app/para-voce#planos";

// Só aparece dentro do app empacotado (ver AmbienteShell.tsx), pra contas
// sem acesso liberado. Nunca menciona preço nem tem botão de pagamento —
// abre o navegador do sistema, nunca o WebView do app
// (docs/presenca-extensao-app-mobile.md §2).
export function AcessoBloqueado() {
  return (
    <div className={styles.scene}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>seu espaço está pausado</p>
        <h1 className={styles.headline}>Para continuar, é só sustentar o espaço no site.</h1>
        <p className={styles.texto}>
          O Presença acontece aqui no app, mas assinar acontece no site — de forma simples e
          transparente.
        </p>
        <button className={styles.cta} onClick={() => Browser.open({ url: URL_PLANOS })} type="button">
          Abrir no navegador
        </button>
      </div>
    </div>
  );
}
