"use client";

import { useActionState } from "react";

import { cadastrar } from "./actions";
import styles from "./page.module.css";

export function CadastroForm() {
  const [state, action, pending] = useActionState(cadastrar, {});

  return (
    <form className={styles.form} action={action}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <input className={styles.field} type="text" name="nome" placeholder="seu nome" required />
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
        placeholder="senha (mín. 8 caracteres)"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <button className={styles.cta} type="submit" disabled={pending}>
        criar conta
      </button>
    </form>
  );
}
