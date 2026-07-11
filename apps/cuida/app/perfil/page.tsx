import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PerfilForm } from "./PerfilForm";
import styles from "./page.module.css";

export default async function Perfil() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("nome")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profissional) redirect("/");

  return (
    <main className={styles.scene}>
      <a className={styles.voltar} href="/pacientes">
        ‹ pacientes
      </a>
      <p className={styles.eyebrow}>meu perfil</p>
      <h1 className={styles.headline}>{profissional.nome}</h1>
      <PerfilForm />
    </main>
  );
}
