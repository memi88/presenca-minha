import type { NextRequest } from "next/server";

import { createClient } from "@presenca/supabase/server";

// Ponto de retorno comum pro fluxo PKCE do Supabase — tanto login com link
// mágico (signInWithOtp) quanto linkIdentity (conversão de conta via OAuth)
// voltam pra cá com um `code` na URL, que precisa ser trocado por sessão
// antes de qualquer redirect.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextRaw = request.nextUrl.searchParams.get("next") ?? "/home";
  const next = nextRaw.startsWith("/") ? nextRaw : "/home";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return Response.redirect(new URL(next, request.url));
    }
  }

  return Response.redirect(new URL("/login?erro=oauth", request.url));
}
