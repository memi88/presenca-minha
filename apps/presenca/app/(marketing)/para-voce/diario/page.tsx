import styles from "../../PaginaFuncionalidade.module.css";

const OUTRAS = [
  { slug: "conversa", nome: "Conversa" },
  { slug: "livro-vivo", nome: "Livro Vivo" },
  { slug: "praticas", nome: "Práticas" },
];

export default function DiarioFuncionalidade() {
  return (
    <>
      <a className={styles.voltar} href="/para-voce">
        ← Para você
      </a>

      <section className={styles.intro}>
        <h1 className={styles.titulo}>Um lugar que não cobra nada de volta.</h1>
        <p className={styles.lead}>
          Página em branco, de verdade. O espaço mais silencioso do Presença — quase não sugere
          nada, de propósito.
        </p>
      </section>

      <section className={styles.blocos}>
        <div>
          <div className={styles.blocoTitulo}>Autoria sempre clara</div>
          <div className={styles.blocoTexto}>
            O que seu terapeuta deixa aqui nunca se confunde com o que você escreveu.
          </div>
        </div>
        <div>
          <div className={styles.blocoTitulo}>Revisitar quando quiser</div>
          <div className={styles.blocoTexto}>
            Marque algo pra voltar depois — o Presença pode perceber sozinho quando algo novo
            conversa com aquilo.
          </div>
        </div>
      </section>

      <section className={styles.destaque}>
        <p className={styles.destaqueTexto}>Só ficar aqui um instante já é uma resposta válida.</p>
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
