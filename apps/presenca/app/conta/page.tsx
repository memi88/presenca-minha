import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { PageHeader } from "../PageHeader";
import { ContaForm } from "./ContaForm";
import styles from "./page.module.css";

export default async function Conta() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const profile = await (await getDb()).query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { nome: true },
  });

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Conta" nome={profile?.nome ?? undefined} atual={null} voltar={{ href: "/perfil" }} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>seu espaço</p>
        <h2 className={styles.headline}>
          Quer poder voltar{" "}
          <br className={styles.quebra} />
          de qualquer lugar?
        </h2>
        <p className={styles.subtext}>
          Um e-mail e uma senha guardam esse espaço pra você — sem pressa, quando quiser.
        </p>
        <ContaForm />
        <a className={styles.agoraNao} href="/home">
          Agora não
        </a>
      </div>
    </main>
  );
}
