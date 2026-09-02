import { createClient } from "@presenca/supabase/server";

import { ConfirmarConviteForm } from "./ConfirmarConviteForm";
import styles from "./page.module.css";

export default async function Convite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("validar_token_pre_cadastro", { p_token: token });
  const registro = data?.[0];

  if (!registro) {
    return (
      <main className={styles.scene}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>convite</p>
          <h1 className={styles.headline}>Esse link não é válido.</h1>
          <p className={styles.subtext}>Confira com quem te enviou, ou entre pelo caminho de sempre.</p>
          <a className={styles.cta} href="/">
            ir para o início
          </a>
        </div>
      </main>
    );
  }

  if (registro.status === "confirmado") {
    return (
      <main className={styles.scene}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>convite</p>
          <h1 className={styles.headline}>Esse convite já foi usado.</h1>
          <p className={styles.subtext}>Se já tem conta, é só entrar.</p>
          <a className={styles.cta} href="/login">
            entrar
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.scene}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>convite</p>
        <h1 className={styles.headline}>É você, {registro.nome}?</h1>
        <p className={styles.subtext}>
          Alguém que te acompanha te convidou pro Presença. Confirme criando sua conta.
        </p>
        <ConfirmarConviteForm token={token} />
      </div>
    </main>
  );
}
