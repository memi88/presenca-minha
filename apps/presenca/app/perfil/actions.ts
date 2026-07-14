"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
