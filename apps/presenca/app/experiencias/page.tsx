import { redirect } from "next/navigation";

import { and, desc, eq } from "drizzle-orm";
import { experienciasGuiadas, experienciasInstancias, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { PageHeader } from "../PageHeader";
import styles from "./page.module.css";

const ROTULO_TIPO: Record<string, string> = {
  autoguiada: "Autoguiada",
  guiada_metodo: "Guiada pelo método",
  acompanhada: "Acompanhada",
};

export default async function Experiencias() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true, nome: true },
  });
  if (!profile?.nome) redirect("/chegada");

  const [experiencias, instanciasDoPaciente] = await Promise.all([
    db.query.experienciasGuiadas.findMany({
      where: eq(experienciasGuiadas.publicado, true),
      orderBy: desc(experienciasGuiadas.createdAt),
      columns: { id: true, titulo: true, tipo: true, descricao: true, estimativaFormato: true },
      with: { especialista: { columns: { nome: true } } },
    }),
    db.query.experienciasInstancias.findMany({
      where: eq(experienciasInstancias.pacienteId, profile.id),
      columns: { id: true, experienciaId: true, estado: true },
    }),
  ]);

  const instanciaPorExperiencia = new Map(instanciasDoPaciente.map((i) => [i.experienciaId, i]));

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Experiências guiadas" nome={profile.nome} atual={null} voltar={{ href: "/home" }} />
      <div className={styles.content}>
        <h2 className={styles.headline}>Experiências guiadas</h2>
        <p className={styles.subtext}>Percursos mais longos que uma prática única — no seu ritmo.</p>

        {!experiencias.length && <p className={styles.vazio}>Nenhuma experiência publicada ainda.</p>}

        {experiencias.map((exp) => {
          const instancia = instanciaPorExperiencia.get(exp.id);
          return (
            <a key={exp.id} className={styles.card} href={`/experiencias/${exp.id}`}>
              <span className={styles.badge}>{ROTULO_TIPO[exp.tipo] ?? exp.tipo}</span>
              <h3 className={styles.cardTitulo}>{exp.titulo}</h3>
              <p className={styles.cardDescricao}>{exp.descricao}</p>
              <div className={styles.cardRodape}>
                <span className={styles.cardAutor}>{exp.especialista?.nome ?? "Presença"}</span>
                <span className={styles.cardCta}>
                  {instancia
                    ? instancia.estado === "concluida"
                      ? "Ver conclusão →"
                      : "Continuar →"
                    : "Conhecer →"}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}
