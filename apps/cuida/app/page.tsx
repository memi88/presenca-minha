import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";
import { Stitch } from "./Stitch";

export default async function Login() {
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
          <p className={styles.mark}>
            <b>Cuida</b> · presença
          </p>
          <p className={styles.eyebrow}>para profissionais</p>
          <h1 className={styles.headline}>Portal do profissional</h1>
          <p className={styles.subtext}>
            Seus pacientes continuam vivendo entre as sessões. O Cuida te deixa presente nesse
            intervalo — sem virar mais uma ferramenta pra gerenciar.
          </p>
          <Stitch />
          <LoginForm />
          <a className={styles.voltarLogin} href="/cadastro">
            ainda não tem conta? criar conta
          </a>
        </div>
      </div>
    </main>
  );
}
