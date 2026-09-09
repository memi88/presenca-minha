"use client";

import { useActionState } from "react";

import { atualizarDescricao } from "./actions";
import styles from "./page.module.css";

export function DescricaoForm({ descricaoInicial }: { descricaoInicial: string | null }) {
  const [state, action, pending] = useActionState(atualizarDescricao, {});

  return (
    <form action={action} className={styles.descricaoForm}>
      <label className={styles.descricaoLabel} htmlFor="descricao">
        Sobre você
      </label>
      <p className={styles.descricaoAjuda}>Aparece na sua Página do Autor, pra quem lê o que você publica.</p>
      <textarea
        id="descricao"
        className={styles.field}
        name="descricao"
        rows={4}
        defaultValue={descricaoInicial ?? ""}
        placeholder="Como você trabalha, o que te move..."
      />
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      {state.sucesso && <p className={styles.confirmacao}>Descrição atualizada.</p>}
      <button className={styles.cta} type="submit" disabled={pending}>
        {pending ? "salvando…" : "salvar descrição"}
      </button>
    </form>
  );
}
