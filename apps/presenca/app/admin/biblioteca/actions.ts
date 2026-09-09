"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { admins, biblioteca } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

async function exigirAdmin() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const db = await getDb();
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, sessao.user.id) });
  if (!admin) redirect("/home");

  return db;
}

export async function aprovar(id: string) {
  const db = await exigirAdmin();
  await db.update(biblioteca).set({ statusModeracao: "aprovado", publicado: true }).where(eq(biblioteca.id, id));
  revalidatePath("/admin/biblioteca");
}

export async function recusar(id: string, formData: FormData) {
  const db = await exigirAdmin();
  const motivo = String(formData.get("motivo") ?? "").trim();
  await db
    .update(biblioteca)
    .set({ statusModeracao: "recusado", publicado: false, motivoRecusa: motivo || null })
    .where(eq(biblioteca.id, id));
  revalidatePath("/admin/biblioteca");
}

export async function tirarDoAr(id: string) {
  const db = await exigirAdmin();
  await db.update(biblioteca).set({ publicado: false }).where(eq(biblioteca.id, id));
  revalidatePath("/admin/biblioteca");
}
