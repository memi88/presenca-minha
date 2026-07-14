import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@presenca/supabase"],
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
