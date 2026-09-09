"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";
import {
  experienciasConsentimentos,
  experienciasEtapas,
  experienciasInstancias,
  experienciasRespostas,
  profiles,
} from "@presenca/db/schema";
import { avancarEtapa } from "@presenca/db/experiencias";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

export type ResponderEtapaState = { erro?: string };

// Resolve a instância + garante que pertence à sessão atual — mesmo
// padrão de checagem explícita usado em toda tabela sem RLS do D1.
async function resolverInstanciaDoPaciente(instanciaId: string) {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) redirect("/chegada");

  const instancia = await db.query.experienciasInstancias.findFirst({
    where: and(eq(experienciasInstancias.id, instanciaId), eq(experienciasInstancias.pacienteId, profile.id)),
    with: { experiencia: { columns: { tipo: true } } },
  });
  if (!instancia) redirect("/experiencias");

  return { db, instancia };
}

export async function consentir(instanciaId: string) {
  const { db, instancia } = await resolverInstanciaDoPaciente(instanciaId);
  if (instancia.experiencia.tipo !== "acompanhada") redirect(`/experiencias/instancia/${instanciaId}`);

  const existente = await db.query.experienciasConsentimentos.findFirst({
    where: eq(experienciasConsentimentos.instanciaId, instanciaId),
  });

  if (existente) {
    await db
      .update(experienciasConsentimentos)
      .set({ consentido: true, consentidoEm: new Date(), revogadoEm: null })
      .where(eq(experienciasConsentimentos.instanciaId, instanciaId));
  } else {
    await db
      .insert(experienciasConsentimentos)
      .values({ instanciaId, consentido: true, consentidoEm: new Date() });
  }

  revalidatePath(`/experiencias/instancia/${instanciaId}`);
}

export async function responderEtapa(
  instanciaId: string,
  _prev: ResponderEtapaState,
  formData: FormData,
): Promise<ResponderEtapaState> {
  const { db, instancia } = await resolverInstanciaDoPaciente(instanciaId);

  if (instancia.estado !== "em_andamento" || !instancia.etapaAtualId) {
    return { erro: "Esta etapa não está mais disponível pra responder." };
  }

  const etapaAtual = await db.query.experienciasEtapas.findFirst({
    where: eq(experienciasEtapas.id, instancia.etapaAtualId),
  });
  if (!etapaAtual) return { erro: "Etapa não encontrada." };

  // Gate de consentimento: etapa compartilhada só aceita resposta com
  // consentimento ativo pra esta instância — regra do PRD (princípio 3),
  // nunca herdado de outro consentimento.
  if (etapaAtual.compartilhadaComEspecialista) {
    const consentimento = await db.query.experienciasConsentimentos.findFirst({
      where: eq(experienciasConsentimentos.instanciaId, instanciaId),
    });
    if (!consentimento?.consentido || consentimento.revogadoEm) {
      return { erro: "Precisa concordar com o acompanhamento antes de responder esta etapa." };
    }
  }

  let conteudo: string;
  let escolhaFeita: string | undefined;
  if (etapaAtual.tipoResposta === "escolha") {
    const escolha = String(formData.get("escolha") ?? "").trim();
    if (!escolha) return { erro: "Escolha uma opção." };
    const nota = String(formData.get("nota") ?? "").trim();
    conteudo = JSON.stringify({ escolha, nota: nota || null });
    escolhaFeita = escolha;
  } else {
    const resposta = String(formData.get("resposta") ?? "").trim();
    if (!resposta) return { erro: "Escreve alguma coisa antes de continuar." };
    conteudo = resposta;
  }

  await db.insert(experienciasRespostas).values({ instanciaId, etapaId: etapaAtual.id, conteudo });

  if (etapaAtual.compartilhadaComEspecialista) {
    // Especialista decide o ritmo daqui — a pessoa fica esperando até ele
    // liberar a próxima etapa (fila em apps/cuida/app/experiencias).
    await db
      .update(experienciasInstancias)
      .set({ estado: "aguardando_especialista" })
      .where(eq(experienciasInstancias.id, instanciaId));
    revalidatePath(`/experiencias/instancia/${instanciaId}`);
    return {};
  }

  await avancarEtapa(db, instanciaId, etapaAtual, escolhaFeita);
  revalidatePath(`/experiencias/instancia/${instanciaId}`);
  return {};
}
