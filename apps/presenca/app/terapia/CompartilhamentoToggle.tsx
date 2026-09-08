"use client";

import { useState, useTransition } from "react";

import styles from "./page.module.css";

type Props = {
  label: string;
  valorInicial: boolean;
  aoMudar: (valor: boolean) => Promise<void>;
};

// Switch simples (sem lib) — cada toggle chama a própria server action
// (definir_compartilhar_praticas/definir_compartilhar_livro_vivo em
// actions.ts, RPC de verdade, ver migration). Otimista no clique: muda
// visualmente antes do round-trip terminar, mesmo padrão de
// MoodTrigger/FechamentoTrigger.
export function CompartilhamentoToggle({ label, valorInicial, aoMudar }: Props) {
  const [ligado, setLigado] = useState(valorInicial);
  const [, startTransition] = useTransition();

  function alternar() {
    const novoValor = !ligado;
    setLigado(novoValor);
    startTransition(async () => {
      await aoMudar(novoValor);
    });
  }

  return (
    <div className={styles.toggleLinha}>
      <span className={styles.toggleRotulo}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-label={label}
        className={`${styles.toggle} ${ligado ? styles.toggleLigado : ""}`}
        onClick={alternar}
      >
        <span className={styles.toggleBolinha} />
      </button>
    </div>
  );
}
