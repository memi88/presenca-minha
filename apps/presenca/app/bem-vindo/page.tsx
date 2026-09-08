import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { CirculoRespirando } from "../CirculoRespirando";
import styles from "./page.module.css";

export default async function BemVindo() {
  const sessao = await getSessao();

  if (sessao) {
    const profile = await (await getDb()).query.profiles.findFirst({
      where: eq(profiles.userId, sessao.user.id),
      columns: { nome: true },
    });

    redirect(profile?.nome ? "/home" : "/chegada");
  }

  return (
    <main className={styles.scene}>
      <div className={styles.espaco} />
      <div className={styles.centro}>
        <CirculoRespirando className={styles.logo} />
        <h1 className={styles.wordmark}>Presença</h1>
        {/*
          A conta só é criada de fato (sessão anônima, silenciosa) quando o
          formulário de apelido/e-mail/senha em /chegada é enviado — este
          link não faz nenhuma chamada de autenticação.
        */}
        <a className={styles.entrar} href="/chegada">
          <span>entrar</span>
          <svg
            className={styles.entrarIcone}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </div>
      <div className={styles.espaco} />
      <footer className={styles.rodape}>
        <a href="/login">Já possuo meu espaço</a>
      </footer>
    </main>
  );
}
