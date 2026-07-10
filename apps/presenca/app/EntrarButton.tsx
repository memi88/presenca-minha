"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@presenca/supabase/browser";

import { TurnstileWidget } from "./TurnstileWidget";
import styles from "./page.module.css";

/**
 * Toque em "entrar" já abre uma sessão anônima do Supabase Auth — sem
 * formulário, sem e-mail/senha. Bate com a tela 02·Chegada, que só pede um
 * apelido. O widget do Turnstile roda em paralelo (se a site key estiver
 * configurada) e manda o token junto quando pronto — mas quem decide se o
 * captcha é obrigatório é o Supabase (Authentication > Attack Protection),
 * não este botão. Bloquear o clique esperando o widget terminar, mesmo com
 * a exigência desligada no Supabase, deixava a entrada travada à toa.
 */
export function EntrarButton() {
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously(
      captchaToken ? { options: { captchaToken } } : undefined,
    );
    if (error) {
      setLoading(false);
      setCaptchaToken(null);
      setErro(error.message);
      console.error(error);
      return;
    }
    router.push("/chegada");
  }

  return (
    <div>
      <TurnstileWidget onVerify={setCaptchaToken} />
      {erro && <p className={styles.erro}>{erro}</p>}
      <button className={styles.cta} onClick={handleClick} disabled={loading}>
        entrar
      </button>
    </div>
  );
}
