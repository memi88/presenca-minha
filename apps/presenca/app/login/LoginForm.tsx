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
            <div className={styles.campo}>
              <label className={styles.rotulo} htmlFor="email-recuperacao">
                E-mail
              </label>
              <input
                className={styles.field}
                id="email-recuperacao"
                type="email"
                name="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
            </div>
            <button className={styles.cta} type="submit" disabled={recPending}>
              Enviar link
            </button>
          </form>
        )}
        <button type="button" className={styles.esqueci} onClick={() => setMostrarRecuperacao(false)}>
          Voltar pro login
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
            <div className={styles.campo}>
              <label className={styles.rotulo} htmlFor="email-magico">
                E-mail
              </label>
              <input
                className={styles.field}
                id="email-magico"
                type="email"
                name="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
            </div>
            <button className={styles.cta} type="submit" disabled={magicoPending}>
              Enviar link de acesso
            </button>
          </form>
        )}
        <button type="button" className={styles.esqueci} onClick={() => setMostrarLinkMagico(false)}>
          Voltar pro login
        </button>
      </div>
    );
  }

  return (
    <form action={loginAction}>
      {loginState.erro && <p className={styles.erro}>{loginState.erro}</p>}
      <div className={styles.campo}>
        <label className={styles.rotulo} htmlFor="email-login">
          E-mail
        </label>
        <input
          className={styles.field}
          id="email-login"
          type="email"
          name="email"
          placeholder="seu@email.com"
          autoComplete="email"
          required
        />
      </div>
      <div className={styles.campo}>
        <label className={styles.rotulo} htmlFor="senha-login">
          Senha
        </label>
        <input
          className={styles.field}
          id="senha-login"
          type="password"
          name="senha"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>
      <button className={styles.cta} type="submit" disabled={loginPending}>
        Entrar
      </button>
      <button type="button" className={styles.ctaSecundario} onClick={() => setMostrarLinkMagico(true)}>
        Entrar sem senha
      </button>
      <button type="button" className={styles.esqueci} onClick={() => setMostrarRecuperacao(true)}>
        Esqueci minha senha
      </button>
    </form>
  );
}
