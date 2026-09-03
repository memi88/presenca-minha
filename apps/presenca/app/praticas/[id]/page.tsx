import { notFound, redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { ehPraticaInterativa, PainelPratica, type ItemPratica } from "../PainelPratica";

export default async function LeituraPratica({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, intro_praticas_vista_em, profissional_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  const primeiraEntrada = !profile.intro_praticas_vista_em;
  if (primeiraEntrada) {
    await supabase.from("profiles").update({ intro_praticas_vista_em: new Date().toISOString() }).eq("id", user.id);
  }

  const { data: praticas } = await supabase
    .from("biblioteca")
    .select(
      "id, titulo, slug, conteudo, profissional_autor_id, profissionais:profissional_autor_id(nome, tipo, forma_de_trabalho)",
    )
    .eq("tipo", "pratica")
    .eq("publicado", true)
    .order("created_at", { ascending: false })
    .returns<ItemPratica[]>();

  const praticaAtiva = praticas?.find((p) => p.id === id);
  if (!praticaAtiva) notFound();

  let jaGuardada = false;
  if (!ehPraticaInterativa(praticaAtiva)) {
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
      introExpandidaInicialmente={primeiraEntrada}
      mostrarCtaConectar={!profile.profissional_id}
    />
  );
}
