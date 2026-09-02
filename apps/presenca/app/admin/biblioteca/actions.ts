"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/home");

  return supabase;
}

export async function aprovar(id: string) {
  const supabase = await exigirAdmin();
  await supabase.from("biblioteca").update({ status_moderacao: "aprovado", publicado: true }).eq("id", id);
  revalidatePath("/admin/biblioteca");
}

export async function recusar(id: string, formData: FormData) {
  const supabase = await exigirAdmin();
  const motivo = String(formData.get("motivo") ?? "").trim();
  await supabase
    .from("biblioteca")
    .update({ status_moderacao: "recusado", publicado: false, motivo_recusa: motivo || null })
    .eq("id", id);
  revalidatePath("/admin/biblioteca");
}

export async function tirarDoAr(id: string) {
  const supabase = await exigirAdmin();
  await supabase.from("biblioteca").update({ publicado: false }).eq("id", id);
  revalidatePath("/admin/biblioteca");
}
