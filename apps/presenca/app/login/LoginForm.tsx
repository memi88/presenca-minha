"use client";

import { useActionState, useState } from "react";

import { entrarComSenha, enviarLinkMagico, enviarLinkRecuperacao } from "./actions";
import styles from "./page.module.css";

export function LoginForm() {
  const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false);
  const [mostrarLinkMagico, setMostrarLinkMagico] = useState(false);
  const [loginState, loginAction, loginPending] = useActionState(entrarComSenha, {});
  const [recState, recAction, recPending] = useActionState(enviarLinkRecuperacao, {});
  const [magicoState, magicoAction, magicoPending] = useActionState(enviarLinkMagico, {});

  if (mostrarRecuperacao) {
    return (
      <div>
        {recState.recuperacaoEnviada ? (
          <p className={styles.confirmacao}>
            Se esse e-mail tiver uma conta aqui, mandamos um link pra você redefinir a senha.
          </p>
        ) : (
          <form action={recAction}>
            {recState.erro && <p className={styles.erro}>{recState.erro}</p>}
            <input
              className={styles.field}
              type="email"
              name="email"
              placeholder="seu e-mail"
              autoComplete="email"
              required
            />
            <button className={styles.cta} type="submit" disabled={recPending}>
              enviar link
            </button>
          </form>
        )}
        <button type="button" className={styles.esqueci} onClick={() => setMostrarRecuperacao(false)}>
          voltar pro login
        </button>
      </div>
    );
  }

  if (mostrarLinkMagico) {
    return (
      <div>
        {magicoState.linkMagicoEnviado ? (
          <p className={styles.confirmacao}>Mandamos um link de acesso pro seu e-mail.</p>
        ) : (
          <form action={magicoAction}>
            {magicoState.erro && <p className={styles.erro}>{magicoState.erro}</p>}
            <input
              className={styles.field}
              type="email"
              name="email"
              placeholder="seu e-mail"
              autoComplete="email"
              required
            />
            <button className={styles.cta} type="submit" disabled={magicoPending}>
              enviar link de acesso
            </button>
          </form>
        )}
        <button type="button" className={styles.esqueci} onClick={() => setMostrarLinkMagico(false)}>
          voltar pro login
        </button>
      </div>
    );
  }

  return (
    <form action={loginAction}>
      {loginState.erro && <p className={styles.erro}>{loginState.erro}</p>}
      <input
        className={styles.field}
        type="email"
        name="email"
        placeholder="e-mail"
        autoComplete="email"
        required
      />
      <input
        className={styles.field}
        type="password"
        name="senha"
        placeholder="senha"
        autoComplete="current-password"
        required
      />
      <button type="button" className={styles.esqueci} onClick={() => setMostrarRecuperacao(true)}>
        esqueci minha senha
      </button>
      <button type="button" className={styles.esqueci} onClick={() => setMostrarLinkMagico(true)}>
        entrar sem senha
      </button>
      <button className={styles.cta} type="submit" disabled={loginPending}>
        entrar
      </button>
    </form>
  );
}
