import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { PreCadastroForm } from "./PreCadastroForm";
import styles from "./page.module.css";

export default async function NovoPaciente() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const profissional = await (await getDb()).query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true, tipo: true },
  });
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
      <div className={styles.card}>
        <p className={styles.eyebrow}>novo paciente</p>
        <h1 className={styles.headline}>Pré-cadastrar paciente</h1>
        <PreCadastroForm />
      </div>
    </main>
  );
}
