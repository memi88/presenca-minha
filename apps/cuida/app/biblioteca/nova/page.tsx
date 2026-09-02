import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PropostaForm } from "./PropostaForm";
import styles from "./page.module.css";

export default async function NovaProposta() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profissional) redirect("/");

  return (
    <main className={styles.scene}>
      <a className={styles.voltar} href="/pacientes">
        ‹ pacientes
      </a>
      <p className={styles.eyebrow}>biblioteca</p>
      <h1 className={styles.headline}>Propor conteúdo</h1>
      <p className={styles.subtext}>
        Toda proposta passa por aprovação antes de aparecer pra alguém — mesmo conteúdo restrito aos
        seus pacientes.
      </p>
      <PropostaForm />
    </main>
  );
}
