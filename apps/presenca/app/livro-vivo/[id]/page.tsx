import { notFound, redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { guardarLeitura } from "./actions";
import styles from "./page.module.css";

export default async function LeituraLivroVivo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: pagina } = await supabase
    .from("biblioteca")
    .select("id, titulo, conteudo")
    .eq("id", id)
    .eq("tipo", "pagina_livro_vivo")
    .maybeSingle();

  if (!pagina) notFound();

  const { data: jaGuardada } = await supabase
    .from("caderno_entradas")
    .select("id")
    .eq("paciente_id", user.id)
    .eq("biblioteca_ref_id", pagina.id)
    .maybeSingle();

  const paragrafos: string[] = pagina.conteudo.split(/\n{2,}/).filter(Boolean);

  return (
    <main className={styles.scene}>
      <div className={styles.header}>
        <a className={styles.voltar} href="/livro-vivo">
          ‹ Livro Vivo
        </a>
        <h1 className={styles.titulo}>{pagina.titulo}</h1>
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
          <span className={styles.guardado}>guardado no seu caderno ✓</span>
        ) : (
          <form action={guardarLeitura.bind(null, pagina.id)}>
            <button className={styles.guardar} type="submit">
              guardar esta leitura
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
