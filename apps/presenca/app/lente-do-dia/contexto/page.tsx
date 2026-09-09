import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { buscarLenteGenerica } from "@/lib/present";

import { IconeSetaEsquerda } from "../../IconeSetaEsquerda";
import styles from "../lente.module.css";

// "De onde vem" a lente do dia — os 2 componentes reais da derivação
// (tom + selo, ver DerivationSummary em lib/present.ts). O mockup
// (docs/redesign/lente_do_dia_contexto_ambiente_claro) usa uma citação
// fabricada pelo Stitch ("A atenção é a forma mais rara..." — Simone
// Weil) sem nenhum campo real correspondente; trocada pelos textos
// curados que o motor Presente já entrega (mesmo dado que antes só
// aparecia dentro do <details> "Entender de onde vem" da Home).
export default async function LenteDoDiaContexto() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const profile = await (await getDb()).query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { nome: true },
  });
  if (!profile?.nome) redirect("/chegada");

  const dailyPresent = await buscarLenteGenerica();
  if (!dailyPresent) redirect("/home");

  const { derivationSummary } = dailyPresent;

  return (
    <main className={styles.scene}>
      <a className={styles.voltarFlutuante} href="/lente-do-dia" aria-label="Voltar para a lente do dia">
        <IconeSetaEsquerda />
      </a>
      <div className={styles.conteudo}>
        <div className={styles.bloco}>
          <p className={styles.rotulo}>{derivationSummary.tomHoje}</p>
          <p className={styles.paragrafo}>{derivationSummary.textoCuradoTom}</p>
        </div>
        <div className={styles.bloco}>
          <p className={styles.rotulo}>{derivationSummary.seloHoje}</p>
          <p className={styles.paragrafo}>{derivationSummary.textoCuradoSelo}</p>
        </div>
      </div>
    </main>
  );
}
