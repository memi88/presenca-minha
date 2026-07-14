import styles from "../PaginaAudiencia.module.css";

export default function ParaVoce() {
  return (
    <>
      <section className={styles.hero}>
        <img className={styles.heroImagem} src="/images/site/para-voce.png" alt="" />
        <div className={styles.heroGradiente} />
        <div className={styles.heroConteudo}>
          <h1 className={styles.heroHeadline}>Um espaço para continuar a conversa consigo mesmo.</h1>
          <p className={styles.heroTexto}>
            Nem sempre conseguimos organizar tudo o que sentimos. O Presença oferece um lugar
            tranquilo para registrar pensamentos, emoções, experiências e acompanhar seu próprio
            caminho.
          </p>
        </div>
      </section>

      <section className={styles.blocos}>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Reflexões</div>
          <div className={styles.blocoTexto}>Um espaço para escrever e registrar aquilo que está vivo.</div>
        </div>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Conversas</div>
          <div className={styles.blocoTexto}>Um ambiente que acolhe perguntas e incentiva a escuta de si mesmo.</div>
        </div>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Registro da caminhada</div>
          <div className={styles.blocoTexto}>
            Com o tempo, é possível revisitar momentos, perceber mudanças e reconhecer o próprio
            processo.
          </div>
        </div>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Continuidade</div>
          <div className={styles.blocoTexto}>Porque o desenvolvimento não acontece apenas durante uma sessão.</div>
        </div>
      </section>

      <section className={styles.ctaSecao}>
        <a className={styles.cta} href="/bem-vindo">
          Conhecer o Presença
        </a>
      </section>
    </>
  );
}
