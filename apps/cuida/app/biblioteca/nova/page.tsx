import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { PropostaForm } from "./PropostaForm";
import styles from "./page.module.css";

export default async function NovaProposta() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const profissional = await (await getDb()).query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profissional) redirect("/");

  return (
    <main className={styles.scene}>
      <a className={styles.voltar} href="/pacientes">
        ‹ pacientes
      </a>
      <div className={styles.card}>
        <p className={styles.eyebrow}>biblioteca</p>
        <h1 className={styles.headline}>Propor conteúdo</h1>
        <p className={styles.subtext}>
          Toda proposta passa por aprovação antes de aparecer pra alguém — mesmo conteúdo restrito
          aos seus pacientes.
        </p>
        <PropostaForm />
      </div>
    </main>
  );
}
