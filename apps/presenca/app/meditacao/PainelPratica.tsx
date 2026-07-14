import { PageHeader } from "../PageHeader";
import { guardarPratica } from "./[id]/actions";
import styles from "./PainelPratica.module.css";

export type ItemPratica = { id: string; titulo: string; slug: string | null; conteudo: string };

const SLUGS_INTERATIVOS: Record<string, string> = {
  "respiracao-4-7-8": "/folego",
};

export function rotaDePratica(pratica: ItemPratica): string {
  return (pratica.slug && SLUGS_INTERATIVOS[pratica.slug]) || `/meditacao/${pratica.id}`;
}

type Props = {
  variante: "lista" | "detalhe";
  nome: string;
  praticas: ItemPratica[];
  praticaAtiva: ItemPratica | null;
  jaGuardada: boolean;
};

// Dois painéis sempre visíveis no desktop (lista + prática lado a lado,
// igual ao mockup) — mesmo padrão do PainelLeitura (Livro Vivo). Fôlego é a
// única prática interativa hoje: em vez de embutir o círculo de respiração
// aqui dentro, o painel de conteúdo mostra só um convite pra abrir a
// experiência de tela cheia em /folego. `praticaAtiva` só vem preenchida
// vindo de `/meditacao/[id]` — a rota de lista pura nunca pré-seleciona.
export function PainelPratica({ variante, nome, praticas, praticaAtiva, jaGuardada }: Props) {
  const rotaAtiva = praticaAtiva ? rotaDePratica(praticaAtiva) : null;
  const interativa = rotaAtiva === "/folego";
  const paragrafos =
    praticaAtiva && !interativa ? praticaAtiva.conteudo.split(/\n{2,}/).filter(Boolean) : [];
  const varianteClasse = variante === "detalhe" ? styles.varianteDetalhe : styles.varianteLista;

  return (
    <main className={`${styles.scene} ${varianteClasse}`}>
      <PageHeader nome={nome} atual="pratica" voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.duasColunas}>
        <div className={styles.painelLista}>
          <p className={styles.eyebrow}>Práticas</p>
          <h1 className={styles.titulo}>
            Pequenas práticas,{" "}
            <br className={styles.quebra} />à vontade.
          </h1>
          <p className={styles.subtitulo}>escolha pelo tempo que você tem</p>

          <div className={styles.lista}>
            {praticas.map((pratica) => {
              const ativa = pratica.id === praticaAtiva?.id;
              return (
                <a
                  key={pratica.id}
                  href={rotaDePratica(pratica)}
                  className={`${styles.item} ${ativa ? styles.itemAtivo : ""}`}
                >
                  <span className={styles.itemIcone} aria-hidden="true" />
                  <span className={styles.itemTitulo}>{pratica.titulo}</span>
                </a>
              );
            })}
          </div>
        </div>

        <div className={styles.painelConteudo}>
          {!praticaAtiva ? (
            <p className={styles.convite}>escolha uma prática ao lado.</p>
          ) : interativa ? (
            <>
              <a className={styles.voltarMobileDetalhe} href="/meditacao">
                ‹ Práticas
              </a>
              <div className={styles.cartaoInterativo}>
                <h2 className={styles.tituloLeitura}>{praticaAtiva.titulo}</h2>
                <p className={styles.descricaoInterativa}>Uma prática guiada, no seu ritmo.</p>
                <a className={styles.abrirPratica} href="/folego">
                  abrir prática →
                </a>
              </div>
            </>
          ) : (
            <>
              <a className={styles.voltarMobileDetalhe} href="/meditacao">
                ‹ Práticas
              </a>
              <h2 className={styles.tituloLeitura}>{praticaAtiva.titulo}</h2>
              <div className={styles.corpo}>
                {paragrafos.map((paragrafo, i) => (
                  <p key={i} className={styles.paragrafo}>
                    {paragrafo}
                  </p>
                ))}
              </div>
              <div className={styles.rodape}>
                {jaGuardada ? (
                  <span className={styles.guardado}>guardado no seu diário ✓</span>
                ) : (
                  <form action={guardarPratica.bind(null, praticaAtiva.id)}>
                    <button className={styles.guardar} type="submit">
                      guardar esta prática
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
