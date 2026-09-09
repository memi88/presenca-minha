import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { PageHeader } from "../../PageHeader";
import { salvarNascimento } from "./actions";
import { NascimentoForm } from "./NascimentoForm";
import styles from "./page.module.css";

export default async function Nascimento() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const profile = await (await getDb()).query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: {
      nome: true,
      dataNascimento: true,
      horaNascimento: true,
      localNascimento: true,
      nascimentoLatitude: true,
      nascimentoLongitude: true,
    },
  });
  if (!profile?.nome) redirect("/chegada");

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Nascimento" nome={profile.nome} atual={null} voltar={{ href: "/perfil" }} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>quer personalizar sua presença?</p>
        <h2 className={styles.headline}>
          Esses dados ajudam a calibrar{" "}
          <br className={styles.quebra} />
          como esse espaço te acompanha.
        </h2>
        <NascimentoForm
          data={profile.dataNascimento}
          hora={profile.horaNascimento}
          local={profile.localNascimento}
          latitude={profile.nascimentoLatitude ? Number(profile.nascimentoLatitude) : null}
          longitude={profile.nascimentoLongitude ? Number(profile.nascimentoLongitude) : null}
          action={salvarNascimento}
        />
      </div>
    </main>
  );
}
