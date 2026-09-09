import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profiles, profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { PageHeader } from "../PageHeader";
import { ConversaExperiencia } from "./ConversaExperiencia";
import styles from "./page.module.css";

export default async function Conversa() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { nome: true, profissionalId: true },
  });
  if (!profile?.nome) redirect("/chegada");

  // Nome real pro botão "Enviar resumo para [nome]" da tela de fechamento
  // (mockup fechamento_da_conversa_momento_de_pausa) — sem isso, o botão
  // não tem como dizer pra quem está enviando.
  const profissional = profile.profissionalId
    ? await db.query.profissionais.findFirst({
        where: eq(profissionais.id, profile.profissionalId),
        columns: { nome: true },
      })
    : undefined;

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Conversa" nome={profile.nome} atual="conversa" voltar={{ href: "/home" }} />
      <ConversaExperiencia nomeProfissional={profissional?.nome ?? null} />
    </main>
  );
}
