"use client";

import { useActionState } from "react";

import { propor } from "./actions";
import styles from "./page.module.css";

export function PropostaForm() {
  const [state, action, pending] = useActionState(propor, {});

  if (state.sucesso) {
    return (
      <div className={styles.resultado}>
        <p className={styles.resultadoTexto}>
          Proposta enviada. Fica pendente até um admin aprovar — você não vê ela publicada ainda.
        </p>
        <a className={styles.voltar} href="/pacientes">
          ‹ voltar pra pacientes
        </a>
      </div>
    );
  }

  return (
    <form className={styles.form} action={action}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <select className={styles.field} name="tipo" defaultValue="" required>
        <option value="" disabled>
          tipo de conteúdo
        </option>
        <option value="pagina_livro_vivo">página do Livro Vivo</option>
        <option value="pratica">prática</option>
      </select>
      <input className={styles.field} type="text" name="titulo" placeholder="título" required />
      <textarea className={styles.field} name="conteudo" placeholder="conteúdo" rows={8} required />
      <select className={styles.field} name="escopo" defaultValue="publico" required>
        <option value="publico">público — qualquer pessoa no app pode ler</option>
        <option value="privado_profissional">só meus pacientes conectados</option>
      </select>
      <button className={styles.cta} type="submit" disabled={pending}>
        enviar pra aprovação
      </button>
    </form>
  );
}
