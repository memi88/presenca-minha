"use server";

import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profissional) redirect("/");

  // publicado/status_moderacao não são setados aqui — o trigger
  // biblioteca_forca_pendente (migration fase11_biblioteca_colaborativa)
  // sempre força pendente/despublicado pra insert com profissional_autor_id
  // preenchido, exceto quando quem insere é admin.
  const { error } = await supabase.from("biblioteca").insert({
    tipo,
    titulo,
    conteudo,
    escopo,
    categoria: tipo === "pratica" ? categoria : null,
    profissional_autor_id: profissional.id,
    autor: null,
  });

  if (error) return { erro: error.message };

  return { sucesso: true };
}
