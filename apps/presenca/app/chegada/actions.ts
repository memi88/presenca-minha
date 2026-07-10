"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

export async function salvarNome(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Sem trigger de auto-criação (decisão da Fase 0): esta é a primeira
  // escrita em `profiles`, por isso upsert em vez de update.
  const { error } = await supabase.from("profiles").upsert({ id: user.id, nome });
  if (error) throw error;

  redirect("/home");
}
