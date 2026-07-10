#!/usr/bin/env node
// Verifica RLS de todas as tabelas da Fase 0, usando SOMENTE a chave anon —
// nunca service_role. Cria usuários de teste reais via signup público e
// roda queries como eles, exatamente como um usuário real veria.
//
// Uso:
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/rls-check.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

function freshClient() {
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function signUpAndLogin(client, label) {
  const email = `rls-test-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@gmail.com`;
  const password = `Test-${Math.random().toString(36).slice(2)}!A1`;
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw new Error(`signup ${label} falhou: ${error.message}`);
  if (!data.session) {
    throw new Error(
      "NO_SESSION: signup não retornou sessão — provavelmente 'Confirm email' está " +
        "ligado no projeto. Desative temporariamente em Authentication > Sign In / " +
        "Providers > Email > 'Confirm email' (ação de configuração, não expõe nenhum " +
        "segredo) e rode de novo.",
    );
  }
  return { client, user: data.user, email };
}

async function main() {
  const a = await signUpAndLogin(freshClient(), "a");
  const b = await signUpAndLogin(freshClient(), "b");
  const c = await signUpAndLogin(freshClient(), "c");
  const anon = freshClient(); // sem login — role `anon`

  console.log(`\nusuário A (paciente): ${a.user.id}`);
  console.log(`usuário B (paciente): ${b.user.id}`);
  console.log(`usuário C (profissional): ${c.user.id}\n`);

  // --- profiles ---------------------------------------------------------
  {
    const { error } = await a.client.from("profiles").insert({ id: a.user.id, nome: "Paciente A" });
    record("profiles: paciente insere o próprio perfil", !error, error?.message);
  }
  {
    const { data, error } = await a.client.from("profiles").select("*").eq("id", a.user.id);
    record("profiles: paciente lê o próprio perfil", !error && data?.length === 1, error?.message ?? `rows=${data?.length}`);
  }
  {
    const { error } = await a.client.from("profiles").update({ nome: "Paciente A editado" }).eq("id", a.user.id);
    record("profiles: paciente edita o próprio perfil", !error, error?.message);
  }
  {
    const { data, error } = await b.client.from("profiles").select("*").eq("id", a.user.id);
    record(
      "profiles: paciente B NÃO vê perfil de A",
      !error && data?.length === 0,
      error ? error.message : `rows=${data?.length}`,
    );
  }
  {
    const { error } = await anon.from("profiles").select("*").limit(1);
    record("profiles: anon (não logado) é bloqueado", !!error, error ? "bloqueado como esperado" : "leu sem estar logado!");
  }

  // --- profissionais ------------------------------------------------------
  {
    const { error } = await c.client.from("profissionais").insert({ nome: "Terapeuta C", user_id: c.user.id });
    record("profissionais: profissional insere o próprio registro", !error, error?.message);
  }
  const { data: profissionalRow } = await c.client
    .from("profissionais")
    .select("id")
    .eq("user_id", c.user.id)
    .single();
  {
    const { data, error } = await c.client.from("profissionais").select("*").eq("user_id", c.user.id);
    record("profissionais: profissional lê o próprio registro", !error && data?.length === 1, error?.message ?? `rows=${data?.length}`);
  }
  {
    const { data, error } = await a.client.from("profissionais").select("*").eq("id", profissionalRow.id);
    record(
      "profissionais: paciente NÃO vê registro do profissional",
      !error && data?.length === 0,
      error ? error.message : `rows=${data?.length}`,
    );
  }
  {
    const { error } = await anon.from("profissionais").select("*").limit(1);
    record("profissionais: anon (não logado) é bloqueado", !!error, error ? "bloqueado como esperado" : "leu sem estar logado!");
  }

  // --- vinculos -----------------------------------------------------------
  {
    const { error } = await c.client
      .from("vinculos")
      .insert({ profissional_id: profissionalRow.id, paciente_id: a.user.id });
    record(
      "vinculos: insert direto é bloqueado (Fase 4 fará via função)",
      !!error,
      error ? "bloqueado como esperado" : "inseriu sem função de convite!",
    );
  }
  {
    const { data, error } = await a.client.from("vinculos").select("*");
    record("vinculos: paciente consegue ler (0 linhas, sem erro de permissão)", !error, error?.message ?? `rows=${data?.length}`);
  }
  {
    const { error } = await anon.from("vinculos").select("*").limit(1);
    record("vinculos: anon (não logado) é bloqueado", !!error, error ? "bloqueado como esperado" : "leu sem estar logado!");
  }

  // --- biblioteca -----------------------------------------------------------
  {
    const { data, error } = await a.client.from("biblioteca").select("*");
    record("biblioteca: authenticated lê (0 linhas, sem erro de permissão)", !error, error?.message ?? `rows=${data?.length}`);
  }
  {
    const { error } = await a.client.from("biblioteca").insert({ tipo: "pratica", conteudo: "teste" });
    record("biblioteca: authenticated NÃO consegue inserir (só service_role)", !!error, error ? "bloqueado como esperado" : "inseriu via client!");
  }
  {
    const { error } = await anon.from("biblioteca").select("*").limit(1);
    record("biblioteca: anon (não logado) é bloqueado", !!error, error ? "bloqueado como esperado" : "leu sem estar logado!");
  }

  // --- caderno_entradas -----------------------------------------------------
  let entradaId;
  {
    const { data, error } = await a.client
      .from("caderno_entradas")
      .insert({ paciente_id: a.user.id, autor_tipo: "usuario", conteudo: "primeira entrada" })
      .select("id")
      .single();
    record("caderno_entradas: paciente insere entrada própria", !error, error?.message);
    entradaId = data?.id;
  }
  {
    const { data, error } = await a.client.from("caderno_entradas").select("*").eq("paciente_id", a.user.id);
    record("caderno_entradas: paciente lê as próprias entradas", !error && data?.length === 1, error?.message ?? `rows=${data?.length}`);
  }
  {
    const { error } = await a.client.from("caderno_entradas").update({ revisitar: true }).eq("id", entradaId);
    record("caderno_entradas: paciente marca revisitar", !error, error?.message);
  }
  {
    const { data, error } = await b.client.from("caderno_entradas").select("*").eq("paciente_id", a.user.id);
    record(
      "caderno_entradas: paciente B NÃO vê entradas de A",
      !error && data?.length === 0,
      error ? error.message : `rows=${data?.length}`,
    );
  }
  {
    const { error } = await a.client
      .from("caderno_entradas")
      .insert({ paciente_id: a.user.id, autor_tipo: "profissional", conteudo: "tentando se passar por profissional" });
    record(
      "caderno_entradas: paciente NÃO consegue se passar por profissional",
      !!error,
      error ? "bloqueado como esperado" : "impersonation permitida!",
    );
  }
  {
    const { error } = await c.client.from("caderno_entradas").insert({
      paciente_id: a.user.id,
      autor_tipo: "profissional",
      autor_profissional_id: profissionalRow.id,
      conteudo: "pergunta do profissional sem vínculo ativo",
    });
    record(
      "caderno_entradas: profissional SEM vínculo ativo é bloqueado",
      !!error,
      error ? "bloqueado como esperado (vínculo é Fase 4)" : "inseriu sem vínculo!",
    );
  }
  {
    const { error } = await a.client.from("caderno_entradas").delete().eq("id", entradaId);
    record("caderno_entradas: paciente apaga a própria entrada", !error, error?.message);
  }
  {
    const { error } = await anon.from("caderno_entradas").select("*").limit(1);
    record("caderno_entradas: anon (não logado) é bloqueado", !!error, error ? "bloqueado como esperado" : "leu sem estar logado!");
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} testes OK`);
  if (failed.length) {
    console.log("\nFalharam:");
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nErro fatal:", err.message);
  process.exit(1);
});
