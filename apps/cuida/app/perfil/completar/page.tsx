import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { CompletarPerfilForm } from "./CompletarPerfilForm";
import styles from "./page.module.css";

export default async function CompletarPerfil({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("tipo, forma_de_trabalho, usa_linguagens_simbolicas")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profissional) redirect("/");

  return (
    <main className={styles.scene}>
      <div className={styles.content}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>antes de continuar</p>
          <h1 className={styles.headline}>Como você trabalha?</h1>
          <p className={styles.subtext}>
            Leva menos de um minuto, e só precisa ser feito uma vez — depois disso, fica liberado.
          </p>
          <CompletarPerfilForm
            next={next && next.startsWith("/") ? next : "/pacientes"}
            tipoAtual={profissional.tipo}
            formaDeTrabalhoAtual={profissional.forma_de_trabalho}
            usaLinguagensSimbolicasAtual={profissional.usa_linguagens_simbolicas}
          />
        </div>
      </div>
    </main>
  );
}
