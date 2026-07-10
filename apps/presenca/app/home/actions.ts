"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@presenca/supabase/server";

const DIAS_ATE_PROXIMO_CONVITE = 7;

// Convite de conversão "gentil e recorrente" (checklist Fase 1) — dispensar
// não silencia pra sempre, só adia. Nada de insistência a cada visita,
// nada de nunca mais perguntar.
export async function adiarConversao() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const proximoConvite = new Date();
  proximoConvite.setDate(proximoConvite.getDate() + DIAS_ATE_PROXIMO_CONVITE);

  await supabase
    .from("profiles")
    .update({ lembrete_conversao_em: proximoConvite.toISOString() })
    .eq("id", user.id);

  revalidatePath("/home");
}
