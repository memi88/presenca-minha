import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { NascimentoForm } from "./NascimentoForm";
import styles from "./page.module.css";

export default async function Nascimento() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, data_nascimento, hora_nascimento, local_nascimento")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  return (
    <main className={styles.scene}>
      <div className={styles.content}>
        <a className={styles.voltar} href="/perfil">
          ‹ perfil
        </a>
        <p className={styles.eyebrow}>quer personalizar sua presença?</p>
        <h1 className={styles.headline}>
          Esses dados ajudam a calibrar{" "}
          <br className={styles.quebra} />
          como esse espaço te acompanha.
        </h1>
        <NascimentoForm
          data={profile.data_nascimento}
          hora={profile.hora_nascimento}
          local={profile.local_nascimento}
        />
      </div>
    </main>
  );
}
