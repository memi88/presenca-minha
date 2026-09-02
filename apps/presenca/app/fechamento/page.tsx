import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PageHeader } from "../PageHeader";
import { FechamentoForm } from "./FechamentoForm";
import styles from "./page.module.css";

// Tela própria, nunca um gate obrigatório (diferente de /hoje) — convidada
// por um link discreto na Home, logo abaixo do bloco "Uma lente para
// hoje" (docs/integracao-presente-presenca-decisoes.md, P6). Não lê nem
// depende da lente do dia — pergunta e respostas são fixas, sem variação.
export default async function Fechamento() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  return (
    <main className={styles.scene}>
      <PageHeader nome={profile.nome} voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>fechamento</p>
        <h1 className={styles.headline}>Como foi seu dia?</h1>
        <FechamentoForm />
      </div>
    </main>
  );
}
