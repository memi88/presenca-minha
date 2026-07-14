import styles from "./page.module.css";

export default function Sobre() {
  return (
    <>
      <section className={styles.intro}>
        <h1 className={styles.introTitulo}>Por que o Presença existe?</h1>
        <div className={styles.introTexto}>
          <p>
            Vivemos em um mundo onde quase tudo disputa nossa atenção.
            <br />
            Mas poucas coisas nos ajudam a voltar para nós mesmos.
          </p>
          <p>O Presença nasceu do desejo de criar um espaço simples, tranquilo e humano.</p>
          <p className={styles.introDestaque}>
            Um lugar onde a tecnologia não acelera a vida, mas ajuda a criar pausas.
          </p>
        </div>
      </section>

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Nossa visão</h2>
        <div className={styles.blocoTexto}>
          <p>Acreditamos que presença não é uma meta. É uma prática.</p>
          <p>
            E que pequenas conversas, registradas ao longo do tempo, podem revelar transformações que
            passariam despercebidas.
          </p>
        </div>
      </section>

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>O papel da tecnologia</h2>
        <div className={styles.blocoTexto}>
          <p>
            A inteligência artificial faz parte da plataforma. Mas ela permanece em segundo plano. O
            protagonista é sempre a pessoa.
          </p>
          <p>
            A tecnologia existe para facilitar a escuta, organizar registros e apoiar o processo —
            nunca para ocupar o lugar do terapeuta ou substituir a experiência humana.
          </p>
        </div>
      </section>

      <section className={styles.ctaSecao}>
        <p className={styles.ctaEyebrow}>Mais do que uma plataforma.</p>
        <p className={styles.ctaDestaque}>
          Um lugar para voltar sempre que você precisar de um instante consigo mesmo.
        </p>
        <a className={styles.cta} href="/bem-vindo">
          Começar
        </a>
      </section>
    </>
  );
}
