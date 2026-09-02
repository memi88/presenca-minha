// Gera as imagens-fonte do app mobile (ícone e splash) a partir do círculo
// oficial (docs/logo/circulo.svg) — mesma fonte de scripts/gerar-icones-pwa.mjs.
// @capacitor/assets usa esses dois arquivos pra gerar todos os tamanhos
// nativos de ícone/splash de iOS e Android.
// Uso: node scripts/gerar-assets-mobile.mjs && npx capacitor-assets generate
//
// O capacitor-assets também detecta um alvo "pwa" sozinho (não tem flag pra
// desligar) e escreve apps/presenca/icons/*.webp e
// apps/presenca/public/manifest.webmanifest — ambos conflitam com o que já
// existe (public/icons/ vindo de scripts/gerar-icones-pwa.mjs, e o
// manifest.webmanifest dinâmico de app/manifest.ts). Depois de rodar
// `capacitor-assets generate`, apague os dois:
//   rm -rf apps/presenca/icons apps/presenca/public/manifest.webmanifest
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const raiz = path.resolve(import.meta.dirname, "..");
const svgOrigem = path.join(raiz, "docs/logo/circulo.svg");
const destino = path.join(raiz, "apps/presenca/assets");

const CREME = "#fdf5e5";

async function main() {
  const svg = await readFile(svgOrigem);
  await mkdir(destino, { recursive: true });

  // Ícone: fundo sólido creme (iOS não aceita transparência no ícone
  // principal), círculo ocupando a maior parte do quadro.
  const icone = await sharp(svg, { density: 384 })
    .resize(820, 820, { fit: "contain", background: CREME })
    .extend({ top: 102, bottom: 102, left: 102, right: 102, background: CREME })
    .flatten({ background: CREME })
    .png()
    .toBuffer();
  await writeFile(path.join(destino, "icon.png"), icone);
  console.log("gerado assets/icon.png");

  // Splash: círculo pequeno e centralizado num quadro grande — o resto é
  // fundo creme puro, igual à tela de abertura do PWA.
  const splash = await sharp(svg, { density: 384 })
    .resize(420, 420, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const fundo = sharp({
    create: { width: 2732, height: 2732, channels: 4, background: CREME },
  });

  const splashFinal = await fundo
    .composite([{ input: splash, gravity: "center" }])
    .png()
    .toBuffer();
  await writeFile(path.join(destino, "splash.png"), splashFinal);
  console.log("gerado assets/splash.png");
}

main();
