"use server";

import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { pacientesPreCadastro, profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

export type PreCadastroState = { erro?: string; link?: string; nome?: string };

export async function preCadastrarPaciente(
  _prev: PreCadastroState,
  formData: FormData,
): Promise<PreCadastroState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const caracteristicas = String(formData.get("caracteristicas") ?? "").trim();
  const anotacoes = String(formData.get("anotacoes") ?? "").trim();

  if (!nome) return { erro: "Diz o nome do paciente." };

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profissional) redirect("/");

  const [registro] = await db
    .insert(pacientesPreCadastro)
    .values({
      profissionalId: profissional.id,
      nome,
      caracteristicas: caracteristicas || null,
      anotacoes: anotacoes || null,
    })
    .returning({ tokenConvite: pacientesPreCadastro.tokenConvite });

  if (!registro) {
    return { erro: "Não foi possível criar o pré-cadastro agora." };
  }

  const base = process.env.NEXT_PUBLIC_PRESENCA_URL ?? "";
  return { link: `${base}/convite/${registro.tokenConvite}`, nome };
}
