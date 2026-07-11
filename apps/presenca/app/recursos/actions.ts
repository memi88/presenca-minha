"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

export async function avisarProfissional() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("profissional_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.profissional_id) redirect("/recursos");

  await supabase
    .from("alertas_risco")
    .insert({ paciente_id: user.id, profissional_id: profile.profissional_id });

  redirect("/recursos");
}
