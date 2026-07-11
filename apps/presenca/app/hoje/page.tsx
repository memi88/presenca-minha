import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { precisaCheckin } from "@/lib/checkin";

import { registrarPresenca } from "./actions";
import styles from "./page.module.css";

const OPCOES = [
  { valor: "confuso", rotulo: "Confuso" },
  { valor: "em_paz", rotulo: "Em paz" },
  { valor: "cansado", rotulo: "Cansado" },
  { valor: "curioso", rotulo: "Curioso" },
  { valor: "nao_sei", rotulo: "Não sei responder" },
] as const;

export default async function Hoje() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, presenca_hoje_em")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  if (!precisaCheckin(profile.presenca_hoje_em)) redirect("/home");

  return (
    <main className={styles.scene}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>presença</p>
        <h1 className={styles.headline}>Como está sua presença hoje?</h1>
        <div className={styles.opcoes}>
          {OPCOES.map((opcao) => (
            <form key={opcao.valor} action={registrarPresenca.bind(null, opcao.valor)}>
              <button className={styles.opcao} type="submit">
                {opcao.rotulo}
              </button>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}
