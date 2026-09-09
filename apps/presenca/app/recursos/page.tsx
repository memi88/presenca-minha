import { redirect } from "next/navigation";

import { and, desc, eq } from "drizzle-orm";
import { alertasRisco, profiles, profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { PageHeader } from "../PageHeader";
import { avisarProfissional } from "./actions";
import styles from "./page.module.css";

const UMA_HORA_MS = 60 * 60 * 1000;

export default async function Recursos() {
  const sessao = await getSessao();
  // Sem guard de nome/onboarding aqui de propósito — recursos de cuidado
  // nunca podem depender de o cadastro estar completo (PRD §7: "nunca
  // variam por sinal").
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true, nome: true, profissionalId: true },
  });

  let nomeProfissional: string | null = null;
  let avisadoRecentemente = false;

  if (profile?.profissionalId) {
    const [profissional, ultimoAlerta] = await Promise.all([
      db.query.profissionais.findFirst({
        where: eq(profissionais.id, profile.profissionalId),
        columns: { nome: true },
      }),
      db.query.alertasRisco.findFirst({
        where: and(eq(alertasRisco.pacienteId, profile.id), eq(alertasRisco.profissionalId, profile.profissionalId)),
        orderBy: desc(alertasRisco.createdAt),
        columns: { createdAt: true },
      }),
    ]);
    nomeProfissional = profissional?.nome ?? null;
    avisadoRecentemente = !!ultimoAlerta && Date.now() - ultimoAlerta.createdAt.getTime() < UMA_HORA_MS;
  }

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Recursos" nome={profile?.nome ?? undefined} atual={null} voltar={{ href: "/home" }} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>cuidado imediato</p>
        <h2 className={styles.headline}>Você não está sozinho agora.</h2>
        <p className={styles.subtext}>Ajuda a um toque, sempre disponível — com ou sem profissional conectado.</p>

        <div className={styles.recursos}>
          <a className={styles.recurso} href="tel:188">
            <span className={styles.recursoTexto}>
              <span className={styles.recursoNome}>CVV · 188</span>
              <span className={styles.recursoDescricao}>Centro de Valorização da Vida</span>
            </span>
            <span className={styles.recursoIcone} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 8.6 8.6 0 0 0 2.7.43 1 1 0 0 1 1 1v2.65a1 1 0 0 1-1 1A17.5 17.5 0 0 1 2.5 3.6a1 1 0 0 1 1-1H6.2a1 1 0 0 1 1 1 8.6 8.6 0 0 0 .43 2.7 1 1 0 0 1-.25 1z" />
              </svg>
            </span>
          </a>
          <a className={styles.recurso} href="tel:192">
            <span className={styles.recursoTexto}>
              <span className={styles.recursoNome}>SAMU · 192</span>
              <span className={styles.recursoDescricao}>Emergência médica</span>
            </span>
            <span className={styles.recursoIcone} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </a>
        </div>

        <a className={styles.cta} href="tel:188">
          Falar com um humano
        </a>

        <p className={styles.rede}>Se tiver alguém por perto em quem você confia, também vale chamar.</p>

        {nomeProfissional && (
          <div className={styles.avisoBox}>
            {avisadoRecentemente ? (
              <p className={styles.avisoConfirmado}>Já avisamos {nomeProfissional} há pouco.</p>
            ) : (
              <form action={avisarProfissional}>
                <button className={styles.avisoBotao} type="submit">
                  avisar {nomeProfissional}
                </button>
              </form>
            )}
            <p className={styles.avisoMicrocopy}>
              Isso avisa {nomeProfissional} que você está passando por um momento difícil — não substitui o
              CVV ou o SAMU acima, e não garante resposta imediata.
            </p>
          </div>
        )}

        <p className={styles.footer}>Disponível em qualquer momento da jornada</p>
      </div>
    </main>
  );
}
