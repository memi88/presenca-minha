import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { EntradaItem, type Entrada } from "./EntradaItem";
import { NovaEntradaForm } from "./NovaEntradaForm";
import styles from "./page.module.css";

export default async function Caderno() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  const { data: entradas } = await supabase
    .from("caderno_entradas")
    .select("id, autor_tipo, conteudo, revisitar, created_at, profissionais:autor_profissional_id(nome)")
    .eq("paciente_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className={styles.scene}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>meu livro</p>
        <h1 className={styles.titulo}>Caderno</h1>
        <a className={styles.voltar} href="/home">
          ← voltar
        </a>
      </div>

      <NovaEntradaForm />

      <div className={styles.lista}>
        {!entradas?.length && <p className={styles.vazio}>Ainda não há nada guardado aqui.</p>}
        {entradas?.map((entrada) => (
          <EntradaItem key={entrada.id} entrada={entrada as unknown as Entrada} />
        ))}
      </div>
    </main>
  );
}
