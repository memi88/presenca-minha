import styles from "./Funcionalidades.module.css";

// A camada mais profunda dentro de /para-voce (decisão de arquitetura:
// público continua no topo — Para você / Para terapeutas — e funcionalidade
// vira aprofundamento, não item de menu). Cada item tem página própria em
// /para-voce/[nome], mas nada disso aparece no header nem no footer.
const FUNCIONALIDADES = [
  {
    slug: "conversa",
    titulo: "Conversa",
    texto: "Chega como estiver. Acolhe, ajuda a regular um momento difícil, e sabe a hora de se encerrar.",
  },
  {
    slug: "diario",
    titulo: "Diário",
    texto: "Página em branco de verdade. O que seu terapeuta deixa aqui vem sempre identificado.",
  },
  {
    slug: "livro-vivo",
    titulo: "Livro Vivo",
    texto: "Reflexões e histórias vividas antes de virarem texto, organizadas por momento de vida.",
  },
  {
    slug: "praticas",
    titulo: "Práticas",
    texto: "Pequenos convites, como uma respiração guiada. Dá pra sair no meio a qualquer momento.",
  },
];

export function Funcionalidades() {
  return (
    <section className={styles.secao}>
      <p className={styles.eyebrow}>Como isso se organiza, por dentro</p>
      <h2 className={styles.titulo}>Quatro espaços, um só ritmo</h2>
      <div className={styles.grid}>
        {FUNCIONALIDADES.map((f) => (
          <a key={f.slug} className={styles.item} href={`/para-voce/${f.slug}`}>
            <div className={styles.itemTitulo}>{f.titulo}</div>
            <p className={styles.itemTexto}>{f.texto}</p>
            <span className={styles.itemLink}>Saiba mais →</span>
          </a>
        ))}
      </div>
    </section>
  );
}
