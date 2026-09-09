import styles from "../../PaginaFuncionalidade.module.css";

const OUTRAS = [
  { slug: "conversa", nome: "Conversa" },
  { slug: "diario", nome: "Diário" },
  { slug: "praticas", nome: "Práticas" },
];

export default function LivroVivoFuncionalidade() {
  return (
    <>
      <a className={styles.voltar} href="/para-voce">
        ← Para você
      </a>

      <section className={styles.intro}>
        <h1 className={styles.titulo}>Descobertas que permaneceram.</h1>
        <p className={styles.lead}>
          Reflexões e histórias escritas por quem faz o Presença — nunca pelos próprios usuários.
          Sem feed, sem curtida, sem comentário.
        </p>
      </section>

      <section className={styles.blocos}>
        <div>
          <div className={styles.blocoTitulo}>Por momento de vida</div>
          <div className={styles.blocoTexto}>
            Organizado pelo que você está vivendo agora, não por categoria técnica.
          </div>
        </div>
        <div>
          <div className={styles.blocoTitulo}>Nenhuma prática entra sem ter sido vivida</div>
          <div className={styles.blocoTexto}>Cada página só existe depois de amadurecida de verdade.</div>
        </div>
      </section>

      <section className={styles.destaque}>
        <p className={styles.destaqueTexto}>Nenhuma linguagem possui a verdade — só lentes, nunca doutrina.</p>
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
