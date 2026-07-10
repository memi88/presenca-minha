import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import styles from "./page.module.css";

const PALAVRAS_POR_MINUTO = 200;

function minutosDeLeitura(conteudo: string): number {
  const palavras = conteudo.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO));
}

export default async function LivroVivo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: paginas } = await supabase
    .from("biblioteca")
    .select("id, titulo, conteudo")
    .eq("tipo", "pagina_livro_vivo")
    .order("created_at", { ascending: false });

  return (
    <main className={styles.scene}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>livro vivo</p>
        <h1 className={styles.titulo}>
          Leituras para
          <br />
          atravessar o dia.
        </h1>
        <a className={styles.voltar} href="/home">
          ← voltar
        </a>
      </div>

      <div className={styles.lista}>
        {!paginas?.length && <p className={styles.vazio}>Nenhuma página publicada ainda.</p>}
        {paginas?.map((pagina) => (
          <a key={pagina.id} className={styles.item} href={`/livro-vivo/${pagina.id}`}>
            <div className={styles.itemTitulo}>{pagina.titulo}</div>
            <div className={styles.itemMeta}>{minutosDeLeitura(pagina.conteudo)} min de leitura</div>
          </a>
        ))}
      </div>
    </main>
  );
}
