import { notFound, redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PainelLeitura, type ItemPagina } from "../PainelLeitura";

export default async function LeituraLivroVivo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, intro_livro_vivo_vista_em, profissional_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  const primeiraEntrada = !profile.intro_livro_vivo_vista_em;
  if (primeiraEntrada) {
    await supabase
      .from("profiles")
      .update({ intro_livro_vivo_vista_em: new Date().toISOString() })
      .eq("id", user.id);
  }

  const { data: paginas } = await supabase
    .from("biblioteca")
    .select("id, titulo, conteudo, profissional_autor_id, profissionais:profissional_autor_id(nome, tipo, forma_de_trabalho)")
    .eq("tipo", "pagina_livro_vivo")
    .order("created_at", { ascending: false })
    .returns<ItemPagina[]>();

  const paginaAtiva = paginas?.find((p) => p.id === id);
  if (!paginaAtiva) notFound();

  const { data: jaGuardada } = await supabase
    .from("caderno_entradas")
    .select("id")
    .eq("paciente_id", user.id)
    .eq("biblioteca_ref_id", paginaAtiva.id)
    .maybeSingle();

  return (
    <PainelLeitura
      variante="detalhe"
      nome={profile.nome}
      paginas={paginas ?? []}
      paginaAtiva={paginaAtiva}
      jaGuardada={!!jaGuardada}
      introExpandidaInicialmente={primeiraEntrada}
      mostrarCtaConectar={!profile.profissional_id}
    />
  );
}
