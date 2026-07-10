"use client";

import { useActionState } from "react";

import { converterConta } from "./actions";
import styles from "./page.module.css";

export function ContaForm() {
  const [state, action, pending] = useActionState(converterConta, {});

  return (
    <form action={action}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <input
        className={styles.field}
        type="email"
        name="email"
        placeholder="seu e-mail"
        autoComplete="email"
        required
      />
      <input
        className={styles.field}
        type="password"
        name="senha"
        placeholder="uma senha (mín. 8 caracteres)"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <button className={styles.cta} type="submit" disabled={pending}>
        guardar meu espaço
      </button>
    </form>
  );
}
