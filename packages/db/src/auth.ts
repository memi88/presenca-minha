import type { D1Database } from "@cloudflare/workers-types";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins/anonymous";
import { magicLink } from "better-auth/plugins/magic-link";
import { withCloudflare } from "better-auth-cloudflare";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import { profiles, profissionais } from "./business.schema";
import { schema } from "./schema";

export type AuthEnv = {
  DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

/**
 * Fábrica do Better Auth — compartilhada entre Presença e Cuida (mesmo D1,
 * mesma tabela de usuário; um profissional e um paciente são a mesma
 * linha em `user`, distinguidos por `profissionais.user_id`, igual ao
 * Supabase Auth de antes).
 *
 * `env` vem de `getCloudflareContext()`, chamado por cada app dentro do
 * próprio Route Handler (`app/api/auth/[...all]/route.ts`) — nunca
 * importado direto daqui, porque só existe dentro de uma requisição real
 * do Worker. Sem `env` (chamada do CLI `better-auth generate`, que roda
 * em Node puro pra introspectar a config e gerar `auth.schema.ts`), cai
 * num adapter "vazio" só pra permitir a introspecção sem precisar de um
 * D1 de verdade.
 *
 * `anonymous()`: sessão anônima desde o primeiro acesso. **Atenção —
 * comportamento diferente do `linkIdentity` do Supabase que este projeto
 * substitui**: lá a mesma sessão anônima virava e-mail/senha ou Google
 * preservando o `auth.uid()`. Aqui não — confirmado testando de verdade
 * (não documentado às claras na lib): ao logar com credencial real
 * enquanto a sessão é anônima, o Better Auth cria uma linha de usuário
 * NOVA (id diferente) e, por padrão, APAGA a linha anônima antiga
 * (`disableDeleteAnonymousUser`, default `false`). `onLinkAccount`
 * (abaixo) roda ANTES dessa exclusão, com os dois ids em mãos — repassa
 * o dono das tabelas de negócio (`profiles.user_id`,
 * `profissionais.user_id`) do id antigo pro novo antes que a linha
 * antiga suma. Testado de ponta a ponta na Fase 4 (curl + inspeção
 * direta do D1).
 */
export function createAuth(env?: AuthEnv, baseURL?: string) {
  const db = env ? drizzle(env.DB, { schema }) : undefined;

  return betterAuth({
    baseURL,
    secret: env?.BETTER_AUTH_SECRET,
    ...withCloudflare(
      {
        // Desligados de propósito: os dois exigem o objeto `cf` de uma
        // requisição real (não pedimos isso — não é algo que o plano
        // desta migração precisa), e ligados por padrão fariam o CLI
        // (`pnpm auth:generate`, sem requisição nenhuma) quebrar tentando
        // ler geolocalização.
        autoDetectIpAddress: false,
        geolocationTracking: false,
        d1: db ? { db, options: { usePlural: true } } : undefined,
      },
      {
        emailAndPassword: {
          enabled: true,
          // TODO (pendente pro Guilherme, mesma categoria do Google OAuth
          // acima): sem provedor de e-mail configurado (Resend/SES/etc),
          // ainda não existe como entregar esse link de verdade — no
          // Supabase, o próprio serviço mandava o e-mail; aqui a app é
          // dona do envio. Loga a URL no servidor pra dev local continuar
          // funcionando; troca por um envio real assim que houver
          // provedor escolhido.
          sendResetPassword: async ({ user, url }) => {
            console.log(`[auth] link de redefinição de senha pra ${user.email}: ${url}`);
          },
        },
        socialProviders: {
          google: {
            clientId: env?.GOOGLE_CLIENT_ID ?? "",
            clientSecret: env?.GOOGLE_CLIENT_SECRET ?? "",
          },
        },
        plugins: [
          anonymous({
            onLinkAccount: async ({ anonymousUser, newUser }) => {
              // Fase 4 (camada de dados): repassa o dono dos dados de
              // negócio do id anônimo pro id novo, ANTES do Better Auth
              // apagar a linha do usuário anônimo. Só 2 UPDATEs de 1
              // linha cada, sem cascata — possível porque `profiles.id`
              // e `profissionais.id` são uuids PRÓPRIOS (não o id do
              // usuário), com `user_id` como FK mutável separada (ver
              // comentário em `business.schema.ts`). Sem `db` (chamada
              // do CLI, sem D1 real) isso nunca dispara de verdade.
              if (!db) return;
              await db
                .update(profiles)
                .set({ userId: newUser.user.id })
                .where(eq(profiles.userId, anonymousUser.user.id));
              await db
                .update(profissionais)
                .set({ userId: newUser.user.id })
                .where(eq(profissionais.userId, anonymousUser.user.id));
            },
          }),
          // Mesmo TODO de sendResetPassword acima: sem provedor de
          // e-mail, só loga a URL no servidor por enquanto.
          magicLink({
            sendMagicLink: async ({ email, url }) => {
              console.log(`[auth] link mágico pra ${email}: ${url}`);
            },
          }),
          // Precisa ser o ÚLTIMO plugin (exigência documentada do Better
          // Auth): deixa `auth.api.<endpoint>()` chamado de dentro de uma
          // Server Action/Route Handler setar o cookie de sessão sozinho
          // via `next/headers`, sem precisar devolver um `Response` (ex.:
          // `signInAnonymous`, `signUpEmail` chamados fora da rota
          // genérica `/api/auth/[...all]`).
          nextCookies(),
        ],
      },
    ),
    ...(db
      ? {}
      : {
          database: drizzleAdapter({} as D1Database, { provider: "sqlite", usePlural: true }),
        }),
  });
}

// Só pro CLI (`pnpm auth:generate`) introspectar a config e gerar
// `auth.schema.ts` — nunca usado em runtime real (cada app monta a
// própria instância via `createAuth(env, baseURL)` dentro da requisição).
export const auth = createAuth();
