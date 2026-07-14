import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import styles from "./page.module.css";

export default async function MarketingHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", user.id)
      .maybeSingle();

    redirect(profile?.nome ? "/home" : "/chegada");
  }

  return (
    <>
      <section className={styles.hero}>
        <img className={styles.heroImagem} src="/images/site/hero.png" alt="" />
        <div className={styles.heroGradiente} />
        <div className={styles.heroConteudo}>
          <h1 className={styles.heroHeadline}>
            Um lugar tranquilo
            <br />
            para se encontrar.
          </h1>
          <p className={styles.heroTexto}>
            Uma ferramenta para quem deseja cultivar mais presença no dia a dia e para terapeutas que
            acreditam que o cuidado também acontece entre as sessões.
          </p>
          <div className={styles.heroCtas}>
            <a className={styles.ctaPreenchido} href="/para-voce">
              Para você
            </a>
            <a className={styles.ctaContorno} href="/para-terapeutas">
              Para terapeutas
            </a>
          </div>
        </div>
        <span className={styles.heroScrollSeta} aria-hidden="true" />
      </section>

      <section className={styles.pergunta}>
        <div className={styles.perguntaConteudo}>
          <p className={styles.perguntaEyebrow}>Durante os últimos anos, uma pergunta nos acompanhou.</p>
          <p className={styles.perguntaDestaque}>
            O que acontece quando um ser humano começa, de verdade, a estar{" "}
            <span className={styles.perguntaGrifo}>presente</span> na própria vida?
          </p>

          <span className={styles.perguntaTraco} />

          <p className={styles.perguntaSubtitulo}>O Presença nasceu dessa busca.</p>
          <p className={styles.perguntaTexto}>
            Um espaço onde reflexões, registros, práticas e conversas acompanham o ritmo da vida.
          </p>

          <span className={styles.perguntaTraco} />

          <p className={styles.perguntaEyebrow}>Porque a vida acontece nos intervalos:</p>
          <div className={styles.perguntaIntervalos}>
            <span>entre uma sessão e outra</span>
            <span className={styles.perguntaPonto} />
            <span>entre um pensamento e outro</span>
            <span className={styles.perguntaPonto} />
            <span>entre uma decisão e outra</span>
          </div>

          <p className={styles.perguntaAviso}>
            Não pretende substituir a terapia
            <br />
            nem dizer o que você deve fazer
          </p>
          <p className={styles.perguntaFinal}>
            É um lugar para <span className={styles.perguntaSublinhado}>voltar a si mesmo</span>.
          </p>
        </div>
      </section>

      <section className={styles.paraQuem}>
        <div className={styles.paraQuemGrid}>
          <div className={styles.paraQuemCard}>
            <img className={styles.paraQuemImagem} src="/images/site/para-voce.png" alt="" />
            <div className={styles.paraQuemGradiente} />
            <div className={styles.paraQuemConteudo}>
              <h3 className={styles.paraQuemTitulo}>Para você</h3>
              <p className={styles.paraQuemTexto}>
                Pessoas que desejam desenvolver mais presença, registrar experiências, organizar
                pensamentos e acompanhar seu próprio processo ao longo do tempo.
              </p>
              <a className={styles.paraQuemCta} href="/para-voce">
                Conhecer
              </a>
            </div>
          </div>
          <div className={styles.paraQuemCard}>
            <img className={styles.paraQuemImagem} src="/images/site/para-terapeutas.png" alt="" />
            <div className={styles.paraQuemGradiente} />
            <div className={styles.paraQuemConteudo}>
              <h3 className={styles.paraQuemTitulo}>Para terapeutas</h3>
              <p className={styles.paraQuemTexto}>
                Profissionais que desejam ampliar o cuidado entre as sessões, oferecendo continuidade
                ao processo terapêutico de seus pacientes.
              </p>
              <a className={styles.paraQuemCta} href="/para-terapeutas">
                Conhecer
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
