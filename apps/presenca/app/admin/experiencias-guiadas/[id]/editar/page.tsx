import { notFound, redirect } from "next/navigation";

import { asc, eq } from "drizzle-orm";
import { admins, experienciasEtapas, experienciasGuiadas } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { EditarForm } from "./EditarForm";
import styles from "./EditarForm.module.css";

export default async function EditarExperienciaGuiada({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const db = await getDb();
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, sessao.user.id) });
  if (!admin) redirect("/home");

  const experiencia = await db.query.experienciasGuiadas.findFirst({
    where: eq(experienciasGuiadas.id, id),
    columns: { id: true, titulo: true, tipo: true, descricao: true, estimativaFormato: true },
    with: {
      etapas: {
        orderBy: asc(experienciasEtapas.ordem),
        columns: { conteudo: true, tipoResposta: true, compartilhadaComEspecialista: true, opcoes: true },
      },
    },
  });
  if (!experiencia) notFound();

  return (
    <main className={styles.scene}>
      <a className={styles.voltar} href="/admin/experiencias-guiadas">
        ‹ experiências guiadas
      </a>
      <p className={styles.eyebrow}>admin</p>
      <h1 className={styles.headline}>Editar experiência</h1>
      <EditarForm
        id={experiencia.id}
        tituloInicial={experiencia.titulo}
        tipoInicial={experiencia.tipo as "autoguiada" | "guiada_metodo" | "acompanhada"}
        descricaoInicial={experiencia.descricao}
        estimativaFormatoInicial={experiencia.estimativaFormato}
        etapasIniciais={experiencia.etapas.map((etapa) => ({
          conteudo: etapa.conteudo,
          tipoResposta: etapa.tipoResposta as "texto" | "escolha",
          compartilhadaComEspecialista: etapa.compartilhadaComEspecialista,
          opcoes: (etapa.opcoes ?? []).map((opcao) => ({
            valor: opcao.valor,
            rotulo: opcao.rotulo,
            descricao: opcao.descricao ?? "",
            orientacao: opcao.orientacao ?? "",
          })),
        }))}
      />
    </main>
  );
}
