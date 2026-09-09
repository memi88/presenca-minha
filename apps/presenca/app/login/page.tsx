import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { CirculoRespirando } from "../CirculoRespirando";
import { PageHeader } from "../PageHeader";
import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

export default async function Login() {
  const sessao = await getSessao();

  if (sessao) {
    const profile = await (await getDb()).query.profiles.findFirst({
      where: eq(profiles.userId, sessao.user.id),
      columns: { nome: true },
    });

    redirect(profile?.nome ? "/home" : "/chegada");
  }

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Entrar" voltar={{ href: "/bem-vindo" }} />
      <div className={styles.content}>
        <CirculoRespirando className={styles.icone} />
        <p className={styles.subtext}>Retorne ao seu espaço de reflexão.</p>
        <LoginForm />
        <p className={styles.rodape}>
          <a href="/chegada">Criar um novo espaço</a>
        </p>
      </div>
    </main>
  );
}
