import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@presenca/supabase", "@presenca/db"],
  // Default do Next é 1MB — bem abaixo do teto de 50MB que
  // packages/db/src/media.ts já valida pra upload de áudio/vídeo (ver
  // admin/biblioteca/[id]/editar e admin/experiencias-guiadas), causando
  // "Body exceeded 1 MB limit" (erro 500) em qualquer arquivo de mídia
  // real. 60mb dá margem pro overhead do multipart acima do teto de
  // 50MB de conteúdo.
  experimental: {
    serverActions: {
      bodySizeLimit: "60mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;

// Permite chamar getCloudflareContext() (usada pra ctx.waitUntil, ver
// lib/embed.ts) também em `next dev`, não só no Worker publicado.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
