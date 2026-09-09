"use server";

import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { experienciasEtapas, experienciasGuiadas, profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

export type PropostaState = { erro?: string; sucesso?: boolean };

const TIPOS_VALIDOS = ["autoguiada", "guiada_metodo", "acompanhada"] as const;

type EtapaEntrada = {
  conteudo: string;
  tipoResposta: "texto" | "escolha";
  compartilhadaComEspecialista: boolean;
  opcoes: Array<{ valor: string; rotulo: string; descricao?: string; orientacao?: string }>;
};

export async function propor(_prev: PropostaState, formData: FormData): Promise<PropostaState> {
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

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profissional) redirect("/");

  // `publicado: false` / `statusModeracao: "pendente"` — mesmo padrão de
  // apps/cuida/app/biblioteca/nova/actions.ts::propor: sem setar explícito
  // aqui, a proposta entraria com os defaults da coluna (publicado=true,
  // aprovado), publicando sem moderação.
  const [experiencia] = await db
    .insert(experienciasGuiadas)
    .values({
      titulo,
      tipo,
      especialistaId: profissional.id,
      descricao,
      estimativaFormato: estimativaFormato || null,
      publicado: false,
      statusModeracao: "pendente",
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

  return { sucesso: true };
}
