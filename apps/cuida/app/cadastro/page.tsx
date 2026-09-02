import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { CadastroForm } from "./CadastroForm";
import styles from "./page.module.css";

export default async function Cadastro() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profissional } = await supabase
      .from("profissionais")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profissional) redirect("/pacientes");
  }

  return (
    <main className={styles.scene}>
      <div className={styles.content}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>cuida</p>
          <h1 className={styles.headline}>Só o essencial pra começar</h1>
          <p className={styles.subtext}>
            O resto — abordagem, forma de trabalho — a gente pergunta quando fizer sentido, não agora.
          </p>
          <CadastroForm />
          <a className={styles.voltarLogin} href="/">
            já tenho conta
          </a>
        </div>
      </div>
    </main>
  );
}
