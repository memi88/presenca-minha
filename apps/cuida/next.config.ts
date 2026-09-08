import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@presenca/supabase", "@presenca/db"],
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

// Permite chamar getCloudflareContext() (usada por lib/auth.ts pro
// binding D1) também em `next dev`, não só no Worker publicado — mesma
// linha de apps/presenca/next.config.ts, só que aqui esse binding ainda
// não existia antes do Better Auth (migração Supabase→Cloudflare).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
