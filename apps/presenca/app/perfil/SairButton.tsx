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
          Sair
        </button>
      </form>
    );
  }

  if (!confirmando) {
    return (
      <button className={styles.sair} type="button" onClick={() => setConfirmando(true)}>
        Sair
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
        Criar minha conta antes →
      </a>
      <form action={sair}>
        <button className={styles.confirmarSair} type="submit">
          Sair mesmo assim
        </button>
      </form>
      <button className={styles.sair} type="button" onClick={() => setConfirmando(false)}>
        Voltar
      </button>
    </div>
  );
}
