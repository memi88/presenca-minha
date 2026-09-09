import { notFound, redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { admins, biblioteca } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { EditarForm } from "./EditarForm";
import styles from "./page.module.css";

export default async function EditarConteudo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const db = await getDb();
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, sessao.user.id) });
  if (!admin) redirect("/home");

  const item = await db.query.biblioteca.findFirst({
    where: eq(biblioteca.id, id),
    columns: {
      id: true,
      tipo: true,
      titulo: true,
      conteudo: true,
      categoria: true,
      duracao: true,
      intencao: true,
      capaChave: true,
      midiaChave: true,
      midiaTipo: true,
    },
  });
  if (!item) notFound();

  return (
    <main className={styles.scene}>
      <a className={styles.voltar} href="/admin/biblioteca">
        ‹ biblioteca
      </a>
      <p className={styles.eyebrow}>admin</p>
      <h1 className={styles.headline}>Editar {item.tipo === "pratica" ? "prática" : "página"}</h1>
      <EditarForm
        id={item.id}
        tipo={item.tipo as "pagina_livro_vivo" | "pratica"}
        tituloInicial={item.titulo ?? ""}
        conteudoInicial={item.conteudo}
        categoriaInicial={item.categoria}
        duracaoInicial={item.duracao}
        intencaoInicial={item.intencao}
        capaChaveInicial={item.capaChave}
        midiaChaveInicial={item.midiaChave}
        midiaTipoInicial={item.midiaTipo}
      />
    </main>
  );
}
