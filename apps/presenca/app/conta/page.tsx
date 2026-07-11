import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { ContaForm } from "./ContaForm";
import styles from "./page.module.css";

export default async function Conta() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <main className={styles.scene}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>seu espaço</p>
        <h1 className={styles.headline}>
          Quer poder voltar
          <br className={styles.quebra} />
          de qualquer lugar?
        </h1>
        <p className={styles.subtext}>
          Um e-mail e uma senha guardam esse espaço pra você — sem pressa, quando quiser.
        </p>
        <ContaForm />
        <a className={styles.agoraNao} href="/home">
          agora não
        </a>
      </div>
    </main>
  );
}
