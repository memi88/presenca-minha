import styles from "../../PaginaFuncionalidade.module.css";

const OUTRAS = [
  { slug: "conversa", nome: "Conversa" },
  { slug: "diario", nome: "Diário" },
  { slug: "livro-vivo", nome: "Livro Vivo" },
];

export default function PraticasFuncionalidade() {
  return (
    <>
      <a className={styles.voltar} href="/para-voce">
        ← Para você
      </a>

      <section className={styles.intro}>
        <h1 className={styles.titulo}>Quando as palavras já não bastam.</h1>
        <p className={styles.lead}>
          Pequenos convites, como uma respiração guiada. Dá pra sair no meio a qualquer momento,
          sem que isso conte como desistência.
        </p>
      </section>

      <section className={styles.blocos}>
        <div>
          <div className={styles.blocoTitulo}>Sem metas, sem contadores</div>
          <div className={styles.blocoTexto}>Nenhuma prática vira estatística de progresso.</div>
        </div>
        <div>
          <div className={styles.blocoTitulo}>Cresce aos poucos</div>
          <div className={styles.blocoTexto}>
            Hoje a respiração 4-7-8, depois mais — sempre vivida antes de entrar.
          </div>
        </div>
      </section>

      <section className={styles.destaque}>
        <p className={styles.destaqueTexto}>Cada respiração já conta.</p>
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
