"use client";

import { useActionState, useState } from "react";

import { TurnstileWidget } from "../TurnstileWidget";
import { cadastrar } from "./actions";
import styles from "./page.module.css";

export function CadastroForm() {
  const [state, action, pending] = useActionState(cadastrar, {});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [aceitou, setAceitou] = useState(false);

  return (
    <form action={action}>
      <input type="hidden" name="captchaToken" value={captchaToken ?? ""} />
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <input
        className={styles.input}
        type="text"
        name="nome"
        placeholder="seu nome ou apelido"
        autoComplete="given-name"
        required
      />
      <input
        className={styles.input}
        type="email"
        name="email"
        placeholder="e-mail (opcional)"
        autoComplete="email"
      />
      <input
        className={styles.input}
        type="password"
        name="senha"
        placeholder="senha, mín. 8 caracteres (opcional)"
        autoComplete="new-password"
        minLength={8}
      />
      <p className={styles.escape}>
        Pode deixar e-mail e senha em branco por enquanto — seu espaço já existe do mesmo jeito, só
        que sem como recuperar se você sair ou trocar de aparelho antes de preencher isso depois.
      </p>
      <TurnstileWidget onVerify={setCaptchaToken} />
      <button className={styles.cta} type="submit" disabled={pending || !aceitou}>
        começar
      </button>
      <label className={styles.consentimento}>
        <input type="checkbox" checked={aceitou} onChange={(e) => setAceitou(e.target.checked)} />
        <span className={styles.consentimentoTexto}>
          Li e concordo com a <a href="/privacidade">política de privacidade</a> e os{" "}
          <a href="/limites-de-cuidado">limites de cuidado</a>.
        </span>
      </label>
    </form>
  );
}
