import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import styles from "./page.module.css";

const SLUGS_INTERATIVOS: Record<string, string> = {
  "respiracao-4-7-8": "/folego",
};

export default async function Meditacao() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: praticas }] = await Promise.all([
    supabase
      .from("biblioteca")
      .select("id, titulo, slug")
      .eq("tipo", "pratica")
      .eq("publicado", true)
      .order("created_at", { ascending: false }),
    // Sinal pro "continue de onde você parou" da Home (lib/menuHome.ts).
    supabase.from("profiles").update({ ultimo_destino: "meditacao" }).eq("id", user.id),
  ]);

  return (
    <main className={styles.scene}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>meditação</p>
        <h1 className={styles.titulo}>
          Pequenas práticas,
          <br className={styles.quebra} />
          à vontade.
        </h1>
        <p className={styles.subtitulo}>escolha pelo tempo que você tem</p>
        <a className={styles.voltar} href="/home">
          ← voltar
        </a>
      </div>

      <div className={styles.lista}>
        {!praticas?.length && <p className={styles.vazio}>Nenhuma prática publicada ainda.</p>}
        {praticas?.map((pratica) => {
          const rota = (pratica.slug && SLUGS_INTERATIVOS[pratica.slug]) || `/meditacao/${pratica.id}`;
          return (
            <a key={pratica.id} className={styles.item} href={rota}>
              <span className={styles.itemIcone} aria-hidden="true" />
              <span className={styles.itemTitulo}>{pratica.titulo}</span>
            </a>
          );
        })}
      </div>
    </main>
  );
}
