"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@presenca/supabase/browser";

import { TurnstileWidget } from "./TurnstileWidget";
import styles from "./page.module.css";

const captchaConfigurado = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

/**
 * Toque em "entrar" já abre uma sessão anônima do Supabase Auth — sem
 * formulário, sem e-mail/senha. Bate com a tela 02·Chegada, que só pede um
 * apelido. Turnstile protege esse login anônimo (recomendação de segurança
 * do Supabase) quando NEXT_PUBLIC_TURNSTILE_SITE_KEY está configurada; sem
 * a chave (dev local), o botão funciona sem captcha.
 */
export function EntrarButton() {
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const router = useRouter();

  const podeEntrar = !loading && (!captchaConfigurado || captchaToken);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously(
      captchaToken ? { options: { captchaToken } } : undefined,
    );
    if (error) {
      setLoading(false);
      setCaptchaToken(null);
      console.error(error);
      return;
    }
    router.push("/chegada");
  }

  return (
    <div>
      <TurnstileWidget onVerify={setCaptchaToken} />
      <button className={styles.cta} onClick={handleClick} disabled={!podeEntrar}>
        entrar
      </button>
    </div>
  );
}
