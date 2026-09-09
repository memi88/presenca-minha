import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { CirculoRespirando } from "../CirculoRespirando";
import styles from "./page.module.css";
import { Reveal } from "./Reveal";

const MENSAGEM_WHATSAPP = encodeURIComponent(
  "Olá! Tenho interesse em conhecer o Presença como terapeuta parceiro.",
);

export default async function MarketingHome() {
  const sessao = await getSessao();

  if (sessao) {
    const profile = await (await getDb()).query.profiles.findFirst({
      where: eq(profiles.userId, sessao.user.id),
      columns: { nome: true },
    });

    redirect(profile?.nome ? "/home" : "/chegada");
  }

  // App mobile (docs/presenca-extensao-app-mobile.md §4.1) — a home de
  // marketing é só-web; dentro do app empacotado, quem não está logado
  // cai direto em /bem-vindo. Marcador vem de `appendUserAgent` no
  // capacitor.config.ts (server.url ali fica só na origem, sem path, por
  // motivo de navegação — ver comentário lá).
  const headersList = await headers();
  if (headersList.get("user-agent")?.includes("PresencaApp")) {
    redirect("/bem-vindo");
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
          <Reveal>
            <p className={styles.perguntaEyebrow}>Durante os últimos anos, uma pergunta nos acompanhou.</p>
            <p className={styles.perguntaDestaque}>
              O que acontece quando um ser humano começa, de verdade, a estar{" "}
              <span className={styles.perguntaGrifo}>presente</span> na própria vida?
            </p>
            <span className={styles.perguntaTraco} />
          </Reveal>

          <Reveal delayMs={80}>
            <p className={styles.perguntaSubtitulo}>O Presença nasceu dessa busca.</p>
            <p className={styles.perguntaTexto}>
              Um espaço onde reflexões, registros, práticas e conversas acompanham o ritmo da vida.
            </p>
            <span className={styles.perguntaTraco} />
          </Reveal>

          <Reveal delayMs={80}>
            <p className={styles.perguntaEyebrow}>Porque a vida acontece nos intervalos:</p>
            <div className={styles.perguntaIntervalos}>
              <span>entre uma sessão e outra</span>
              <span className={styles.perguntaPonto} />
              <span>entre um pensamento e outro</span>
              <span className={styles.perguntaPonto} />
              <span>entre uma decisão e outra</span>
            </div>
          </Reveal>

          <Reveal delayMs={80}>
            <p className={styles.perguntaAviso}>
              Não pretende substituir a terapia
              <br />
              nem dizer o que você deve fazer
            </p>
            <p className={styles.perguntaFinal}>
              É um lugar para <span className={styles.perguntaSublinhado}>voltar a si mesmo</span>.
            </p>
          </Reveal>
        </div>
      </section>

      <section className={styles.paraQuem}>
        <div className={styles.paraQuemGrid}>
          <Reveal className={styles.paraQuemCard}>
            <CirculoRespirando className={styles.paraQuemIcone} />
            <div className={styles.paraQuemConteudo}>
              <h3 className={styles.paraQuemTitulo}>Para você</h3>
              <p className={styles.paraQuemTexto}>
                Pra quem quer registrar, refletir e acompanhar o próprio processo com o tempo.
              </p>
              <div className={styles.paraQuemPrecoLinha}>
                <span className={styles.paraQuemPrecoValor}>R$ 19</span>
                <span className={styles.paraQuemPrecoUnidade}>/mês, no plano anual</span>
              </div>
              <p className={styles.paraQuemPrecoSub}>7 dias grátis pra testar, sem cartão</p>
              <ul className={styles.paraQuemBeneficios}>
                <li>Acesso completo desde o primeiro dia</li>
                <li>Cancele quando quiser</li>
              </ul>
              <div className={styles.paraQuemAcoes}>
                <a className={styles.paraQuemCta} href="/bem-vindo">
                  Começar agora
                </a>
                <a className={styles.paraQuemCtaSecundaria} href="/para-voce#planos">
                  Ver todos os planos →
                </a>
              </div>
            </div>
          </Reveal>
          <Reveal className={styles.paraQuemCard} delayMs={120}>
            <CirculoRespirando className={styles.paraQuemIcone} />
            <div className={styles.paraQuemConteudo}>
              <h3 className={styles.paraQuemTitulo}>Para terapeutas</h3>
              <p className={styles.paraQuemTexto}>
                Pra quem quer continuar cuidando do paciente entre as sessões.
              </p>
              <div className={styles.paraQuemPrecoLinha}>
                <span className={styles.paraQuemPrecoValor}>R$ 89</span>
                <span className={styles.paraQuemPrecoUnidade}>/mês</span>
              </div>
              <p className={styles.paraQuemPrecoSub}>Até 5 pacientes ativos</p>
              <ul className={styles.paraQuemBeneficios}>
                <li>Cobrança só por paciente ativo</li>
                <li>Diário e biblioteca colaborativa</li>
              </ul>
              <div className={styles.paraQuemAcoes}>
                <a
                  className={styles.paraQuemCta}
                  href={`https://wa.me/5551991393827?text=${MENSAGEM_WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar no WhatsApp
                </a>
                <a className={styles.paraQuemCtaSecundaria} href="/para-terapeutas">
                  Ver planos completos →
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
