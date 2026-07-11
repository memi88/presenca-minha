import styles from "./page.module.css";

// Página pública, sem guard de sessão — linkada em /bem-vindo e /chegada,
// antes de qualquer login de verdade acontecer.
export default function LimitesDeCuidado() {
  return (
    <main className={styles.scene}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>antes de começar</p>
        <h1 className={styles.headline}>Limites de cuidado</h1>

        <p className={styles.paragrafo}>
          O Presença é um espaço de acompanhamento contínuo — um lugar pra guardar o que fica entre um
          momento e outro da sua vida. Ele não é, e não substitui, atendimento profissional de saúde mental.
          Nada aqui faz diagnóstico, e nada aqui deveria ser lido como orientação clínica.
        </p>

        <h2 className={styles.secao}>Se você estiver em um momento difícil agora</h2>
        <p className={styles.paragrafo}>
          O Presença não é um serviço de emergência. Recursos de ajuda imediata (CVV, SAMU) ficam sempre
          disponíveis, em qualquer momento da sua jornada, com ou sem profissional conectado — veja em{" "}
          <a className={styles.link} href="/recursos">
            recursos de cuidado
          </a>
          .
        </p>

        <h2 className={styles.secao}>Se você conectar com um profissional</h2>
        <p className={styles.paragrafo}>
          A conexão é sempre uma escolha sua, feita dentro de "Terapia" — nunca no cadastro inicial. Nesse
          momento, você é avisado sobre o que passa a ser compartilhado (o profissional pode escrever no seu
          Diário; você pode avisar ele caso precise de apoio). Fora isso, o que você escreve continua seu.
        </p>

        <h2 className={styles.secao}>Seus dados</h2>
        <p className={styles.paragrafo}>
          Como guardamos e usamos o que você compartilha aqui está detalhado na nossa{" "}
          <a className={styles.link} href="/privacidade">
            política de privacidade
          </a>
          .
        </p>

        <a className={styles.voltar} href="/home">
          ← voltar
        </a>
      </div>
    </main>
  );
}
