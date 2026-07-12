import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { ContaForm } from "../conta/ContaForm";
import { ConectarForm } from "./ConectarForm";
import styles from "./page.module.css";

export default async function Terapia() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, profissional_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  if (user.is_anonymous) {
    return (
      <main className={styles.scene}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>terapia</p>
          <h1 className={styles.headline}>
            Antes de conectar,{" "}
            <br className={styles.quebra} />
            vamos guardar seu espaço
          </h1>
          <p className={styles.subtext}>
            Perder esse vínculo por não ter um jeito de voltar seria grave demais — por isso, pra
            conectar com um profissional, primeiro a gente guarda seu espaço com e-mail e senha.
          </p>
          <ContaForm next="/terapia" />
        </div>
      </main>
    );
  }

  if (profile.profissional_id) {
    const { data: profissional } = await supabase
      .from("profissionais")
      .select("nome")
      .eq("id", profile.profissional_id)
      .maybeSingle();

    return (
      <main className={styles.scene}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>terapia</p>
          <h1 className={styles.headline}>
            Você está conectado{" "}
            <br className={styles.quebra} />
            com {profissional?.nome ?? "seu profissional"}
          </h1>
          <p className={styles.subtext}>
            O que você escreve aqui pode ser lido por essa pessoa quando fizer sentido pro seu
            cuidado.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.scene}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>terapia</p>
        <h1 className={styles.headline}>
          Tem um código{" "}
          <br className={styles.quebra} />
          de convite?
        </h1>
        <p className={styles.subtext}>
          Quem te acompanha pode te passar um código pra conectar seu espaço aqui com o
          acompanhamento dela.
        </p>
        <p className={styles.subtext}>
          Ao conectar, seu profissional passa a poder escrever no seu Diário e você pode avisar
          ela caso precise de apoio — combinado agora, não pedido de novo depois.
        </p>
        <ConectarForm />
      </div>
    </main>
  );
}
