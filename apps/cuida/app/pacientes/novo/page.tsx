import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PreCadastroForm } from "./PreCadastroForm";
import styles from "./page.module.css";

export default async function NovoPaciente() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id, tipo")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profissional) redirect("/");

  // Gate proposital (docs/presenca-extensao-terapeutas-biblioteca copy.md
  // §2/§3): pré-cadastrar é a ação mais fácil de gerar confusão pra quem tem
  // pouca familiaridade com tecnologia, então exige perfil completo antes —
  // sem saída "prefiro depois" aqui (diferente do banner dispensável da
  // Home). O código de convite genérico continua liberado sem essa exigência.
  if (!profissional.tipo) redirect("/perfil/completar?next=/pacientes/novo");

  return (
    <main className={styles.scene}>
      <a className={styles.voltar} href="/pacientes">
        ‹ pacientes
      </a>
      <p className={styles.eyebrow}>novo paciente</p>
      <h1 className={styles.headline}>Pré-cadastrar paciente</h1>
      <PreCadastroForm />
    </main>
  );
}
