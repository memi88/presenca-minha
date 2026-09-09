import { notFound, redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";
import { biblioteca, cadernoEntradas, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { ehPraticaInterativa, PainelPratica, type ItemPratica } from "../PainelPratica";

// `categoria` só serve pra preservar o filtro ativo da grade no link de
// voltar (TelaDetalhe em PainelPratica.tsx) — nunca filtra a prática em
// si, uma prática aberta direto sempre abre igual. Mesmo padrão de
// confiança de app/praticas/page.tsx (sem validação contra
// CATEGORIAS_PRATICA — um valor inválido só faria o link de volta cair
// numa categoria vazia, sem quebrar nada).
export default async function LeituraPratica({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { id } = await params;
  const { categoria } = await searchParams;
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true, nome: true, profissionalId: true },
  });
  if (!profile?.nome) redirect("/chegada");

  const praticaAtiva = await db.query.biblioteca.findFirst({
    where: and(eq(biblioteca.id, id), eq(biblioteca.tipo, "pratica"), eq(biblioteca.publicado, true)),
    columns: {
      id: true,
      titulo: true,
      slug: true,
      conteudo: true,
      categoria: true,
      capaChave: true,
      duracao: true,
      intencao: true,
      midiaChave: true,
      midiaTipo: true,
      profissionalAutorId: true,
    },
    with: { profissionalAutor: { columns: { nome: true, tipo: true, formaDeTrabalho: true } } },
  });
  if (!praticaAtiva) notFound();

  let jaGuardada = false;
  if (!ehPraticaInterativa(praticaAtiva)) {
    const entrada = await db.query.cadernoEntradas.findFirst({
      where: and(eq(cadernoEntradas.pacienteId, profile.id), eq(cadernoEntradas.bibliotecaRefId, praticaAtiva.id)),
      columns: { id: true },
    });
    jaGuardada = !!entrada;
  }

  return (
    <PainelPratica
      praticaAtiva={praticaAtiva}
      jaGuardada={jaGuardada}
      mostrarCtaConectar={!profile.profissionalId}
      categoriaAtiva={categoria ?? null}
    />
  );
}
