import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PageHeader } from "../PageHeader";
import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

export default async function Login() {
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
      <PageHeader voltar={{ href: "/", label: "‹" }} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>bem-vindo de volta</p>
        <h1 className={styles.headline}>
          Seu espaço{" "}
          <br className={styles.quebra} />
          está te esperando.
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
