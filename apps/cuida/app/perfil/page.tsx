import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { FotoPerfilForm } from "./FotoPerfilForm";
import { PerfilForm } from "./PerfilForm";
import styles from "./page.module.css";

export default async function Perfil() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const profissional = await (await getDb()).query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { nome: true, fotoChave: true },
  });
  if (!profissional) redirect("/");

  return (
    <main className={styles.scene}>
      <a className={styles.voltar} href="/pacientes">
        ‹ pacientes
      </a>
      <p className={styles.eyebrow}>meu perfil</p>
      <h1 className={styles.headline}>{profissional.nome}</h1>
      <a className={styles.completarLink} href="/perfil/completar">
        abordagem e forma de trabalho →
      </a>
      <FotoPerfilForm fotoUrl={profissional.fotoChave ? `/imagens/${profissional.fotoChave}` : null} />
      <PerfilForm />
    </main>
  );
}
