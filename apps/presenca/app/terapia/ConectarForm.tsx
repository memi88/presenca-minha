"use client";

import { useActionState, useState } from "react";

import { conectarProfissional } from "./actions";
import styles from "./page.module.css";

export function ConectarForm() {
  const [state, action, pending] = useActionState(conectarProfissional, {});
  const [aceitou, setAceitou] = useState(false);

  return (
    <form action={action}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <input
        className={styles.field}
        type="text"
        name="codigo"
        placeholder="código do profissional"
        autoComplete="off"
        required
      />
      <label className={styles.consentimento}>
        <input type="checkbox" checked={aceitou} onChange={(e) => setAceitou(e.target.checked)} />
        <span className={styles.consentimentoTexto}>
          Concordo que meu profissional possa escrever no meu Diário.
        </span>
      </label>
      <button className={styles.cta} type="submit" disabled={pending || !aceitou}>
        conectar
      </button>
    </form>
  );
}
