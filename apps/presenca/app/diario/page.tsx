import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PageHeader } from "../PageHeader";
import { EntradaItem, type Entrada } from "./EntradaItem";
import { NovaEntradaForm } from "./NovaEntradaForm";
import styles from "./page.module.css";

export default async function Diario() {
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

  const temProfissional = !!profile.profissional_id;

  const [{ data: entradas }] = await Promise.all([
    supabase
      .from("caderno_entradas")
      .select(
        "id, autor_tipo, conteudo, revisitar, compartilhar, created_at, tipo, biblioteca_ref_id, conexao_conteudo, profissionais:autor_profissional_id(nome)",
      )
      .eq("paciente_id", user.id)
      .order("created_at", { ascending: false }),
    // Sinal pro "continue de onde você parou" da Home (lib/menuHome.ts).
    supabase.from("profiles").update({ ultimo_destino: "diario" }).eq("id", user.id),
  ]);

  return (
    <main className={styles.scene}>
      <PageHeader nome={profile.nome} atual="escrever" voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.header}>
        <p className={styles.eyebrow}>Diário</p>
        <h1 className={styles.titulo}>O que você quer guardar.</h1>
      </div>

      <div className={styles.colunas}>
        <div className={styles.colunaEscrever}>
          <NovaEntradaForm temProfissional={temProfissional} />
          <p className={styles.legenda}>sem contagem, sem meta — só você</p>
        </div>

        <div className={styles.colunaAntes}>
          <p className={styles.antesRotulo}>antes</p>
          <div className={styles.lista}>
            {!entradas?.length && <p className={styles.vazio}>Ainda não há nada guardado aqui.</p>}
            {entradas?.map((entrada) => (
              <EntradaItem
                key={entrada.id}
                entrada={entrada as unknown as Entrada}
                temProfissional={temProfissional}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
