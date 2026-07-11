import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { avisarProfissional } from "./actions";
import styles from "./page.module.css";

const UMA_HORA_MS = 60 * 60 * 1000;

export default async function Recursos() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Sem guard de nome/onboarding aqui de propósito — recursos de cuidado
  // nunca podem depender de o cadastro estar completo (PRD §7: "nunca
  // variam por sinal").
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("profissional_id")
    .eq("id", user.id)
    .maybeSingle();

  let nomeProfissional: string | null = null;
  let avisadoRecentemente = false;

  if (profile?.profissional_id) {
    const [{ data: profissional }, { data: ultimoAlerta }] = await Promise.all([
      supabase.from("profissionais").select("nome").eq("id", profile.profissional_id).maybeSingle(),
      supabase
        .from("alertas_risco")
        .select("created_at")
        .eq("paciente_id", user.id)
        .eq("profissional_id", profile.profissional_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    nomeProfissional = profissional?.nome ?? null;
    avisadoRecentemente = !!ultimoAlerta && Date.now() - new Date(ultimoAlerta.created_at).getTime() < UMA_HORA_MS;
  }

  return (
    <main className={styles.scene}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>cuidado imediato</p>
        <h1 className={styles.headline}>Você não está sozinho agora.</h1>
        <p className={styles.subtext}>Ajuda a um toque, sempre disponível — com ou sem profissional conectado.</p>

        <div className={styles.recursos}>
          <a className={styles.recurso} href="tel:188">
            <span className={styles.recursoTexto}>
              <span className={styles.recursoNome}>CVV · 188</span>
              <span className={styles.recursoDescricao}>Centro de Valorização da Vida</span>
            </span>
            <span className={styles.recursoIcone} />
          </a>
          <a className={styles.recurso} href="tel:192">
            <span className={styles.recursoTexto}>
              <span className={styles.recursoNome}>SAMU · 192</span>
              <span className={styles.recursoDescricao}>emergência médica</span>
            </span>
            <span className={styles.recursoIcone} />
          </a>
        </div>

        <a className={styles.cta} href="tel:188">
          falar com um humano
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

        <p className={styles.footer}>disponível em qualquer momento da jornada</p>

        <a className={styles.voltar} href="/home">
          ← voltar
        </a>
      </div>
    </main>
  );
}
