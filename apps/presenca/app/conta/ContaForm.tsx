"use client";

import { useActionState, useState } from "react";

import { createClient } from "@presenca/supabase/browser";

import { converterConta } from "./actions";
import styles from "./page.module.css";

export function ContaForm({ next = "/home" }: { next?: string }) {
  const [state, action, pending] = useActionState(converterConta, {});
  const [erroOAuth, setErroOAuth] = useState<string | null>(null);
  const [carregandoOAuth, setCarregandoOAuth] = useState(false);

  async function continuarComGoogle() {
    setErroOAuth(null);
    setCarregandoOAuth(true);
    const supabase = createClient();
    // linkIdentity (não signInWithOAuth) preserva o auth.uid() da sessão
    // anônima atual — é a mesma pessoa ganhando uma credencial, não um
    // cadastro novo. Requer "Allow manual linking" habilitado no dashboard
    // do Supabase (Authentication > Settings).
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setErroOAuth(error.message);
      setCarregandoOAuth(false);
    }
    // Em sucesso, o browser já foi redirecionado pelo linkIdentity — nada
    // mais a fazer aqui.
  }

  return (
    <div>
      <form action={action}>
        <input type="hidden" name="next" value={next} />
        {state.erro && <p className={styles.erro}>{state.erro}</p>}
        <input
          className={styles.field}
          type="email"
          name="email"
          placeholder="seu e-mail"
          autoComplete="email"
          required
        />
        <input
          className={styles.field}
          type="password"
          name="senha"
          placeholder="uma senha (mín. 8 caracteres)"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <button className={styles.cta} type="submit" disabled={pending}>
          guardar meu espaço
        </button>
      </form>

      <p className={styles.separador}>ou</p>

      {erroOAuth && <p className={styles.erro}>{erroOAuth}</p>}
      <button
        className={styles.ctaSecundario}
        type="button"
        onClick={continuarComGoogle}
        disabled={carregandoOAuth}
      >
        continuar com o Google
      </button>
    </div>
  );
}
