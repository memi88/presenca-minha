import { PageHeader } from "../PageHeader";
import { guardarLeitura } from "./[id]/actions";
import styles from "./PainelLeitura.module.css";

export type ItemPagina = { id: string; titulo: string; conteudo: string };

type Props = {
  variante: "lista" | "detalhe";
  nome: string;
  paginas: ItemPagina[];
  paginaAtiva: ItemPagina | null;
  jaGuardada: boolean;
};

const PALAVRAS_POR_MINUTO = 200;

function minutosDeLeitura(conteudo: string): number {
  const palavras = conteudo.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO));
}

// Dois painéis sempre visíveis no desktop (lista + leitura lado a lado,
// igual ao mockup) — no mobile, cada rota (`/livro-vivo` e
// `/livro-vivo/[id]`) mostra só o painel que já mostrava antes. Sem estado
// de cliente: as duas rotas continuam existindo e navegáveis normalmente,
// só que ambas renderizam este mesmo componente, cada uma com um item
// diferente marcado como ativo. `paginaAtiva` só vem preenchida vindo de
// `/livro-vivo/[id]` — a rota de lista pura (`/livro-vivo`) nunca
// pré-seleciona nada, passa `null`.
export function PainelLeitura({ variante, nome, paginas, paginaAtiva, jaGuardada }: Props) {
  const paragrafos = paginaAtiva ? paginaAtiva.conteudo.split(/\n{2,}/).filter(Boolean) : [];
  const varianteClasse = variante === "detalhe" ? styles.varianteDetalhe : styles.varianteLista;

  return (
    <main className={`${styles.scene} ${varianteClasse}`}>
      <PageHeader nome={nome} atual="livro" voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.duasColunas}>
        <div className={styles.painelLista}>
          <p className={styles.eyebrow}>Livro Vivo</p>
          <h1 className={styles.titulo}>
            Leituras para{" "}
            <br className={styles.quebra} />
            atravessar o dia.
          </h1>

          <div className={styles.lista}>
            {paginas.map((pagina) => {
              const ativa = pagina.id === paginaAtiva?.id;
              return (
                <a
                  key={pagina.id}
                  href={`/livro-vivo/${pagina.id}`}
                  className={`${styles.item} ${ativa ? styles.itemAtivo : ""}`}
                >
                  <div className={styles.itemTitulo}>{pagina.titulo}</div>
                  <div className={styles.itemMeta}>
                    {minutosDeLeitura(pagina.conteudo)} min{ativa ? " · lendo agora" : " de leitura"}
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        <div className={styles.painelConteudo}>
          {paginaAtiva ? (
            <>
              <a className={styles.voltarMobileDetalhe} href="/livro-vivo">
                ‹ Livro Vivo
              </a>
              <h2 className={styles.tituloLeitura}>{paginaAtiva.titulo}</h2>
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
                  <form action={guardarLeitura.bind(null, paginaAtiva.id)}>
                    <button className={styles.guardar} type="submit">
                      guardar esta leitura
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <p className={styles.convite}>escolha uma leitura ao lado.</p>
          )}
        </div>
      </div>
    </main>
  );
}
