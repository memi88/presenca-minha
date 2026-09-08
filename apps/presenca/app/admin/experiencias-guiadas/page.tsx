import { redirect } from "next/navigation";

import { desc, eq } from "drizzle-orm";
import { admins, experienciasGuiadas } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import styles from "./page.module.css";

const ROTULO_TIPO: Record<string, string> = {
  autoguiada: "autoguiada",
  guiada_metodo: "guiada pelo método",
  acompanhada: "acompanhada",
};

export default async function AdminExperienciasGuiadas() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const db = await getDb();
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, sessao.user.id) });
  if (!admin) redirect("/home");

  const experiencias = await db.query.experienciasGuiadas.findMany({
    orderBy: desc(experienciasGuiadas.createdAt),
    columns: { id: true, titulo: true, tipo: true, publicado: true },
    with: {
      especialista: { columns: { nome: true } },
      etapas: { columns: { id: true } },
    },
  });

  return (
    <main className={styles.scene}>
      <p className={styles.eyebrow}>admin</p>
      <h1 className={styles.headline}>Experiências guiadas</h1>
      <a className={styles.novaLink} href="/admin/experiencias-guiadas/nova">
        + Nova experiência
      </a>

      {!experiencias.length && <p className={styles.vazio}>Nenhuma experiência cadastrada ainda.</p>}

      {experiencias.map((exp) => (
        <div key={exp.id} className={styles.item}>
          <div className={styles.itemTopo}>
            <span className={styles.itemTitulo}>{exp.titulo}</span>
            <span className={styles.itemMeta}>
              {ROTULO_TIPO[exp.tipo] ?? exp.tipo} · {exp.etapas.length}{" "}
              {exp.etapas.length === 1 ? "etapa" : "etapas"} · {exp.especialista?.nome ?? "sem especialista"} ·{" "}
              {exp.publicado ? "publicada" : "despublicada"}
            </span>
          </div>
        </div>
      ))}
    </main>
  );
}
