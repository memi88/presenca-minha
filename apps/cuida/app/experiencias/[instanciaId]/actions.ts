"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, desc, eq } from "drizzle-orm";
import {
  experienciasDevolutivas,
  experienciasEtapas,
  experienciasInstancias,
  experienciasRespostas,
  profissionais,
} from "@presenca/db/schema";
import { avancarEtapa } from "@presenca/db/experiencias";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

export type DevolutivaState = { erro?: string };

// Autorização: instância precisa pertencer a uma experiência deste
// especialista — checagem explícita (D1 não tem RLS), mesmo padrão de
// `vinculo` em apps/cuida/app/pacientes/[id]/actions.ts.
async function resolverInstanciaDoEspecialista(instanciaId: string) {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profissional) redirect("/");

  const instancia = await db.query.experienciasInstancias.findFirst({
    where: eq(experienciasInstancias.id, instanciaId),
    with: { experiencia: { columns: { id: true, especialistaId: true } } },
  });
  if (!instancia || instancia.experiencia.especialistaId !== profissional.id) redirect("/experiencias");

  return { db, instancia, profissional };
}

export async function liberarProximaEtapa(instanciaId: string) {
  const { db, instancia } = await resolverInstanciaDoEspecialista(instanciaId);
  if (instancia.estado !== "aguardando_especialista" || !instancia.etapaAtualId) redirect(`/experiencias/${instanciaId}`);

  const etapaAtual = await db.query.experienciasEtapas.findFirst({ where: eq(experienciasEtapas.id, instancia.etapaAtualId) });
  if (!etapaAtual) redirect(`/experiencias/${instanciaId}`);

  // Se a etapa liberada foi de múltipla escolha, a ramificação (quando
  // existe) precisa da mesma escolha que a pessoa fez — sem isso,
  // `avancarEtapa` cairia sempre no próximo `ordem`, ignorando a
  // ramificação configurada pra esse valor.
  let escolhaFeita: string | undefined;
  if (etapaAtual.tipoResposta === "escolha") {
    const resposta = await db.query.experienciasRespostas.findFirst({
      where: and(eq(experienciasRespostas.instanciaId, instanciaId), eq(experienciasRespostas.etapaId, etapaAtual.id)),
      orderBy: desc(experienciasRespostas.respondidoEm),
    });
    if (resposta) {
      try {
        escolhaFeita = (JSON.parse(resposta.conteudo) as { escolha?: string }).escolha;
      } catch {
        escolhaFeita = undefined;
      }
    }
  }

  await avancarEtapa(db, instanciaId, etapaAtual, escolhaFeita);
  revalidatePath("/experiencias");
  redirect("/experiencias");
}

export async function escreverDevolutiva(
  instanciaId: string,
  _prev: DevolutivaState,
  formData: FormData,
): Promise<DevolutivaState> {
  const { db, instancia, profissional } = await resolverInstanciaDoEspecialista(instanciaId);
  if (instancia.estado !== "aguardando_especialista") return { erro: "Esta instância não está aguardando ação." };

  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!conteudo) return { erro: "Escreve a devolutiva." };

  await db.insert(experienciasDevolutivas).values({ instanciaId, especialistaId: profissional.id, conteudo });
  await db
    .update(experienciasInstancias)
    .set({ estado: "concluida", concluidoEm: new Date() })
    .where(eq(experienciasInstancias.id, instanciaId));

  revalidatePath("/experiencias");
  redirect("/experiencias");
}
