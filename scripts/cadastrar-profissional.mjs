#!/usr/bin/env node
// Cadastra um profissional pro piloto: cria a conta de login (auth.users)
// e a linha em `profissionais`, e imprime o código de convite que ela vai
// passar pros pacientes conectarem em "Terapia".
//
// Usa service_role (`auth.admin.createUser`, e o insert em `profissionais`
// ignora RLS) — por isso roda só localmente, com a sua própria chave, nunca
// dentro de código de frontend. Mesmo espírito de scripts/cadastrar-biblioteca.mjs.
//
// Uso:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/cadastrar-profissional.mjs "Nome da Terapeuta" email@exemplo.com "senha-temporaria"

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [nome, email, senha] = process.argv.slice(2);

if (!url || !serviceRoleKey) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (Project Settings > API).");
  process.exit(1);
}
if (!nome || !email || !senha) {
  console.error('Uso: node scripts/cadastrar-profissional.mjs "Nome" email@exemplo.com senha');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: usuario, error: erroUsuario } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (erroUsuario) throw new Error(`criar usuário: ${erroUsuario.message}`);

  const { data: profissional, error: erroProfissional } = await supabase
    .from("profissionais")
    .insert({ nome, user_id: usuario.user.id })
    .select("id, codigo_convite")
    .single();
  if (erroProfissional) throw new Error(`criar profissional: ${erroProfissional.message}`);

  console.log(`\n✅ ${nome} cadastrada.`);
  console.log(`   login no Cuida: ${email} / ${senha}`);
  console.log(`   código de convite pros pacientes: ${profissional.codigo_convite}\n`);
}

main().catch((err) => {
  console.error("\nErro:", err.message);
  process.exit(1);
});
