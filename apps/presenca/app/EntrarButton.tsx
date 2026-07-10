"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@presenca/supabase/browser";

import styles from "./page.module.css";

/**
 * Toque em "entrar" já abre uma sessão anônima do Supabase Auth — sem
 * formulário, sem e-mail/senha. Bate com a tela 02·Chegada, que só pede um
 * apelido; credencial recuperável (e-mail) é um convite contextual futuro,
 * fora do escopo da Fase 1.
 */
export function EntrarButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setLoading(false);
      console.error(error);
      return;
    }
    router.push("/chegada");
  }

  return (
    <button className={styles.cta} onClick={handleClick} disabled={loading}>
      entrar
    </button>
  );
}
