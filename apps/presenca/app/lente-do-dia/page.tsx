import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";
import { lenteReacoes, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { buscarLenteGenerica, dataCivilHoje } from "@/lib/present";

import { IconeCoracao } from "../IconeCoracao";
import { IconeCoracaoCortado } from "../IconeCoracaoCortado";
import { IconeLente } from "../IconeLente";
import { IconeSetaEsquerda } from "../IconeSetaEsquerda";
import { reagirLente } from "./actions";
import styles from "./lente.module.css";

// Mesma função de app/home/page.tsx — dia real, nunca inventado.
function dataDeHoje(): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(new Date());
}

export default async function LenteDoDia() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true, nome: true },
  });
  if (!profile?.nome) redirect("/chegada");

  // dailyPresent nulo é resultado normal (motor Presente fora do ar) — a
  // Home já esconde o card teaser nesse caso, então quem chegar aqui direto
  // (link salvo, refresh) não tem o que ler.
  const dailyPresent = await buscarLenteGenerica();
  if (!dailyPresent) redirect("/home");

  const reacaoAtual = await db.query.lenteReacoes.findFirst({
    where: and(eq(lenteReacoes.pacienteId, profile.id), eq(lenteReacoes.data, dataCivilHoje())),
    columns: { reacao: true },
  });

  const reagirGostei = reagirLente.bind(null, "gostei");
  const reagirNaoGostei = reagirLente.bind(null, "nao_gostei");

  return (
    <main className={styles.scene}>
      <a className={styles.voltarFlutuante} href="/home" aria-label="Voltar para a Home">
        <IconeSetaEsquerda />
      </a>
      <div className={styles.conteudo}>
        <div className={styles.eyebrow}>
          <IconeLente className={styles.eyebrowIcone} />
          <span>Lente do dia · {dataDeHoje()}</span>
        </div>

        <p className={styles.paragrafo}>{dailyPresent.reflection}</p>

        <p className={styles.rotulo}>Uma pergunta</p>
        <p className={styles.paragrafo}>{dailyPresent.question}</p>

        <div className={styles.reacoes}>
          <form action={reagirGostei}>
            <button
              type="submit"
              className={`${styles.pill} ${reacaoAtual?.reacao === "gostei" ? styles.reacaoPillAtiva : ""}`}
            >
              <IconeCoracao />
              Gostei
            </button>
          </form>
          <form action={reagirNaoGostei}>
            <button
              type="submit"
              className={`${styles.pill} ${reacaoAtual?.reacao === "nao_gostei" ? styles.reacaoPillAtiva : ""}`}
            >
              <IconeCoracaoCortado />
              Não Gostei
            </button>
          </form>
        </div>

        <div className={styles.rodapeAcoes}>
          <a className={styles.pill} href="/conversa">
            Conversar sobre isso
          </a>
          <a className={styles.pill} href="/lente-do-dia/contexto">
            Entender de onde vem
          </a>
        </div>
      </div>
    </main>
  );
}
