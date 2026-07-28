import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PageHeader } from "../PageHeader";
import { PainelPratica } from "./PainelPratica";
import styles from "./PainelPratica.module.css";

export default async function Praticas() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile }, { data: praticas }] = await Promise.all([
    supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle(),
    supabase
      .from("biblioteca")
      .select("id, titulo, slug, conteudo")
      .eq("tipo", "pratica")
      .eq("publicado", true)
      .order("created_at", { ascending: false }),
    // Sinal pro "continue de onde você parou" da Home (lib/menuHome.ts).
    supabase.from("profiles").update({ ultimo_destino: "praticas" }).eq("id", user.id),
  ]);
  if (!profile?.nome) redirect("/chegada");

  if (!praticas?.length) {
    return (
      <main className={styles.scene}>
        <PageHeader nome={profile.nome} atual="pratica" voltar={{ href: "/home", label: "← voltar" }} />
        <div className={styles.duasColunas}>
          <div className={styles.painelLista}>
            <p className={styles.eyebrow}>Práticas</p>
            <h1 className={styles.titulo}>
              Pequenas práticas,{" "}
              <br className={styles.quebra} />à vontade.
            </h1>
            <p className={styles.subtitulo}>escolha pelo tempo que você tem</p>
            <p className={styles.vazio}>Nenhuma prática publicada ainda.</p>
          </div>
        </div>
      </main>
    );
  }

  // A rota de lista nunca pré-seleciona uma prática — só /praticas/[id]
  // (navegação explícita) mostra conteúdo de verdade no painel direito.
  return (
    <PainelPratica variante="lista" nome={profile.nome} praticas={praticas} praticaAtiva={null} jaGuardada={false} />
  );
}
