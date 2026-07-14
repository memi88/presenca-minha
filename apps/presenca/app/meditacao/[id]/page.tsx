import { notFound, redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PainelPratica, rotaDePratica } from "../PainelPratica";

export default async function LeituraPratica({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  const { data: praticas } = await supabase
    .from("biblioteca")
    .select("id, titulo, slug, conteudo")
    .eq("tipo", "pratica")
    .eq("publicado", true)
    .order("created_at", { ascending: false });

  const praticaAtiva = praticas?.find((p) => p.id === id);
  if (!praticaAtiva) notFound();

  let jaGuardada = false;
  if (rotaDePratica(praticaAtiva) !== "/folego") {
    const { data } = await supabase
      .from("caderno_entradas")
      .select("id")
      .eq("paciente_id", user.id)
      .eq("biblioteca_ref_id", praticaAtiva.id)
      .maybeSingle();
    jaGuardada = !!data;
  }

  return (
    <PainelPratica
      variante="detalhe"
      nome={profile.nome}
      praticas={praticas ?? []}
      praticaAtiva={praticaAtiva}
      jaGuardada={jaGuardada}
    />
  );
}
