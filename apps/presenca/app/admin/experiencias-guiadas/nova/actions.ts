"use server";

import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { admins, experienciasEtapas, experienciasGuiadas } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

export type CriarExperienciaState = { erro?: string };

const TIPOS_VALIDOS = ["autoguiada", "guiada_metodo", "acompanhada"] as const;

type EtapaEntrada = {
  conteudo: string;
  tipoResposta: "texto" | "escolha";
  compartilhadaComEspecialista: boolean;
  opcoes: Array<{ valor: string; rotulo: string; descricao?: string; orientacao?: string }>;
};

export async function criarExperiencia(
  _prev: CriarExperienciaState,
  formData: FormData,
): Promise<CriarExperienciaState> {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const db = await getDb();
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, sessao.user.id) });
  if (!admin) redirect("/home");

  const titulo = String(formData.get("titulo") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const especialistaId = String(formData.get("especialistaId") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const estimativaFormato = String(formData.get("estimativaFormato") ?? "").trim();
  const etapasRaw = String(formData.get("etapas") ?? "[]");

  if (!titulo) return { erro: "Diz o título." };
  if (!TIPOS_VALIDOS.includes(tipo as (typeof TIPOS_VALIDOS)[number])) return { erro: "Escolha o tipo." };
  if (!especialistaId) return { erro: "Escolha o especialista responsável — autoria sempre visível." };
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

  const [experiencia] = await db
    .insert(experienciasGuiadas)
    .values({
      titulo,
      tipo,
      especialistaId,
      descricao,
      estimativaFormato: estimativaFormato || null,
    })
    .returning({ id: experienciasGuiadas.id });

  if (!experiencia) return { erro: "Não foi possível salvar agora." };

  await db.insert(experienciasEtapas).values(
    etapas.map((etapa, indice) => ({
      experienciaId: experiencia.id,
      ordem: indice + 1,
      conteudo: etapa.conteudo,
      tipoResposta: etapa.tipoResposta,
      compartilhadaComEspecialista: tipo === "acompanhada" ? etapa.compartilhadaComEspecialista : false,
      opcoes: etapa.tipoResposta === "escolha" ? etapa.opcoes : null,
    })),
  );

  redirect("/admin/experiencias-guiadas");
}
