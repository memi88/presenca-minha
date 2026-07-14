import type { MetadataRoute } from "next";

// Paleta fixa da marca (docs/logo) — âmbar #c99a4a, creme #fdf5e5, marrom
// #2a2216. Ícones gerados a partir do círculo (scripts/gerar-icones-pwa.mjs,
// fonte docs/logo/circulo.svg) em apps/presenca/public/icons/.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Presença",
    short_name: "Presença",
    description: "Um lugar tranquilo para se encontrar.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf5e5",
    theme_color: "#2a2216",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
