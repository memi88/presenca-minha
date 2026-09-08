"use server";

import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { alertasRisco, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

export async function avisarProfissional() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true, profissionalId: true },
  });
  if (!profile?.profissionalId) redirect("/recursos");

  await db.insert(alertasRisco).values({ pacienteId: profile.id, profissionalId: profile.profissionalId });

  redirect("/recursos");
}
