import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { FolegoExperiencia } from "./FolegoExperiencia";

export default async function Folego() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  // Sinal pro "continue de onde você parou" da Home (lib/menuHome.ts).
  await supabase.from("profiles").update({ ultimo_destino: "folego" }).eq("id", user.id);

  return <FolegoExperiencia nome={profile.nome} />;
}
