"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

export async function registrarPresenca(momento: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const agora = new Date().toISOString();
  // ultima_visita_em precisa ser gravado aqui, não só na Home — a Home
  // redireciona pro check-in ANTES de chegar na própria atualização desse
  // campo, então sem isso a volta pra Home leria o valor velho de novo e
  // criaria um loop de redirect (ver lib/checkin.ts, precisaVisitaCheckin).
  await supabase
    .from("profiles")
    .update({ presenca_hoje: momento, presenca_hoje_em: agora, ultima_visita_em: agora })
    .eq("id", user.id);

  redirect("/home");
}
