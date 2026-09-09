"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { pacientesPreCadastro, profiles, vinculos } from "@presenca/db/schema";

import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export type ConfirmarConviteState = { erro?: string };

// Reimplementa `validar_token_pre_cadastro` + `confirmar_pre_cadastro`
// (ver supabase/migrations/20260811130000_fase11_pre_cadastro_paciente.sql)
// numa Server Action só. Sempre cria a conta real direto (sem passar por
// sessão anônima) — este formulário sempre pede e-mail/senha junto, então
// não há por que fabricar-e-promover uma sessão anônima no mesmo request
// (mesmo raciocínio de app/chegada/actions.ts:cadastrar).
export async function confirmarConvite(
  _prev: ConfirmarConviteState,
  formData: FormData,
): Promise<ConfirmarConviteState> {
  const token = String(formData.get("token") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!token) redirect("/");
  if (!email || !senha) return { erro: "Preencha e-mail e senha." };
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };

  const db = await getDb();

  // Nome vem sempre do token (nunca de input do form) — quem convidou já
  // digitou o nome certo, e isso evita confiar num campo escondido que
  // poderia ser adulterado antes do submit.
  const preCadastro = await db.query.pacientesPreCadastro.findFirst({
    where: eq(pacientesPreCadastro.tokenConvite, token),
    columns: { nome: true, status: true, profissionalId: true },
  });
  if (!preCadastro || preCadastro.status !== "pendente") {
    return { erro: "Esse link não é mais válido." };
  }

  const auth = await getAuth();
  let userId: string;
  try {
    const resultado = await auth.api.signUpEmail({
      body: { email, password: senha, name: preCadastro.nome },
      headers: await headers(),
    });
    userId = resultado.user.id;
  } catch (erro) {
    const mensagem = erro instanceof APIError ? erro.message : "Não foi possível abrir seu espaço agora. Tenta de novo?";
    return { erro: mensagem };
  }

  const [profile] = await db
    .insert(profiles)
    .values({ userId, nome: preCadastro.nome, profissionalId: preCadastro.profissionalId })
    .returning({ id: profiles.id });
  if (!profile) {
    return { erro: "Não foi possível guardar seu espaço agora. Tenta de novo?" };
  }

  await db
    .insert(vinculos)
    .values({ profissionalId: preCadastro.profissionalId, pacienteId: profile.id, ativo: true })
    .onConflictDoUpdate({
      target: [vinculos.profissionalId, vinculos.pacienteId],
      set: { ativo: true },
    });

  await db
    .update(pacientesPreCadastro)
    .set({ status: "confirmado", pacienteId: profile.id, confirmadoEm: new Date() })
    .where(eq(pacientesPreCadastro.tokenConvite, token));

  redirect("/home");
}
