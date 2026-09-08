import { redirect } from "next/navigation";

import { desc, eq, inArray } from "drizzle-orm";
import { experienciasGuiadas, experienciasInstancias, profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import styles from "./page.module.css";

const ROTULO_ESTADO: Record<string, string> = {
  aguardando_especialista: "aguardando você",
  em_andamento: "em andamento",
  concluida: "concluída",
};

const PRIORIDADE_ESTADO: Record<string, number> = {
  aguardando_especialista: 0,
  em_andamento: 1,
  concluida: 2,
};

export default async function ExperienciasFila() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profissional) redirect("/");

  const minhasExperiencias = await db.query.experienciasGuiadas.findMany({
    where: eq(experienciasGuiadas.especialistaId, profissional.id),
    columns: { id: true },
  });
  const idsExperiencias = minhasExperiencias.map((e) => e.id);

  const instancias = idsExperiencias.length
    ? await db.query.experienciasInstancias.findMany({
        where: inArray(experienciasInstancias.experienciaId, idsExperiencias),
        orderBy: desc(experienciasInstancias.iniciadoEm),
        columns: { id: true, estado: true, iniciadoEm: true },
        with: {
          paciente: { columns: { nome: true } },
          experiencia: { columns: { titulo: true } },
          etapaAtual: { columns: { ordem: true } },
        },
      })
    : [];

  instancias.sort((a, b) => (PRIORIDADE_ESTADO[a.estado] ?? 9) - (PRIORIDADE_ESTADO[b.estado] ?? 9));

  return (
    <main className={styles.scene}>
      <div className={styles.topBar}>
        <p className={styles.greeting}>Experiências guiadas</p>
        <a className={styles.voltar} href="/pacientes">
          ‹ pacientes
        </a>
      </div>

      {!instancias.length && <p className={styles.vazio}>Ninguém em jornada ainda.</p>}

      {instancias.map((instancia) => (
        <a key={instancia.id} className={styles.item} href={`/experiencias/${instancia.id}`}>
          <div className={styles.itemTopo}>
            <span>{instancia.paciente?.nome ?? "sem nome"}</span>
            {instancia.estado === "aguardando_especialista" && <span className={styles.pendente}>aguardando você</span>}
          </div>
          <p className={styles.itemContexto}>
            {instancia.experiencia.titulo} · etapa {instancia.etapaAtual?.ordem ?? "—"} ·{" "}
            {ROTULO_ESTADO[instancia.estado] ?? instancia.estado}
          </p>
        </a>
      ))}
    </main>
  );
}
