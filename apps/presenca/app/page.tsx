import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { EntrarButton } from "./EntrarButton";
import styles from "./page.module.css";

export default async function Landing() {
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
        <p className={styles.wordmark}>presença</p>
        <h1 className={styles.headline}>
          Um lugar tranquilo
          <br />
          para se encontrar.
        </h1>
        <EntrarButton />
      </div>
    </main>
  );
}
