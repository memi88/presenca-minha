import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PageHeader } from "../PageHeader";
import { ConversaExperiencia } from "./ConversaExperiencia";
import styles from "./page.module.css";

export default async function Conversa() {
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

  // Sinal pro "continue de onde você parou" da Home (lib/menuHome.ts).
  await supabase.from("profiles").update({ ultimo_destino: "conversa" }).eq("id", user.id);

  return (
    <main className={styles.scene}>
      <PageHeader nome={profile.nome} atual="conversa" voltar={{ href: "/home", label: "← voltar" }} />
      <ConversaExperiencia temProfissional={!!profile.profissional_id} />
    </main>
  );
}
