import { notFound, redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";
import { biblioteca, cadernoEntradas, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { momentoValido } from "@/lib/momentosVida";

import { PainelLeitura } from "../PainelLeitura";

// `momento` só serve pra preservar o filtro ativo do acervo no link de
// voltar (TelaDetalhe em PainelLeitura.tsx) — nunca é usado pra filtrar a
// leitura em si, uma página aberta direto sempre abre igual.
export default async function LeituraLivroVivo({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ momento?: string }>;
}) {
  const { id } = await params;
  const { momento } = await searchParams;
  const momentoAtivo = momentoValido(momento);
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true, nome: true, profissionalId: true },
  });
  if (!profile?.nome) redirect("/chegada");

  const paginaAtiva = await db.query.biblioteca.findFirst({
    where: and(eq(biblioteca.id, id), eq(biblioteca.tipo, "pagina_livro_vivo"), eq(biblioteca.publicado, true)),
    columns: { id: true, titulo: true, conteudo: true, profissionalAutorId: true },
    with: { profissionalAutor: { columns: { nome: true, tipo: true, formaDeTrabalho: true } } },
  });
  if (!paginaAtiva) notFound();

  const jaGuardada = await db.query.cadernoEntradas.findFirst({
    where: and(eq(cadernoEntradas.pacienteId, profile.id), eq(cadernoEntradas.bibliotecaRefId, paginaAtiva.id)),
    columns: { id: true },
  });

  return (
    <PainelLeitura
      paginaAtiva={paginaAtiva}
      jaGuardada={!!jaGuardada}
      mostrarCtaConectar={!profile.profissionalId}
      momentoAtivo={momentoAtivo}
    />
  );
}
