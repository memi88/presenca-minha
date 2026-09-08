"use client";

import { useActionState } from "react";

import { escreverDevolutiva } from "./actions";
import styles from "./page.module.css";

export function DevolutivaForm({ instanciaId }: { instanciaId: string }) {
  const acaoComId = escreverDevolutiva.bind(null, instanciaId);
  const [state, action, pending] = useActionState(acaoComId, {});

  return (
    <form action={action} className={styles.devolutivaForm}>
      <p className={styles.devolutivaTitulo}>Última etapa — escreva a devolutiva</p>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <textarea className={styles.field} name="conteudo" rows={6} placeholder="Sua devolutiva pessoal…" required />
      <button className={styles.cta} type="submit" disabled={pending}>
        {pending ? "enviando…" : "Enviar devolutiva e concluir"}
      </button>
    </form>
  );
}
