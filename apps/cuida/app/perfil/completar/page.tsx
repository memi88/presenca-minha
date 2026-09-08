import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { CompletarPerfilForm } from "./CompletarPerfilForm";
import styles from "./page.module.css";

export default async function CompletarPerfil({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const profissional = await (await getDb()).query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { tipo: true, formaDeTrabalho: true, usaLinguagensSimbolicas: true },
  });
  if (!profissional) redirect("/");

  return (
    <main className={styles.scene}>
      <div className={styles.content}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>antes de continuar</p>
          <h1 className={styles.headline}>Como você trabalha?</h1>
          <p className={styles.subtext}>
            Leva menos de um minuto, e só precisa ser feito uma vez — depois disso, fica liberado.
          </p>
          <CompletarPerfilForm
            next={next && next.startsWith("/") ? next : "/pacientes"}
            tipoAtual={profissional.tipo}
            formaDeTrabalhoAtual={profissional.formaDeTrabalho}
            usaLinguagensSimbolicasAtual={profissional.usaLinguagensSimbolicas}
          />
        </div>
      </div>
    </main>
  );
}
