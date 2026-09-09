import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { CadastroForm } from "./CadastroForm";
import styles from "./page.module.css";

export default async function Cadastro() {
  const sessao = await getSessao();

  if (sessao) {
    const profissional = await (await getDb()).query.profissionais.findFirst({
      where: eq(profissionais.userId, sessao.user.id),
      columns: { id: true },
    });
    if (profissional) redirect("/pacientes");
  }

  return (
    <main className={styles.scene}>
      <div className={styles.content}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>cuida</p>
          <h1 className={styles.headline}>Só o essencial pra começar</h1>
          <p className={styles.subtext}>
            O resto — abordagem, forma de trabalho — a gente pergunta quando fizer sentido, não agora.
          </p>
          <CadastroForm />
          <a className={styles.voltarLogin} href="/">
            já tenho conta
          </a>
        </div>
      </div>
    </main>
  );
}
