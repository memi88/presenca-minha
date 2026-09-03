"use client";

import { useActionState, useState } from "react";

import { confirmarConvite } from "./actions";
import styles from "./page.module.css";

export function ConfirmarConviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(confirmarConvite, {});
  const [aceitou, setAceitou] = useState(false);

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <input
        className={styles.input}
        type="email"
        name="email"
        placeholder="seu e-mail"
        autoComplete="email"
        required
      />
      <input
        className={styles.input}
        type="password"
        name="senha"
        placeholder="crie uma senha (mín. 8 caracteres)"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <button className={styles.cta} type="submit" disabled={pending || !aceitou}>
        sim, sou eu — criar conta
      </button>
      <label className={styles.consentimento}>
        <input type="checkbox" checked={aceitou} onChange={(e) => setAceitou(e.target.checked)} />
        <span className={styles.consentimentoTexto}>
          Li e concordo com a <a href="/privacidade">política de privacidade</a> e os{" "}
          <a href="/privacidade#limites-de-cuidado">limites de cuidado</a>.
        </span>
      </label>
    </form>
  );
}
