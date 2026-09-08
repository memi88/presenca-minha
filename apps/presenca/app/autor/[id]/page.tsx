import { notFound, redirect } from "next/navigation";

import { and, desc, eq } from "drizzle-orm";
import { biblioteca, profiles, profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { PLACEHOLDER_LIVRO_VIVO, PLACEHOLDER_PRATICA, PLACEHOLDER_TERAPEUTA, imagemUrl } from "@/lib/placeholders";

import { PageHeader } from "../../PageHeader";
import styles from "./page.module.css";

// Mesmo padrão de app/home/page.tsx — corte sempre em fronteira de
// palavra, nunca no meio.
function trecho(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  return `${corte.slice(0, corte.lastIndexOf(" "))}…`;
}

// Página do Autor (docs/redesign/p_gina_do_autor_alice_guimar_es) — só pra
// profissionais com conta, alcançada a partir de "ver perfil de X" em
// AutoriaBiblioteca.tsx. RLS: profissionais.select exige que este
// profissional tenha ao menos um item público publicado (migration
// profissionais_leitura_publica) — sem isso, `notFound()` mais embaixo.
export default async function Autor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { nome: true },
  });
  if (!profile?.nome) redirect("/chegada");

  const [profissional, obras] = await Promise.all([
    db.query.profissionais.findFirst({
      where: eq(profissionais.id, id),
      columns: { id: true, nome: true, tipo: true, formaDeTrabalho: true, fotoChave: true },
    }),
    db.query.biblioteca.findMany({
      where: and(eq(biblioteca.profissionalAutorId, id), eq(biblioteca.publicado, true), eq(biblioteca.escopo, "publico")),
      orderBy: desc(biblioteca.createdAt),
      columns: { id: true, tipo: true, titulo: true, conteudo: true, capaChave: true },
    }),
  ]);

  if (!profissional) notFound();

  const descricao =
    profissional.tipo === "Outra" ? (profissional.formaDeTrabalho ?? profissional.tipo) : profissional.tipo;

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Autor" nome={profile.nome} atual={null} voltar={{ href: "/livro-vivo" }} />
      <div className={styles.content}>
        <div
          className={styles.avatar}
          style={{ backgroundImage: `url(${imagemUrl(profissional.fotoChave, PLACEHOLDER_TERAPEUTA)})` }}
          aria-hidden="true"
        />
        <p className={styles.eyebrow}>perfil do autor</p>
        <h2 className={styles.nome}>{profissional.nome}</h2>
        <p className={styles.descricao}>{descricao}</p>

        {obras && obras.length > 0 && (
          <section className={styles.obras}>
            <p className={styles.obrasRotulo}>Mais de {profissional.nome}</p>
            <div className={styles.grade}>
              {obras.map((obra) => {
                const ehPratica = obra.tipo === "pratica";
                return (
                  <a
                    key={obra.id}
                    href={ehPratica ? `/praticas/${obra.id}` : `/livro-vivo/${obra.id}`}
                    className={styles.card}
                  >
                    <div
                      className={styles.cardImagem}
                      style={{
                        backgroundImage: `url(${imagemUrl(obra.capaChave, ehPratica ? PLACEHOLDER_PRATICA : PLACEHOLDER_LIVRO_VIVO)})`,
                      }}
                      aria-hidden="true"
                    />
                    <div className={styles.cardCorpo}>
                      <span className={styles.cardBadge}>{ehPratica ? "Prática" : "Livro Vivo"}</span>
                      <p className={styles.cardTitulo}>{obra.titulo}</p>
                      <p className={styles.cardTexto}>{trecho(obra.conteudo, 90)}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
