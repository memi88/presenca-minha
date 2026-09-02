"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

export type PreCadastroState = { erro?: string; link?: string; nome?: string };

export async function preCadastrarPaciente(
  _prev: PreCadastroState,
  formData: FormData,
): Promise<PreCadastroState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const caracteristicas = String(formData.get("caracteristicas") ?? "").trim();
  const anotacoes = String(formData.get("anotacoes") ?? "").trim();

  if (!nome) return { erro: "Diz o nome do paciente." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profissional) redirect("/");

  const { data, error } = await supabase
    .from("pacientes_pre_cadastro")
    .insert({
      profissional_id: profissional.id,
      nome,
      caracteristicas: caracteristicas || null,
      anotacoes: anotacoes || null,
    })
    .select("token_convite")
    .single();

  if (error || !data) {
    return { erro: error?.message ?? "Não foi possível criar o pré-cadastro agora." };
  }

  const base = process.env.NEXT_PUBLIC_PRESENCA_URL ?? "";
  return { link: `${base}/convite/${data.token_convite}`, nome };
}
