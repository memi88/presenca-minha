import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { IntroEspaco } from "../IntroEspaco";
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
    .select("nome, profissional_id, intro_conversa_vista_em")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  const primeiraEntrada = !profile.intro_conversa_vista_em;

  // Sinal pro "continue de onde você parou" da Home (lib/menuHome.ts).
  await supabase.from("profiles").update({ ultimo_destino: "conversa" }).eq("id", user.id);
  if (primeiraEntrada) {
    await supabase.from("profiles").update({ intro_conversa_vista_em: new Date().toISOString() }).eq("id", user.id);
  }

  return (
    <main className={styles.scene}>
      <PageHeader nome={profile.nome} atual="conversa" voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.introAlinhamento}>
        <IntroEspaco espaco="conversa" expandidaInicialmente={primeiraEntrada} />
      </div>
      <ConversaExperiencia temProfissional={!!profile.profissional_id} />
    </main>
  );
}
