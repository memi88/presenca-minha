"use client";

import { useActionState } from "react";

import { atualizarSenha } from "./actions";
import styles from "./page.module.css";

export function PerfilForm() {
  const [state, action, pending] = useActionState(atualizarSenha, {});

  return (
    <form action={action}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      {state.sucesso && <p className={styles.confirmacao}>Senha atualizada.</p>}
      <input
        className={styles.field}
        type="password"
        name="senha"
        placeholder="nova senha (mín. 8 caracteres)"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <input
        className={styles.field}
        type="password"
        name="confirmar"
        placeholder="confirmar nova senha"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <button className={styles.cta} type="submit" disabled={pending}>
        salvar nova senha
      </button>
    </form>
  );
}
