"use server";

import { revalidatePath } from "next/cache";

import { and, eq } from "drizzle-orm";
import { lenteReacoes, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { dataCivilHoje } from "@/lib/present";

export type Reacao = "gostei" | "nao_gostei";

// Clicar de novo na mesma reação que já estava marcada desfaz (upsert vira
// delete) — mesmo gesto de "curtir de novo pra descurtir" já esperado
// nesse tipo de botão. Uma linha por pessoa por dia civil
// (chave composta paciente_id+data) — a reflexão é a mesma pra todo
// mundo no dia, então não faz sentido mais de uma reação por dia.
export async function reagirLente(reacao: Reacao) {
  const sessao = await getSessao();
  if (!sessao) return;

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profile) return;

  const data = dataCivilHoje();
  const condicao = and(eq(lenteReacoes.pacienteId, profile.id), eq(lenteReacoes.data, data));

  const atual = await db.query.lenteReacoes.findFirst({ where: condicao, columns: { reacao: true } });

  if (atual?.reacao === reacao) {
    await db.delete(lenteReacoes).where(condicao);
  } else {
    await db
      .insert(lenteReacoes)
      .values({ pacienteId: profile.id, data, reacao })
      .onConflictDoUpdate({ target: [lenteReacoes.pacienteId, lenteReacoes.data], set: { reacao } });
  }

  revalidatePath("/lente-do-dia");
}
