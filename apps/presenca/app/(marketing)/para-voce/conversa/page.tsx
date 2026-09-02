import styles from "../../PaginaFuncionalidade.module.css";

const OUTRAS = [
  { slug: "diario", nome: "Diário" },
  { slug: "livro-vivo", nome: "Livro Vivo" },
  { slug: "praticas", nome: "Práticas" },
];

export default function ConversaFuncionalidade() {
  return (
    <>
      <a className={styles.voltar} href="/para-voce">
        ← Para você
      </a>

      <section className={styles.intro}>
        <h1 className={styles.titulo}>Um espaço para chegar como você está.</h1>
        <p className={styles.lead}>
          Não é terapia, e não tenta parecer terapia. Acolhe, escuta, ajuda a regular um momento
          difícil — e devolve você pra própria vida, mais presente do que quando chegou.
        </p>
      </section>

      <section className={styles.blocos}>
        <div>
          <div className={styles.blocoTitulo}>Sem terapeuta conectado</div>
          <div className={styles.blocoTexto}>
            A própria obra acompanha você. A experiência continua completa — não é uma versão
            reduzida de nada.
          </div>
        </div>
        <div>
          <div className={styles.blocoTitulo}>Com terapeuta conectado</div>
          <div className={styles.blocoTexto}>
            Ele continua sendo o centro do cuidado. O Presença é uma ponte, nunca um substituto.
          </div>
        </div>
      </section>

      <section className={styles.destaque}>
        <p className={styles.destaqueTexto}>
          Quando a conversa chega a algum lugar de calma, ela mesma convida ao fechamento.
        </p>
      </section>

      <section className={styles.outras}>
        <p className={styles.outrasEyebrow}>Outros espaços</p>
        <div className={styles.outrasLinks}>
          {OUTRAS.map((o) => (
            <a key={o.slug} className={styles.outrasLink} href={`/para-voce/${o.slug}`}>
              {o.nome}
            </a>
          ))}
        </div>
        <a className={styles.cta} href="/para-voce#planos">
          Ver planos
        </a>
      </section>
    </>
  );
}
