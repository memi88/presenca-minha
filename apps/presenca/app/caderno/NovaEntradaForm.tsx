"use client";

import { useActionState, useRef } from "react";

import { criarEntrada } from "./actions";
import styles from "./page.module.css";

export function NovaEntradaForm() {
  const [state, action, pending] = useActionState(criarEntrada, {});
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    await action(formData);
    formRef.current?.reset();
  }

  return (
    <form className={styles.form} action={handleAction} ref={formRef}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <textarea
        className={styles.textarea}
        name="conteudo"
        placeholder="o que você quer guardar hoje…"
        required
      />
      <div>
        <button className={styles.cta} type="submit" disabled={pending}>
          guardar
        </button>
      </div>
    </form>
  );
}
