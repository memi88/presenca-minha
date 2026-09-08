"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { criarEntrada } from "../actions";
import styles from "./page.module.css";

// Mesma action do Diário normal (criarEntrada) — a resposta é só mais uma
// entrada, sem vínculo estruturado com a pergunta. Só o pós-envio muda:
// aqui redireciona pro Diário completo em vez de ficar na mesma tela.
export function RespostaForm() {
  const [state, action, pending] = useActionState(criarEntrada, {});
  const [enviado, setEnviado] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (enviado && !pending && !state.erro) {
      router.push("/diario");
    }
  }, [enviado, pending, state.erro, router]);

  return (
    <form className={styles.form} action={action} onSubmit={() => setEnviado(true)}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <textarea
        className={styles.textarea}
        name="conteudo"
        placeholder="Responda com calma, sem pressa..."
        rows={6}
        required
      />
      <button className={styles.cta} type="submit" disabled={pending}>
        Responder no diário
      </button>
    </form>
  );
}
