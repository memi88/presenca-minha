import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PageHeader } from "../../PageHeader";
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
    .select("nome, data_nascimento, hora_nascimento, local_nascimento, nascimento_latitude, nascimento_longitude")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  return (
    <main className={styles.scene}>
      <PageHeader nome={profile.nome} atual={null} voltar={{ href: "/perfil", label: "‹ perfil" }} />
      <div className={styles.content}>
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
          latitude={profile.nascimento_latitude}
          longitude={profile.nascimento_longitude}
        />
      </div>
    </main>
  );
}
