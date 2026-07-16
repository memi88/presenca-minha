"use client";

import { useState } from "react";

import { sair } from "./actions";
import styles from "./page.module.css";

export function SairButton({ anonimo }: { anonimo: boolean }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!anonimo) {
    return (
      <form action={sair}>
        <button className={styles.sair} type="submit">
          sair
        </button>
      </form>
    );
  }

  if (!confirmando) {
    return (
      <button className={styles.sair} type="button" onClick={() => setConfirmando(true)}>
        sair
      </button>
    );
  }

  return (
    <div className={styles.avisoSair}>
      <p className={styles.avisoSairTexto}>
        Você ainda não guardou seu espaço com e-mail e senha — se sair agora, não tem como voltar a
        acessar esse Diário depois.
      </p>
      <a className={styles.link} href="/conta">
        criar minha conta antes →
      </a>
      <form action={sair}>
        <button className={styles.confirmarSair} type="submit">
          sair mesmo assim
        </button>
      </form>
      <button className={styles.sair} type="button" onClick={() => setConfirmando(false)}>
        voltar
      </button>
    </div>
  );
}
