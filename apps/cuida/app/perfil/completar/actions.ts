"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { TIPOS_PROFISSIONAL } from "@/lib/tiposProfissional";

export type CompletarPerfilState = { erro?: string };

export async function completarPerfil(_prev: CompletarPerfilState, formData: FormData): Promise<CompletarPerfilState> {
  const tipo = String(formData.get("tipo") ?? "");
  const formaDeTrabalho = String(formData.get("forma_de_trabalho") ?? "").trim();
  const usaLinguagensSimbolicas = formData.get("usa_linguagens_simbolicas") === "on";
  const nextRaw = String(formData.get("next") ?? "/pacientes");
  const next = nextRaw.startsWith("/") ? nextRaw : "/pacientes";

  if (!TIPOS_PROFISSIONAL.includes(tipo as (typeof TIPOS_PROFISSIONAL)[number])) {
    return { erro: "Escolha sua abordagem." };
  }
  if (tipo === "Outra" && !formaDeTrabalho) {
    return { erro: "Descreve rapidamente sua abordagem." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { error } = await supabase
    .from("profissionais")
    .update({
      tipo,
      forma_de_trabalho: tipo === "Outra" ? formaDeTrabalho : null,
      usa_linguagens_simbolicas: usaLinguagensSimbolicas,
    })
    .eq("user_id", user.id);
  if (error) return { erro: error.message };

  redirect(next);
}
