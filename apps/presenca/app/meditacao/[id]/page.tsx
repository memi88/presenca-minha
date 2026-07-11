import { notFound, redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { guardarPratica } from "./actions";
import styles from "./page.module.css";

export default async function LeituraPratica({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: pratica } = await supabase
    .from("biblioteca")
    .select("id, titulo, conteudo")
    .eq("id", id)
    .eq("tipo", "pratica")
    .maybeSingle();

  if (!pratica) notFound();

  const { data: jaGuardada } = await supabase
    .from("caderno_entradas")
    .select("id")
    .eq("paciente_id", user.id)
    .eq("biblioteca_ref_id", pratica.id)
    .maybeSingle();

  const paragrafos: string[] = pratica.conteudo.split(/\n{2,}/).filter(Boolean);

  return (
    <main className={styles.scene}>
      <div className={styles.header}>
        <a className={styles.voltar} href="/meditacao">
          ‹ Meditação
        </a>
        <h1 className={styles.titulo}>{pratica.titulo}</h1>
      </div>

      <div className={styles.corpo}>
        {paragrafos.map((paragrafo, i) => (
          <p key={i} className={styles.paragrafo}>
            {paragrafo}
          </p>
        ))}
      </div>

      <div className={styles.rodape}>
        {jaGuardada ? (
          <span className={styles.guardado}>guardado no seu diário ✓</span>
        ) : (
          <form action={guardarPratica.bind(null, pratica.id)}>
            <button className={styles.guardar} type="submit">
              guardar esta prática
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
