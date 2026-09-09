"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";
import { biblioteca, cadernoEntradas, profissionais, vinculos } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { calcularEmbedding } from "@/lib/embed";
import { podeCalcularEmbedding } from "@/lib/rateLimit";

export type EscreverEntradaState = { erro?: string; sucesso?: boolean };

const TIPOS_COM_REFERENCIA = new Set(["pratica_indicada", "pagina_indicada"]);
const TIPO_BIBLIOTECA_ESPERADO: Record<string, string> = {
  pratica_indicada: "pratica",
  pagina_indicada: "pagina_livro_vivo",
};

export async function escreverEntrada(
  pacienteId: string,
  _prev: EscreverEntradaState,
  formData: FormData,
): Promise<EscreverEntradaState> {
  const tipo = String(formData.get("tipo") ?? "reflexao");
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  const bibliotecaRefId = String(formData.get("biblioteca_ref_id") ?? "").trim() || null;
  const precisaReferencia = TIPOS_COM_REFERENCIA.has(tipo);

  if (precisaReferencia && !bibliotecaRefId) {
    return { erro: "Escolha qual prática ou página você quer indicar." };
  }
  if (!precisaReferencia && !conteudo) return { erro: "Escreva alguma coisa antes de enviar." };

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profissional) redirect("/");

  // Substitui a policy de insert antiga ("paciente vinculado") — sem essa
  // checagem explícita, um profissional autenticado poderia escrever no
  // caderno de qualquer paciente só adivinhando o id.
  const vinculo = await db.query.vinculos.findFirst({
    where: and(
      eq(vinculos.profissionalId, profissional.id),
      eq(vinculos.pacienteId, pacienteId),
      eq(vinculos.ativo, true),
    ),
    columns: { pacienteId: true },
  });
  if (!vinculo) {
    return { erro: "Esse paciente não está mais vinculado a você." };
  }

  // Confere que a referência escolhida existe, está publicada e é do tipo
  // certo (prática pra "prática indicada", página do Livro Vivo pra
  // "página indicada") — o <select> do form já filtra isso, mas o form
  // pode ser manipulado, então confere de novo aqui.
  if (precisaReferencia && bibliotecaRefId) {
    const item = await db.query.biblioteca.findFirst({
      where: and(eq(biblioteca.id, bibliotecaRefId), eq(biblioteca.publicado, true)),
      columns: { tipo: true },
    });
    if (!item || item.tipo !== TIPO_BIBLIOTECA_ESPERADO[tipo]) {
      return { erro: "Essa indicação não é válida — escolha de novo." };
    }
  }

  // Mesmo padrão do Presença (apps/presenca/app/diario/actions.ts): não
  // trava a escrita se o serviço de embedding ainda não estiver no ar, nem
  // se o limite de uso do usuário estourou. Sem conteúdo (indicação sem
  // nota), não tem o que gerar embedding — fica nulo mesmo.
  const permitido = conteudo && (await podeCalcularEmbedding(db, sessao.user.id));
  const embedding = permitido ? await calcularEmbedding(conteudo, "passage") : null;

  await db.insert(cadernoEntradas).values({
    pacienteId,
    autorTipo: "profissional",
    autorProfissionalId: profissional.id,
    tipo,
    conteudo,
    bibliotecaRefId,
    embedding,
  });

  revalidatePath(`/pacientes/${pacienteId}`);
  return { sucesso: true };
}
