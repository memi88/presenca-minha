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
        placeholder="Seu nome ou apelido"
        autoComplete="given-name"
        required
      />
      <hr className={styles.divisor} />
      <p className={styles.opcionalLabel}>opcional para agora</p>
      <input
        className={styles.input}
        type="email"
        name="email"
        placeholder="E-mail (opcional)"
        autoComplete="email"
      />
      <input
        className={styles.input}
        type="password"
        name="senha"
        placeholder="Senha, mín. 8 caracteres (opcional)"
        autoComplete="new-password"
        minLength={8}
      />
      <p className={styles.escape}>
        Pode deixar e-mail e senha em branco por enquanto — seu espaço já existe do mesmo jeito, só
        que sem como recuperar se você sair ou trocar de aparelho antes de preencher isso depois.
      </p>
      <div className={styles.transparenciaCard}>
        <svg
          className={styles.transparenciaIcone}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 20c-4-1-7-4-7-9 0-3 2-6 6-7 5-1 9 2 9 7 0 5-4 9-8 9Z" />
          <path d="M11 20V9" />
        </svg>
        <div>
          <p className={styles.transparenciaTitulo}>Transparência e Cuidado</p>
          <p className={styles.transparenciaTexto}>
            Seus dados são um refúgio. Usamos essas informações apenas para personalizar sua
            experiência e manter suas anotações seguras. Nunca compartilhamos com terceiros sem seu
            consentimento explícito.
          </p>
        </div>
      </div>
      <label className={styles.consentimento}>
        <input type="checkbox" checked={aceitou} onChange={(e) => setAceitou(e.target.checked)} />
        <span className={styles.consentimentoTexto}>
          Li e concordo com a <a href="/privacidade">política de privacidade</a> e os{" "}
          <a href="/privacidade#limites-de-cuidado">limites de cuidado</a>.
        </span>
      </label>
      <TurnstileWidget onVerify={setCaptchaToken} />
      <button className={styles.cta} type="submit" disabled={pending || !aceitou}>
        Começar
      </button>
    </form>
  );
}
