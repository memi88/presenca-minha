import styles from "../PaginaAudiencia.module.css";

const MENSAGEM_WHATSAPP = encodeURIComponent(
  "Olá! Tenho interesse em conhecer o Presença como terapeuta parceiro.",
);

export default function ParaTerapeutas() {
  return (
    <>
      <section className={styles.hero}>
        <img className={styles.heroImagem} src="/images/site/para-terapeutas.png" alt="" />
        <div className={styles.heroGradiente} />
        <div className={styles.heroConteudo}>
          <h1 className={styles.heroHeadline}>Um espaço que continua cuidando entre as sessões.</h1>
          <p className={styles.heroTexto}>
            O Presença foi pensado para apoiar o trabalho terapêutico, oferecendo continuidade ao
            processo vivido no consultório.
          </p>
        </div>
      </section>

      <section className={styles.blocos}>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Continuidade</div>
          <div className={styles.blocoTexto}>
            O paciente pode registrar experiências importantes enquanto elas acontecem.
          </div>
        </div>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Organização</div>
          <div className={styles.blocoTexto}>
            As informações permanecem organizadas em uma linha do tempo, facilitando o acompanhamento.
          </div>
        </div>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Presença</div>
          <div className={styles.blocoTexto}>
            O processo terapêutico deixa de existir apenas durante a sessão e passa a acompanhar o
            paciente ao longo da semana.
          </div>
        </div>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Apoio</div>
          <div className={styles.blocoTexto}>
            O terapeuta continua sendo o centro do cuidado. O Presença existe para ampliar esse
            processo, nunca para substituí-lo.
          </div>
        </div>
      </section>

      <section className={styles.ctaSecao}>
        <a
          className={styles.cta}
          href={`https://wa.me/5551991393827?text=${MENSAGEM_WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Conhecer a plataforma para terapeutas
        </a>
      </section>
    </>
  );
}
