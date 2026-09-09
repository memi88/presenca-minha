"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { admins, biblioteca } from "@presenca/db/schema";
import { ArquivoInvalidoError, apagarImagem, salvarImagem, salvarMidia } from "@presenca/db/media";

import { getDb } from "@/lib/db";
import { getMedia } from "@/lib/media";
import { getSessao } from "@/lib/sessao";
import { CATEGORIAS_PRATICA } from "@/lib/categoriasPratica";

export type EditarConteudoState = { erro?: string };

const CATEGORIAS_VALIDAS = CATEGORIAS_PRATICA.map((c) => c.valor);

async function exigirAdmin() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const db = await getDb();
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, sessao.user.id) });
  if (!admin) redirect("/home");

  return db;
}

export async function editarConteudo(
  id: string,
  _prev: EditarConteudoState,
  formData: FormData,
): Promise<EditarConteudoState> {
  const db = await exigirAdmin();

  const item = await db.query.biblioteca.findFirst({ where: eq(biblioteca.id, id), columns: { id: true, tipo: true, capaChave: true, midiaChave: true } });
  if (!item) return { erro: "Item não encontrado." };

  const titulo = String(formData.get("titulo") ?? "").trim();
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "");
  const duracao = String(formData.get("duracao") ?? "").trim();
  const intencao = String(formData.get("intencao") ?? "").trim();

  if (!titulo) return { erro: "Diz o título." };
  if (!conteudo) return { erro: "Escreve o conteúdo." };
  if (item.tipo === "pratica" && !CATEGORIAS_VALIDAS.includes(categoria as (typeof CATEGORIAS_VALIDAS)[number])) {
    return { erro: "Escolha a categoria da prática." };
  }

  const arquivoCapa = formData.get("capa");
  if (arquivoCapa instanceof File && arquivoCapa.size > 0) {
    const tiposAceitos = ["image/jpeg", "image/png", "image/webp"];
    if (!tiposAceitos.includes(arquivoCapa.type)) return { erro: "Capa: formato não aceito (JPEG, PNG ou WEBP)." };
    if (arquivoCapa.size > 5 * 1024 * 1024) return { erro: "Capa: arquivo maior que 5MB." };
  }
  const arquivoMidia = formData.get("midia");
  if (arquivoMidia instanceof File && arquivoMidia.size > 0 && arquivoMidia.size > 50 * 1024 * 1024) {
    return { erro: "Conteúdo (áudio/vídeo): arquivo maior que 50MB." };
  }

  await db
    .update(biblioteca)
    .set({
      titulo,
      conteudo,
      categoria: item.tipo === "pratica" ? categoria : null,
      duracao: item.tipo === "pratica" && duracao ? duracao : null,
      intencao: item.tipo === "pratica" && intencao ? intencao : null,
    })
    .where(eq(biblioteca.id, id));

  // Capa/mídia são opcionais — trocar só quando um arquivo novo vem
  // preenchido (mesmo padrão gracioso do cadastro: falha no upload não
  // desfaz a edição do resto dos campos, que já foi salva acima).
  if (arquivoCapa instanceof File && arquivoCapa.size > 0) {
    try {
      const media = await getMedia();
      const chave = await salvarImagem(media, `biblioteca/${id}`, arquivoCapa);
      await db.update(biblioteca).set({ capaChave: chave }).where(eq(biblioteca.id, id));
      await apagarImagem(media, item.capaChave);
    } catch (erro) {
      if (!(erro instanceof ArquivoInvalidoError)) console.error("editarConteudo: falha ao gravar capa no R2", erro);
    }
  }

  if (item.tipo === "pratica" && arquivoMidia instanceof File && arquivoMidia.size > 0) {
    try {
      const media = await getMedia();
      const { chave, tipo: midiaTipo } = await salvarMidia(media, `biblioteca/${id}/midia`, arquivoMidia);
      await db.update(biblioteca).set({ midiaChave: chave, midiaTipo }).where(eq(biblioteca.id, id));
      await apagarImagem(media, item.midiaChave);
    } catch (erro) {
      if (!(erro instanceof ArquivoInvalidoError)) console.error("editarConteudo: falha ao gravar mídia no R2", erro);
    }
  }

  revalidatePath("/admin/biblioteca");
  redirect("/admin/biblioteca");
}
