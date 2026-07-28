import { PageHeader } from "../PageHeader";
import { guardarPratica } from "./[id]/actions";
import styles from "./PainelPratica.module.css";

export type ItemPratica = { id: string; titulo: string; slug: string | null; conteudo: string };

const SLUGS_INTERATIVOS: Record<string, string> = {
  "respiracao-4-7-8": "/folego",
};

export function rotaDePratica(pratica: ItemPratica): string {
  return (pratica.slug && SLUGS_INTERATIVOS[pratica.slug]) || `/praticas/${pratica.id}`;
}

type Props = {
  variante: "lista" | "detalhe";
  nome: string;
  praticas: ItemPratica[];
  praticaAtiva: ItemPratica | null;
  jaGuardada: boolean;
};

// Estado de seleção (nenhuma prática ativa) — coluna única centralizada na
// tela, título grande, cada prática como card clicável. Sem texto de apoio:
// o item disponível é o elemento dominante da tela. `.listaGrande` já
// aceita 1 ou N itens sem quebrar visualmente — quando o catálogo passar de
// ~3-4 práticas, isso migra pra um padrão de lista/grade com ordenação por
// recomendação (não implementado ainda, ver instruções de UX).
function TelaSelecao({ nome, praticas }: { nome: string; praticas: ItemPratica[] }) {
  return (
    <main className={styles.scene}>
      <PageHeader nome={nome} atual="pratica" voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.selecaoCentro}>
        <p className={styles.eyebrow}>Práticas</p>
        <h1 className={styles.tituloSelecao}>
          Pequenas práticas,{" "}
          <br className={styles.quebra} />à vontade.
        </h1>
        <p className={styles.subtitulo}>escolha pelo tempo que você tem</p>

        <div className={styles.listaGrande}>
          {praticas.map((pratica) => (
            <a key={pratica.id} href={rotaDePratica(pratica)} className={styles.itemGrande}>
              <span className={styles.itemGrandeIcone} aria-hidden="true" />
              <span className={styles.itemGrandeTitulo}>{pratica.titulo}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

// Dois painéis lado a lado no desktop (lista + prática, igual ao Livro
// Vivo) — só existe quando já há uma prática ativa; o estado de escolha
// (nada selecionado ainda) é a TelaSelecao acima, não este componente.
function TelaDetalhe({
  nome,
  praticas,
  praticaAtiva,
  jaGuardada,
}: {
  nome: string;
  praticas: ItemPratica[];
  praticaAtiva: ItemPratica;
  jaGuardada: boolean;
}) {
  const interativa = rotaDePratica(praticaAtiva) === "/folego";
  const paragrafos = !interativa ? praticaAtiva.conteudo.split(/\n{2,}/).filter(Boolean) : [];

  return (
    <main className={styles.scene}>
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
              const ativa = pratica.id === praticaAtiva.id;
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
          {interativa ? (
            <>
              <a className={styles.voltarMobileDetalhe} href="/praticas">
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
              <a className={styles.voltarMobileDetalhe} href="/praticas">
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

export function PainelPratica({ nome, praticas, praticaAtiva, jaGuardada }: Props) {
  if (!praticaAtiva) return <TelaSelecao nome={nome} praticas={praticas} />;
  return <TelaDetalhe nome={nome} praticas={praticas} praticaAtiva={praticaAtiva} jaGuardada={jaGuardada} />;
}
