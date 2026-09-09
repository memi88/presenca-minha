import { redirect } from "next/navigation";

import { and, desc, eq } from "drizzle-orm";
import { biblioteca, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { PageHeader } from "../PageHeader";
import { PainelPratica } from "./PainelPratica";
import styles from "./PainelPratica.module.css";

export default async function Praticas({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const [profile, praticas] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.userId, sessao.user.id),
      columns: { nome: true, profissionalId: true },
    }),
    db.query.biblioteca.findMany({
      where: and(eq(biblioteca.tipo, "pratica"), eq(biblioteca.publicado, true)),
      orderBy: desc(biblioteca.createdAt),
      columns: {
        id: true,
        titulo: true,
        slug: true,
        conteudo: true,
        categoria: true,
        capaChave: true,
        duracao: true,
      },
    }),
  ]);
  if (!profile?.nome) redirect("/chegada");

  if (!praticas.length) {
    return (
      <main className={styles.scene}>
        <PageHeader titulo="Práticas" nome={profile.nome} atual="pratica" voltar={{ href: "/home" }} />
        <div className={styles.selecaoCentro}>
          <h2 className={styles.tituloSelecao}>
            Pequenas práticas,{" "}
            <br className={styles.quebra} />à vontade.
          </h2>
          <p className={styles.subtitulo}>Escolha pelo tempo que você tem</p>
          <p className={styles.vazio}>Nenhuma prática publicada ainda.</p>
        </div>
      </main>
    );
  }

  // A rota de lista nunca pré-seleciona uma prática — só /praticas/[id]
  // (navegação explícita) mostra conteúdo de verdade no painel direito.
  return (
    <PainelPratica
      nome={profile.nome}
      praticas={praticas}
      praticaAtiva={null}
      jaGuardada={false}
      mostrarCtaConectar={!profile.profissionalId}
      categoriaAtiva={categoria ?? null}
    />
  );
}
