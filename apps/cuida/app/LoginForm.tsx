"use client";

import { useActionState } from "react";

import { login } from "./actions";
import styles from "./page.module.css";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});

  return (
    <form className={styles.form} action={action}>
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
        placeholder="sua senha"
        autoComplete="current-password"
        required
      />
      <button className={styles.cta} type="submit" disabled={pending}>
        entrar
      </button>
    </form>
  );
}
