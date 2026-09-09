"use server";

import { redirect } from "next/navigation";

import { and, asc, eq, ne } from "drizzle-orm";
import { admins, experienciasEtapas, experienciasGuiadas, experienciasInstancias } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

export type EditarState = { erro?: string };

const TIPOS_VALIDOS = ["autoguiada", "guiada_metodo", "acompanhada"] as const;

type EtapaEntrada = {
  conteudo: string;
  tipoResposta: "texto" | "escolha";
  compartilhadaComEspecialista: boolean;
  opcoes: Array<{ valor: string; rotulo: string; descricao?: string; orientacao?: string }>;
};

async function exigirAdmin() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const db = await getDb();
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, sessao.user.id) });
  if (!admin) redirect("/home");

  return db;
}

export async function editarExperiencia(
  id: string,
  _prev: EditarState,
  formData: FormData,
): Promise<EditarState> {
  const db = await exigirAdmin();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();
  const estimativaFormato = String(formData.get("estimativaFormato") ?? "").trim();
  const etapasRaw = String(formData.get("etapas") ?? "[]");

  if (!titulo) return { erro: "Diz o título." };
  if (!TIPOS_VALIDOS.includes(tipo as (typeof TIPOS_VALIDOS)[number])) return { erro: "Escolha o tipo." };
  if (!descricao) return { erro: "Escreve a descrição." };

  let etapas: EtapaEntrada[];
  try {
    etapas = JSON.parse(etapasRaw);
  } catch {
    return { erro: "Etapas malformadas — tenta de novo." };
  }
  if (!Array.isArray(etapas) || etapas.length === 0) return { erro: "Adiciona pelo menos 1 etapa." };
  for (const etapa of etapas) {
    if (!etapa.conteudo?.trim()) return { erro: "Toda etapa precisa de conteúdo." };
    if (etapa.tipoResposta === "escolha" && (!etapa.opcoes || etapa.opcoes.length < 2)) {
      return { erro: "Etapa de escolha precisa de pelo menos 2 opções." };
    }
  }

  await db
    .update(experienciasGuiadas)
    .set({ titulo, tipo, descricao, estimativaFormato: estimativaFormato || null })
    .where(eq(experienciasGuiadas.id, id));

  const etapasAtuais = await db.query.experienciasEtapas.findMany({
    where: eq(experienciasEtapas.experienciaId, id),
    orderBy: asc(experienciasEtapas.ordem),
    columns: { id: true },
  });

  if (etapas.length === etapasAtuais.length) {
    // Mesmo número de etapas — update in-place por posição, preservando
    // os ids: experienciasInstancias.etapaAtualId e
    // experienciasRespostas.etapaId referenciam essas linhas diretamente,
    // então trocar id quebraria instâncias de pacientes já em andamento.
    await Promise.all(
      etapas.map((etapa, indice) =>
        db
          .update(experienciasEtapas)
          .set({
            conteudo: etapa.conteudo,
            tipoResposta: etapa.tipoResposta,
            compartilhadaComEspecialista: tipo === "acompanhada" ? etapa.compartilhadaComEspecialista : false,
            opcoes: etapa.tipoResposta === "escolha" ? etapa.opcoes : null,
          })
          .where(eq(experienciasEtapas.id, etapasAtuais[indice]!.id)),
      ),
    );
  } else {
    // Número de etapas mudou — delete-all + reinsert só é seguro se
    // ninguém está em andamento nesta experiência agora (senão
    // etapaAtualId/experienciasRespostas.etapaId ficam órfãos).
    const instanciaEmAndamento = await db.query.experienciasInstancias.findFirst({
      where: and(eq(experienciasInstancias.experienciaId, id), ne(experienciasInstancias.estado, "concluida")),
      columns: { id: true },
    });
    if (instanciaEmAndamento) {
      return {
        erro:
          "Não é possível adicionar/remover etapas: há pelo menos uma pessoa em andamento nesta experiência. " +
          "Edite o conteúdo das etapas existentes sem mudar a quantidade, ou aguarde a conclusão.",
      };
    }

    await db.delete(experienciasEtapas).where(eq(experienciasEtapas.experienciaId, id));
    await db.insert(experienciasEtapas).values(
      etapas.map((etapa, indice) => ({
        experienciaId: id,
        ordem: indice + 1,
        conteudo: etapa.conteudo,
        tipoResposta: etapa.tipoResposta,
        compartilhadaComEspecialista: tipo === "acompanhada" ? etapa.compartilhadaComEspecialista : false,
        opcoes: etapa.tipoResposta === "escolha" ? etapa.opcoes : null,
      })),
    );
  }

  redirect("/admin/experiencias-guiadas");
}
