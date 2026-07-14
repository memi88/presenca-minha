#!/usr/bin/env node
// Recalcula o embedding de itens da `biblioteca` que ainda estão com
// embedding = null — hoje é o caso da página semente do Livro Vivo,
// cadastrada antes do services/ia estar no ar (ver
// scripts/cadastrar-biblioteca.mjs, mesmo fallback gracioso).
//
// Usa service_role pra ignorar RLS: `biblioteca` não tem grant de
// insert/update pra authenticated/anon, só service_role escreve lá (mesmo
// espírito de scripts/cadastrar-profissional.mjs) — por isso este script
// roda só localmente, com a sua própria chave, nunca por um agente de IA.
//
// Uso:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   IA_SERVICE_URL=... IA_SERVICE_API_KEY=... \
//     node scripts/recalcular-embeddings-biblioteca.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const iaUrl = process.env.IA_SERVICE_URL;
const iaChave = process.env.IA_SERVICE_API_KEY;

if (!url || !serviceRoleKey) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (Project Settings > API).");
  process.exit(1);
}
if (!iaUrl || !iaChave) {
  console.error("Defina IA_SERVICE_URL e IA_SERVICE_API_KEY — o serviço precisa estar no ar pra calcular embedding.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function embed(texto) {
  const resposta = await fetch(`${iaUrl.replace(/\/$/, "")}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${iaChave}` },
    body: JSON.stringify({ texto, tipo: "passage" }),
  });
  if (!resposta.ok) throw new Error(`/embed respondeu ${resposta.status}`);
  const dados = await resposta.json();
  return dados.embedding;
}

const { data: itens, error } = await supabase.from("biblioteca").select("id, titulo, conteudo").is("embedding", null);

if (error) {
  console.error("Falha ao buscar itens:", error.message);
  process.exit(1);
}

if (!itens?.length) {
  console.log("Nenhum item com embedding = null. Nada a fazer.");
  process.exit(0);
}

console.log(`${itens.length} item(ns) com embedding = null. Recalculando...`);

for (const item of itens) {
  try {
    const vetor = await embed(item.conteudo);
    const { error: erroUpdate } = await supabase.from("biblioteca").update({ embedding: vetor }).eq("id", item.id);
    if (erroUpdate) {
      console.error(`❌ ${item.titulo}: ${erroUpdate.message}`);
    } else {
      console.log(`✅ ${item.titulo}`);
    }
  } catch (erro) {
    console.error(`❌ ${item.titulo}: ${erro.message}`);
  }
}
