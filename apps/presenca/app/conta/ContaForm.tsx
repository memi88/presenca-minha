"use client";

import { useActionState, useState } from "react";

import { authClient } from "@presenca/db/client";

import { converterConta } from "./actions";
import styles from "./page.module.css";

export function ContaForm({ next = "/home" }: { next?: string }) {
  const [state, action, pending] = useActionState(converterConta, {});
  const [erroOAuth, setErroOAuth] = useState<string | null>(null);
  const [carregandoOAuth, setCarregandoOAuth] = useState(false);

  async function continuarComGoogle() {
    setErroOAuth(null);
    setCarregandoOAuth(true);
    // `signIn.social` normal (não um "linkSocial" separado): o plugin
    // `anonymous` já detecta sozinho, no callback do OAuth, que a sessão
    // atual (pelo cookie) é anônima e aciona o mesmo `onLinkAccount` —
    // repassa profiles/profissionais pro id novo em vez de criar um
    // cadastro do zero. Ver packages/db/src/auth.ts.
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: next });
    if (error) {
      setErroOAuth(error.message ?? "Não foi possível continuar com o Google agora.");
      setCarregandoOAuth(false);
    }
    // Em sucesso, o browser já foi redirecionado — nada mais a fazer aqui.
  }

  return (
    <div className={styles.card}>
      {erroOAuth && <p className={styles.erro}>{erroOAuth}</p>}
      <button
        className={styles.ctaGoogle}
        type="button"
        onClick={continuarComGoogle}
        disabled={carregandoOAuth}
      >
        <svg className={styles.ctaGoogleIcone} viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5C29.7 34.7 27 35.7 24 35.7c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.5 5.5C40.9 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"
          />
        </svg>
        Continuar com o Google
      </button>

      <p className={styles.separador}>ou</p>

      <form action={action}>
        <input type="hidden" name="next" value={next} />
        {state.erro && <p className={styles.erro}>{state.erro}</p>}
        <input
          className={styles.field}
          type="email"
          name="email"
          placeholder="Seu e-mail"
          autoComplete="email"
          required
        />
        <input
          className={styles.field}
          type="password"
          name="senha"
          placeholder="Uma senha (mín. 8 caracteres)"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <button className={styles.cta} type="submit" disabled={pending}>
          Guardar meu espaço
        </button>
      </form>
    </div>
  );
}
