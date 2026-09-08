import { redirect } from "next/navigation";

import { asc, eq } from "drizzle-orm";
import { admins, profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { NovaExperienciaForm } from "./NovaExperienciaForm";
import styles from "../page.module.css";

export default async function NovaExperienciaGuiada() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const db = await getDb();
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, sessao.user.id) });
  if (!admin) redirect("/home");

  const listaProfissionais = await db.query.profissionais.findMany({
    orderBy: asc(profissionais.nome),
    columns: { id: true, nome: true },
  });

  return (
    <main className={styles.scene}>
      <p className={styles.eyebrow}>admin</p>
      <h1 className={styles.headline}>Nova experiência guiada</h1>
      <NovaExperienciaForm profissionais={listaProfissionais} />
    </main>
  );
}
