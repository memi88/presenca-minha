"use client";

import { useActionState, useState } from "react";

import { preCadastrarPaciente } from "./actions";
import styles from "./page.module.css";

export function PreCadastroForm() {
  const [state, action, pending] = useActionState(preCadastrarPaciente, {});
  const [copiado, setCopiado] = useState(false);

  if (state.link) {
    return (
      <div className={styles.resultado}>
        <p className={styles.resultadoTexto}>
          Pré-cadastro de {state.nome} criado. Envie esse link pra ela/ele confirmar:
        </p>
        <p className={styles.link}>{state.link}</p>
        <button
          className={styles.cta}
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(state.link!);
            setCopiado(true);
          }}
        >
          {copiado ? "copiado ✓" : "copiar link"}
        </button>
        <a className={styles.voltar} href="/pacientes">
          ‹ voltar pra pacientes
        </a>
      </div>
    );
  }

  return (
    <form className={styles.form} action={action}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <input className={styles.field} type="text" name="nome" placeholder="nome do paciente" required />
      <textarea
        className={styles.field}
        name="caracteristicas"
        placeholder="características (privado, só você vê — nunca vai pra IA nem pro paciente)"
        rows={3}
      />
      <textarea
        className={styles.field}
        name="anotacoes"
        placeholder="anotações (privado, só você vê)"
        rows={3}
      />
      <button className={styles.cta} type="submit" disabled={pending}>
        gerar link
      </button>
    </form>
  );
}
