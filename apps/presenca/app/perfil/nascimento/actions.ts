"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

export type SalvarNascimentoState = { erro?: string };

export async function salvarNascimento(
  _prev: SalvarNascimentoState,
  formData: FormData,
): Promise<SalvarNascimentoState> {
  const data = String(formData.get("data") ?? "").trim();
  const hora = String(formData.get("hora") ?? "").trim();
  const local = String(formData.get("local") ?? "").trim();

  if (!data) {
    return { erro: "Precisamos ao menos da data." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { error } = await supabase
    .from("profiles")
    .update({
      data_nascimento: data,
      hora_nascimento: hora || null,
      local_nascimento: local || null,
    })
    .eq("id", user.id);
  if (error) return { erro: error.message };

  redirect("/perfil");
}
