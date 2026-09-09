"use server";

import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { biblioteca, profissionais } from "@presenca/db/schema";
import { ArquivoInvalidoError, salvarImagem, salvarMidia } from "@presenca/db/media";

import { getDb } from "@/lib/db";
import { getMedia } from "@/lib/media";
import { getSessao } from "@/lib/sessao";
import { CATEGORIAS_PRATICA } from "@/lib/categoriasPratica";

export type PropostaState = { erro?: string; sucesso?: boolean };

const TIPOS_VALIDOS = ["pagina_livro_vivo", "pratica"] as const;
const ESCOPOS_VALIDOS = ["publico", "privado_profissional"] as const;
const CATEGORIAS_VALIDAS = CATEGORIAS_PRATICA.map((c) => c.valor);

export async function propor(_prev: PropostaState, formData: FormData): Promise<PropostaState> {
  const tipo = String(formData.get("tipo") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  const escopo = String(formData.get("escopo") ?? "");
  const categoria = String(formData.get("categoria") ?? "");
  const duracao = String(formData.get("duracao") ?? "").trim();
  const intencao = String(formData.get("intencao") ?? "").trim();

  if (!TIPOS_VALIDOS.includes(tipo as (typeof TIPOS_VALIDOS)[number])) {
    return { erro: "Escolha o tipo de conteúdo." };
  }
  if (!titulo) return { erro: "Diz o título." };
  if (!conteudo) return { erro: "Escreve o conteúdo." };
  if (!ESCOPOS_VALIDOS.includes(escopo as (typeof ESCOPOS_VALIDOS)[number])) {
    return { erro: "Escolha o alcance." };
  }
  // Categoria só se aplica a prática — página do Livro Vivo não usa.
  if (tipo === "pratica" && !CATEGORIAS_VALIDAS.includes(categoria as (typeof CATEGORIAS_VALIDAS)[number])) {
    return { erro: "Escolha a categoria da prática." };
  }

  const arquivo = formData.get("capa");
  if (arquivo instanceof File && arquivo.size > 0) {
    const tiposAceitos = ["image/jpeg", "image/png", "image/webp"];
    if (!tiposAceitos.includes(arquivo.type)) return { erro: "Capa: formato não aceito (JPEG, PNG ou WEBP)." };
    if (arquivo.size > 5 * 1024 * 1024) return { erro: "Capa: arquivo maior que 5MB." };
  }

  const arquivoMidia = formData.get("midia");
  if (arquivoMidia instanceof File && arquivoMidia.size > 0 && arquivoMidia.size > 50 * 1024 * 1024) {
    return { erro: "Conteúdo (áudio/vídeo): arquivo maior que 50MB." };
  }

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profissional) redirect("/");

  // `publicado: false` / `statusModeracao: "pendente"` substituem o
  // trigger `biblioteca_forca_pendente` (migration
  // fase11_biblioteca_colaborativa) — no Postgres ele forçava esses 2
  // valores em todo insert com profissional_autor_id preenchido (exceto
  // quando quem insere é admin), independente do que o insert mandasse.
  // D1/SQLite não tem esse trigger portado; sem setar explicitamente aqui,
  // a proposta entraria com os defaults da coluna (publicado=true,
  // aprovado) — publicaria sem moderação, exatamente o que o trigger
  // existia pra impedir.
  const [linha] = await db
    .insert(biblioteca)
    .values({
      tipo,
      titulo,
      conteudo,
      escopo,
      categoria: tipo === "pratica" ? categoria : null,
      duracao: tipo === "pratica" && duracao ? duracao : null,
      intencao: tipo === "pratica" && intencao ? intencao : null,
      profissionalAutorId: profissional.id,
      autor: null,
      publicado: false,
      statusModeracao: "pendente",
    })
    .returning({ id: biblioteca.id });

  // Capa e mídia são opcionais — se o upload falhar aqui, a proposta em
  // si já está gravada (não vale perder o conteúdo inteiro por causa de
  // um anexo).
  if (linha && arquivo instanceof File && arquivo.size > 0) {
    try {
      const media = await getMedia();
      const chave = await salvarImagem(media, `biblioteca/${linha.id}`, arquivo);
      await db.update(biblioteca).set({ capaChave: chave }).where(eq(biblioteca.id, linha.id));
    } catch (erro) {
      if (!(erro instanceof ArquivoInvalidoError)) {
        console.error("propor: falha ao gravar capa no R2", erro);
      }
    }
  }

  if (linha && tipo === "pratica" && arquivoMidia instanceof File && arquivoMidia.size > 0) {
    try {
      const media = await getMedia();
      const { chave, tipo: midiaTipo } = await salvarMidia(media, `biblioteca/${linha.id}/midia`, arquivoMidia);
      await db.update(biblioteca).set({ midiaChave: chave, midiaTipo }).where(eq(biblioteca.id, linha.id));
    } catch (erro) {
      if (!(erro instanceof ArquivoInvalidoError)) {
        console.error("propor: falha ao gravar mídia no R2", erro);
      }
    }
  }

  return { sucesso: true };
}
