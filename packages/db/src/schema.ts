import * as authSchema from "./auth.schema";
import * as businessSchema from "./business.schema";

// Esquema Drizzle combinado — usuário/sessão/conta do Better Auth
// (`auth.schema.ts`, normalmente gerado por `pnpm auth:generate`) + as
// tabelas de negócio da Fase 2 desta migração (`business.schema.ts` —
// perfis, vínculos, biblioteca, caderno etc., traduzidas das 34
// migrations reais do Supabase).
//
// `auth.schema.ts` tem 1 campo hoje que precisou ser adicionado à mão
// (`accounts.issuer`) — o gerador do `@better-auth/cli` está
// visivelmente atrás da versão do `better-auth` core (1.7.2): nem a
// versão estável (1.4.21) nem o beta mais novo (1.5.0-beta.13) sabiam
// gerar esse campo, só descoberto rodando de verdade e lendo o erro em
// runtime. Rodar `pnpm auth:generate` de novo depois de mudar a config
// SOBRESCREVE esse ajuste manual — conferir o diff antes de aceitar.
//
// Dois exports de propósito: `export *` repassa cada tabela como export
// nomeado no topo do módulo — é isso que o `drizzle-kit generate` escaneia
// pra achar as tabelas (introspecção estática, não entende um objeto
// aninhado). `schema` (objeto) é o que o cliente drizzle real usa em
// runtime (`drizzle(db, { schema })`, ver auth.ts).
export * from "./auth.schema";
export * from "./business.schema";

export const schema = {
  ...authSchema,
  ...businessSchema,
} as const;
