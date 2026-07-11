import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { CriarEspacoButton } from "./CriarEspacoButton";
import styles from "./page.module.css";

export default async function BemVindo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", user.id)
      .maybeSingle();

    redirect(profile?.nome ? "/home" : "/chegada");
  }

  return (
    <main className={styles.scene}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>bem-vindo</p>
        <h1 className={styles.headline}>
          Que bom ter
          <br className={styles.quebra} />
          você aqui.
        </h1>
        <div className={styles.opcoes}>
          <CriarEspacoButton />
          <a className={styles.ctaContorno} href="/login">
            Já possuo meu espaço
          </a>
        </div>
      </div>
    </main>
  );
}
