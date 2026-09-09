"use client";

import { useState, useTransition } from "react";

import styles from "./page.module.css";

type Props = {
  desconectar: () => Promise<void>;
};

// Ação difícil de reverter (precisa de um novo código de convite pra
// reconectar) — confirmação inline em vez de agir no primeiro clique.
// Nunca um confirm()/alert() nativo do navegador, que trava a
// experiência sem combinar com o resto do app.
export function DesconectarBotao({ desconectar }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirmando) {
    return (
      <div className={styles.desconectarConfirmacao}>
        <p className={styles.desconectarPergunta}>
          Desconectar de verdade? Você vai precisar de um novo código de convite pra reconectar.
        </p>
        <div className={styles.desconectarAcoes}>
          <button
            type="button"
            className={styles.desconectarConfirmar}
            disabled={isPending}
            onClick={() => startTransition(desconectar)}
          >
            Sim, desconectar
          </button>
          <button
            type="button"
            className={styles.desconectarCancelar}
            disabled={isPending}
            onClick={() => setConfirmando(false)}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button type="button" className={styles.desconectar} onClick={() => setConfirmando(true)}>
      Desconectar
    </button>
  );
}
