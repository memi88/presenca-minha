#!/usr/bin/env node
// Gera SQL pronto pra cadastrar itens da `biblioteca`, com embedding já
// calculado. Não escreve no banco — só imprime o SQL. `biblioteca` não tem
// grant de insert pra authenticated/anon (PRD seção 4: escrita só via
// service_role, nunca client-side), então quem roda o INSERT de verdade é
// você, colando no SQL Editor.
//
// Uso:
//   IA_SERVICE_URL=... IA_SERVICE_API_KEY=... node scripts/cadastrar-biblioteca.mjs itens.json
//
// itens.json: array de objetos
//   { "tipo": "pagina_livro_vivo", "titulo": "...", "conteudo": "...",
//     "tags_momento_vida": ["confuso"], "tags_hd": [], "ambiente": "escuro",
//     "autor": "Guilherme", "publicado": true }

import { readFileSync } from "node:fs";

const url = process.env.IA_SERVICE_URL;
const chave = process.env.IA_SERVICE_API_KEY;
const arquivo = process.argv[2];

if (!url || !chave) {
  console.error("Defina IA_SERVICE_URL e IA_SERVICE_API_KEY (mesmos valores do .env.local do app).");
  process.exit(1);
}
if (!arquivo) {
  console.error("Uso: node scripts/cadastrar-biblioteca.mjs itens.json");
  process.exit(1);
}

const itens = JSON.parse(readFileSync(arquivo, "utf8"));

function sqlString(valor) {
  if (valor === undefined || valor === null) return "null";
  return `'${String(valor).replace(/'/g, "''")}'`;
}

function sqlArray(valores) {
  if (!valores?.length) return "'{}'";
  return `array[${valores.map((v) => sqlString(v)).join(",")}]`;
}

async function embed(texto) {
  const resposta = await fetch(`${url.replace(/\/$/, "")}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${chave}` },
    body: JSON.stringify({ texto, tipo: "passage" }),
  });
  if (!resposta.ok) throw new Error(`/embed respondeu ${resposta.status}`);
  const dados = await resposta.json();
  return dados.embedding;
}

const linhas = [];
for (const item of itens) {
  const vetor = await embed(item.conteudo);
  linhas.push(
    `insert into biblioteca (tipo, titulo, conteudo, tags_momento_vida, tags_hd, ambiente, autor, publicado, embedding) values (` +
      [
        sqlString(item.tipo),
        sqlString(item.titulo),
        sqlString(item.conteudo),
        sqlArray(item.tags_momento_vida),
        sqlArray(item.tags_hd),
        sqlString(item.ambiente ?? "escuro"),
        sqlString(item.autor ?? "Guilherme"),
        item.publicado === false ? "false" : "true",
        `'[${vetor.join(",")}]'::vector(384)`,
      ].join(", ") +
      `);`,
  );
}

console.log(linhas.join("\n\n"));
