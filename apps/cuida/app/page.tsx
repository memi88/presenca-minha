import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

export default async function Login() {
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
        <p className={styles.eyebrow}>cuida</p>
        <h1 className={styles.headline}>Portal do profissional</h1>
        <LoginForm />
      </div>
    </main>
  );
}
