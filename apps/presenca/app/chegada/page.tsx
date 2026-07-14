import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PageHeader } from "../PageHeader";
import { salvarNome } from "./actions";
import styles from "./page.module.css";

export default async function Chegada() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <main className={styles.scene}>
      <PageHeader voltar={{ href: "/bem-vindo", label: "‹" }} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>criar espaço</p>
        <h1 className={styles.headline}>
          Que bom ter{" "}
          <br className={styles.quebra} />
          você aqui.
        </h1>
        <p className={styles.subtext}>Como você gostaria de ser chamado?</p>
        <form action={salvarNome}>
          <input
            className={styles.input}
            type="text"
            name="nome"
            placeholder="seu nome ou apelido"
            autoComplete="given-name"
            required
          />
          <button className={styles.cta} type="submit">
            começar
          </button>
        </form>
        <p className={styles.disclaimer}>
          Ao entrar, você concorda com nossos{" "}
          <br className={styles.quebra} /> <a href="/limites-de-cuidado">limites de cuidado</a>.
        </p>
      </div>
    </main>
  );
}
