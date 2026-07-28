import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PageHeader } from "../PageHeader";
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
      <PageHeader voltar={{ href: "/", label: "‹" }} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>bem-vindo</p>
        <h1 className={styles.headline}>
          Que bom ter{" "}
          <br className={styles.quebra} />
          você aqui.
        </h1>
        <div className={styles.opcoes}>
          {/*
            A conta só é criada de fato (sessão anônima, silenciosa) quando o
            formulário de apelido/e-mail/senha em /chegada é enviado — este
            link não faz nenhuma chamada ao Supabase.
          */}
          <a className={styles.ctaSolido} href="/chegada">
            Quero criar meu espaço
          </a>
          <a className={styles.ctaContorno} href="/login">
            Já possuo meu espaço
          </a>
        </div>
      </div>
    </main>
  );
}
