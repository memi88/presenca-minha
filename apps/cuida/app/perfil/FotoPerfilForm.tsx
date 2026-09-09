"use client";

import { useActionState, useRef } from "react";

import { atualizarFoto } from "./actions";
import styles from "./page.module.css";

export function FotoPerfilForm({ fotoUrl }: { fotoUrl: string | null }) {
  const [state, action, pending] = useActionState(atualizarFoto, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={action}
      className={styles.fotoForm}
      onChange={() => formRef.current?.requestSubmit()}
    >
      <div
        className={styles.fotoPreview}
        style={fotoUrl ? { backgroundImage: `url(${fotoUrl})` } : undefined}
        aria-hidden="true"
      />
      <label className={styles.fotoLabel}>
        {pending ? "enviando…" : "trocar foto"}
        <input className={styles.fotoInput} type="file" name="foto" accept="image/jpeg,image/png,image/webp" />
      </label>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
    </form>
  );
}
