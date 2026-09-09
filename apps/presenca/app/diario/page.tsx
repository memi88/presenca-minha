import { redirect } from "next/navigation";

import { and, eq, notInArray } from "drizzle-orm";
import { cadernoEntradas, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { PageHeader } from "../PageHeader";
import { EntradaItem, type Entrada } from "./EntradaItem";
import { NovaEntradaForm } from "./NovaEntradaForm";
import styles from "./page.module.css";

export default async function Diario() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true, nome: true, profissionalId: true },
  });
  if (!profile?.nome) redirect("/chegada");

  const temProfissional = !!profile.profissionalId;

  const entradas = await db.query.cadernoEntradas.findMany({
    where: and(
      eq(cadernoEntradas.pacienteId, profile.id),
      // Fechamento do dia (P6) tem gatilho próprio na Home (modal, ver
      // app/home/FechamentoTrigger.tsx) — não misturado ao Diário genérico,
      // por decisão explícita. Sugestão de prática do agente (P5 Fase A,
      // `pratica_sugerida`) é registro de auditoria, não algo que a pessoa
      // escreveu — mesma lógica.
      notInArray(cadernoEntradas.tipo, ["fechamento_dia", "pratica_sugerida"]),
    ),
    orderBy: (tabela, { desc }) => desc(tabela.createdAt),
    with: { autorProfissional: { columns: { nome: true } } },
  });

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Diário" nome={profile.nome} atual="escrever" voltar={{ href: "/home" }} />
      <div className={styles.header}>
        <h2 className={styles.titulo}>O que você quer guardar.</h2>
      </div>

      <div className={styles.colunas}>
        <div className={styles.colunaEscrever}>
          <NovaEntradaForm temProfissional={temProfissional} />
          <p className={styles.legenda}>sem contagem, sem meta — só você</p>
        </div>

        <div className={styles.colunaAntes}>
          <p className={styles.antesRotulo}>antes</p>
          <div className={styles.lista}>
            {!entradas.length && <p className={styles.vazio}>Ainda não há nada guardado aqui.</p>}
            {entradas.map((entrada) => (
              <EntradaItem key={entrada.id} entrada={entrada satisfies Entrada} temProfissional={temProfissional} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
