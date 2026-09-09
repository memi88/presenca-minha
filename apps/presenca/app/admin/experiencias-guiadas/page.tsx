import { redirect } from "next/navigation";

import { desc, eq } from "drizzle-orm";
import { admins, experienciasGuiadas } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { aprovar, recusar, tirarDoAr } from "./actions";
import styles from "./page.module.css";

const ROTULO_TIPO: Record<string, string> = {
  autoguiada: "autoguiada",
  guiada_metodo: "guiada pelo método",
  acompanhada: "acompanhada",
};

type StatusFiltro = "pendente" | "publicado";

function linkFiltro(status: StatusFiltro): string {
  return `/admin/experiencias-guiadas?status=${status}`;
}

export default async function AdminExperienciasGuiadas({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const db = await getDb();
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, sessao.user.id) });
  if (!admin) redirect("/home");

  const params = await searchParams;
  const status: StatusFiltro = params.status === "publicado" ? "publicado" : "pendente";

  const experiencias = await db.query.experienciasGuiadas.findMany({
    where:
      status === "pendente"
        ? eq(experienciasGuiadas.statusModeracao, "pendente")
        : eq(experienciasGuiadas.publicado, true),
    orderBy: desc(experienciasGuiadas.createdAt),
    columns: { id: true, titulo: true, tipo: true },
    with: {
      especialista: { columns: { nome: true } },
      etapas: { columns: { id: true } },
    },
  });

  return (
    <main className={styles.scene}>
      <p className={styles.eyebrow}>admin</p>
      <h1 className={styles.headline}>Experiências guiadas</h1>

      <div className={styles.filtros}>
        <a
          className={`${styles.filtroPill} ${status === "pendente" ? styles.filtroPillAtivo : ""}`}
          href={linkFiltro("pendente")}
        >
          pendentes
        </a>
        <a
          className={`${styles.filtroPill} ${status === "publicado" ? styles.filtroPillAtivo : ""}`}
          href={linkFiltro("publicado")}
        >
          publicadas
        </a>
      </div>

      <p className={styles.contagem}>
        {experiencias.length} {experiencias.length === 1 ? "item" : "itens"}
      </p>

      {!experiencias.length && <p className={styles.vazio}>Nada por aqui com esse filtro.</p>}

      {experiencias.map((exp) => (
        <div key={exp.id} className={styles.item}>
          <div className={styles.itemTopo}>
            <span className={styles.itemTitulo}>{exp.titulo}</span>
            <span className={styles.itemMeta}>
              {ROTULO_TIPO[exp.tipo] ?? exp.tipo} · {exp.etapas.length}{" "}
              {exp.etapas.length === 1 ? "etapa" : "etapas"} · proposta por{" "}
              {exp.especialista?.nome ?? "—"}
            </span>
          </div>
          <div className={styles.acoes}>
            <a className={styles.editar} href={`/admin/experiencias-guiadas/${exp.id}/editar`}>
              Editar
            </a>
            {status === "pendente" ? (
              <>
                <form action={aprovar.bind(null, exp.id)}>
                  <button className={styles.aprovar} type="submit">
                    Aprovar
                  </button>
                </form>
                <form className={styles.recusarForm} action={recusar.bind(null, exp.id)}>
                  <input className={styles.motivoInput} type="text" name="motivo" placeholder="Motivo (opcional)" />
                  <button className={styles.recusar} type="submit">
                    Recusar
                  </button>
                </form>
              </>
            ) : (
              <form action={tirarDoAr.bind(null, exp.id)}>
                <button className={styles.recusar} type="submit">
                  Tirar do ar
                </button>
              </form>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}
