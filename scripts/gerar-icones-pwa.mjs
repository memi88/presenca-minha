// Gera os ícones PNG do PWA (manifest.ts) e o apple-icon a partir do
// círculo oficial (docs/logo/circulo.svg) — one-off, roda uma vez só.
// Uso: node scripts/gerar-icones-pwa.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const raiz = path.resolve(import.meta.dirname, "..");
const svgOrigem = path.join(raiz, "docs/logo/circulo.svg");
const destinoIcones = path.join(raiz, "apps/presenca/public/icons");

async function main() {
  const svg = await readFile(svgOrigem);
  await mkdir(destinoIcones, { recursive: true });

  const tamanhos = [
    { nome: "icon-192.png", tamanho: 192 },
    { nome: "icon-512.png", tamanho: 512 },
  ];

  for (const { nome, tamanho } of tamanhos) {
    const buffer = await sharp(svg, { density: 384 })
      .resize(tamanho, tamanho, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await writeFile(path.join(destinoIcones, nome), buffer);
    console.log("gerado", nome);
  }

  // apple-icon precisa ficar em apps/presenca/app/ (convenção do Next.js) e
  // não pode ter transparência (iOS não lida bem com isso) — fundo creme.
  const appleBuffer = await sharp(svg, { density: 384 })
    .resize(180, 180, { fit: "contain", background: "#fdf5e5" })
    .flatten({ background: "#fdf5e5" })
    .png()
    .toBuffer();
  await writeFile(path.join(raiz, "apps/presenca/app/apple-icon.png"), appleBuffer);
  console.log("gerado apple-icon.png");
}

main();
