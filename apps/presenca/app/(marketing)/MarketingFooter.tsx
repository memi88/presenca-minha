import styles from "./MarketingFooter.module.css";

export function MarketingFooter() {
  return (
    <footer className={styles.footer}>
      <span className={styles.wordmark}>presença · uma obra em construção</span>
      <div className={styles.links}>
        <a className={styles.link} href="/para-voce">
          Para você
        </a>
        <a className={styles.link} href="/para-terapeutas">
          Para terapeutas
        </a>
        <a className={styles.link} href="/sobre">
          Sobre
        </a>
      </div>
    </footer>
  );
}
