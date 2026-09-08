import { defineConfig } from "drizzle-kit";

// Só gera o diff de SQL (schema → migração) — aplicar de verdade é
// `pnpm db:migrate:local`/`db:migrate:remote` (wrangler, ver
// wrangler.jsonc deste pacote), não `drizzle-kit push`/`migrate`. Evita
// precisar de um token de API da Cloudflare só pra rodar migration.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./migrations",
});
