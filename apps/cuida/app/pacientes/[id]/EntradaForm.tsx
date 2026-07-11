"use client";

import { useActionState, useEffect, useRef } from "react";

import { escreverEntrada } from "./actions";
import styles from "./page.module.css";

export function EntradaForm({ pacienteId }: { pacienteId: string }) {
  const [state, action, pending] = useActionState(escreverEntrada.bind(null, pacienteId), {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.sucesso) formRef.current?.reset();
  }, [state]);

  return (
    <form className={styles.form} action={action} ref={formRef}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      {state.sucesso && <p className={styles.confirmacao}>Enviado.</p>}
      <select className={styles.select} name="tipo" defaultValue="pergunta">
        <option value="pergunta">pergunta</option>
        <option value="pratica_indicada">prática indicada</option>
        <option value="pagina_indicada">página indicada</option>
        <option value="reflexao">reflexão</option>
        <option value="simbolo">símbolo</option>
      </select>
      <textarea
        className={styles.textarea}
        name="conteudo"
        placeholder="escreva aqui..."
        rows={4}
        required
      />
      <button className={styles.cta} type="submit" disabled={pending}>
        enviar pro diário
      </button>
    </form>
  );
}
