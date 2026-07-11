#!/usr/bin/env node
// Verifica RLS da Fase 4 (vínculo profissional-paciente + Cuida), usando
// SOMENTE a chave anon — nunca service_role. Roda depois de aplicar
// supabase/migrations/*_fase4_vinculos.sql. Mesmo padrão de scripts/rls-check.mjs
// (não mexe nele — este é focado só no que a Fase 4 acrescentou).
//
// Uso:
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/rls-check-fase4.mjs

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
  const email = `rls-fase4-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@gmail.com`;
  const password = `Test-${Math.random().toString(36).slice(2)}!A1`;
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw new Error(`signup ${label} falhou: ${error.message}`);
  if (!data.session) {
    throw new Error(
      "NO_SESSION: signup não retornou sessão — desative 'Confirm email' em Authentication > " +
        "Sign In / Providers > Email e rode de novo.",
    );
  }
  return { client, user: data.user, email };
}

async function main() {
  const a = await signUpAndLogin(freshClient(), "a"); // paciente vinculado
  const b = await signUpAndLogin(freshClient(), "b"); // paciente NÃO vinculado
  const c = await signUpAndLogin(freshClient(), "c"); // profissional
  const anon = freshClient();

  console.log(`\npaciente A (vai conectar): ${a.user.id}`);
  console.log(`paciente B (não conecta): ${b.user.id}`);
  console.log(`profissional C: ${c.user.id}\n`);

  await a.client.from("profiles").insert({ id: a.user.id, nome: "Paciente A" });
  await b.client.from("profiles").insert({ id: b.user.id, nome: "Paciente B" });
  await c.client.from("profissionais").insert({ nome: "Terapeuta C", user_id: c.user.id });

  const { data: profissionalRow } = await c.client
    .from("profissionais")
    .select("id, codigo_convite")
    .eq("user_id", c.user.id)
    .single();

  // --- conectar_profissional (RPC) ----------------------------------------
  {
    const { data, error } = await a.client.rpc("conectar_profissional", { p_codigo: "CODIGO-ERRADO" });
    record(
      "rpc: código errado retorna ok:false (sem criar vínculo)",
      !error && data?.ok === false,
      error?.message ?? JSON.stringify(data),
    );
  }
  {
    const { data, error } = await a.client.rpc("conectar_profissional", {
      p_codigo: profissionalRow.codigo_convite,
    });
    record("rpc: código certo conecta (ok:true)", !error && data?.ok === true, error?.message ?? JSON.stringify(data));
  }
  {
    const { data, error } = await a.client.from("vinculos").select("*").eq("paciente_id", a.user.id);
    record("vinculos: vínculo foi criado de verdade", !error && data?.length === 1, error?.message ?? `rows=${data?.length}`);
  }
  {
    const { data, error } = await a.client.from("profiles").select("profissional_id").eq("id", a.user.id).single();
    record(
      "profiles: profissional_id do paciente foi atualizado",
      !error && data?.profissional_id === profissionalRow.id,
      error?.message ?? `profissional_id=${data?.profissional_id}`,
    );
  }
  {
    const { error } = await anon.rpc("conectar_profissional", { p_codigo: profissionalRow.codigo_convite });
    record("rpc: anon (não logado) é bloqueado", !!error, error ? "bloqueado como esperado" : "conectou sem estar logado!");
  }
  {
    const { error } = await a.client
      .from("vinculos")
      .insert({ profissional_id: profissionalRow.id, paciente_id: a.user.id });
    record("vinculos: insert direto continua bloqueado", !!error, error ? "bloqueado como esperado" : "inseriu direto!");
  }

  // --- profissionais / profiles (leitura pós-vínculo) ---------------------
  {
    const { data, error } = await a.client.from("profissionais").select("nome").eq("id", profissionalRow.id);
    record("profissionais: paciente A lê o profissional vinculado", !error && data?.length === 1, error?.message ?? `rows=${data?.length}`);
  }
  {
    const { data, error } = await c.client.from("profiles").select("nome").eq("id", a.user.id);
    record("profiles: profissional lê perfil do paciente vinculado (A)", !error && data?.length === 1, error?.message ?? `rows=${data?.length}`);
  }
  {
    const { data, error } = await c.client.from("profiles").select("nome").eq("id", b.user.id);
    record(
      "profiles: profissional NÃO lê perfil de paciente sem vínculo (B)",
      !error && data?.length === 0,
      error ? error.message : `rows=${data?.length}`,
    );
  }

  // --- caderno_entradas: o limite central da Fase 4 ------------------------
  let entradaUsuarioId;
  {
    const { data, error } = await a.client
      .from("caderno_entradas")
      .insert({ paciente_id: a.user.id, autor_tipo: "usuario", conteudo: "entrada privada da paciente" })
      .select("id")
      .single();
    record("caderno_entradas: paciente A escreve entrada própria", !error, error?.message);
    entradaUsuarioId = data?.id;
  }
  let entradaProfissionalId;
  {
    const { data, error } = await c.client
      .from("caderno_entradas")
      .insert({
        paciente_id: a.user.id,
        autor_tipo: "profissional",
        autor_profissional_id: profissionalRow.id,
        conteudo: "pergunta do profissional pra paciente vinculada",
      })
      .select("id")
      .single();
    record("caderno_entradas: profissional com vínculo ativo insere entrada", !error, error?.message);
    entradaProfissionalId = data?.id;
  }
  {
    const { data, error } = await c.client
      .from("caderno_entradas")
      .select("id")
      .eq("paciente_id", a.user.id)
      .eq("autor_tipo", "profissional");
    record(
      "caderno_entradas: profissional lê a própria entrada",
      !error && data?.length === 1 && data[0].id === entradaProfissionalId,
      error?.message ?? `rows=${data?.length}`,
    );
  }
  {
    const { data, error } = await c.client
      .from("caderno_entradas")
      .select("id")
      .eq("paciente_id", a.user.id)
      .eq("autor_tipo", "usuario");
    record(
      "caderno_entradas: profissional NUNCA vê entrada tipo 'usuario' (mesmo vinculado)",
      !error && data?.length === 0,
      error ? error.message : `rows=${data?.length} — VAZAMENTO se > 0`,
    );
  }
  {
    const { data, error } = await c.client.from("caderno_entradas").select("id").eq("paciente_id", a.user.id);
    record(
      "caderno_entradas: select sem filtro de autor_tipo também só traz a própria (RLS, não o filtro do client)",
      !error && data?.length === 1 && data[0].id === entradaProfissionalId,
      error?.message ?? `rows=${data?.length}`,
    );
  }
  {
    const { data, error } = await a.client.from("caderno_entradas").select("id").eq("paciente_id", a.user.id);
    record(
      "caderno_entradas: paciente A continua vendo as duas entradas (própria + profissional)",
      !error && data?.length === 2,
      error?.message ?? `rows=${data?.length}`,
    );
  }

  await a.client.from("caderno_entradas").delete().eq("id", entradaUsuarioId);

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
