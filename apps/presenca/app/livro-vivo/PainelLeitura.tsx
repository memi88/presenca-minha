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

// Ícone de "conteúdo de leitura" — mesmo papel do círculo com play das
// Práticas (affordance de clique), só que representando página/livro em
// vez de reprodução. currentColor: a cor vem de quem envolve o ícone.
function IconeLivro({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M3 5.5c2-1 5-1.4 9 1 4-2.4 7-2 9-1v12c-2-1-5-1.4-9 1-4-2.4-7-2-9-1v-12Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M12 6.5v12" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

// Estado de seleção (nenhuma leitura ativa) — coluna única centralizada na
// tela, título grande, cada página como card clicável. Sem texto de apoio:
// o item disponível é o elemento dominante da tela. `.listaGrande` já
// aceita 1 ou N itens sem quebrar visualmente — quando o catálogo passar de
// ~3-4 páginas, isso migra pra um padrão de lista/grade com ordenação por
// recomendação (não implementado ainda, ver instruções de UX).
function TelaSelecao({ nome, paginas }: { nome: string; paginas: ItemPagina[] }) {
  return (
    <main className={styles.scene}>
      <PageHeader nome={nome} atual="livro" voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.selecaoCentro}>
        <p className={styles.eyebrow}>Livro Vivo</p>
        <h1 className={styles.tituloSelecao}>
          Leituras para{" "}
          <br className={styles.quebra} />
          atravessar o dia.
        </h1>

        <div className={styles.listaGrande}>
          {paginas.map((pagina) => (
            <a key={pagina.id} href={`/livro-vivo/${pagina.id}`} className={styles.itemGrande}>
              <span className={styles.itemGrandeIcone} aria-hidden="true">
                <IconeLivro />
              </span>
              <span className={styles.itemGrandeTextos}>
                <span className={styles.itemGrandeTitulo}>{pagina.titulo}</span>
                <span className={styles.itemGrandeMeta}>{minutosDeLeitura(pagina.conteudo)} min de leitura →</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

// Dois painéis lado a lado no desktop (lista + leitura, igual ao mockup) —
// só existe quando já há uma leitura ativa; o estado de escolha (nada
// selecionado ainda) é a TelaSelecao acima, não este componente.
function TelaDetalhe({
  nome,
  paginas,
  paginaAtiva,
  jaGuardada,
}: {
  nome: string;
  paginas: ItemPagina[];
  paginaAtiva: ItemPagina;
  jaGuardada: boolean;
}) {
  const paragrafos = paginaAtiva.conteudo.split(/\n{2,}/).filter(Boolean);

  return (
    <main className={styles.scene}>
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
              const ativa = pagina.id === paginaAtiva.id;
              return (
                <a
                  key={pagina.id}
                  href={`/livro-vivo/${pagina.id}`}
                  className={`${styles.item} ${ativa ? styles.itemAtivo : ""}`}
                >
                  <span className={styles.itemIcone} aria-hidden="true">
                    <IconeLivro />
                  </span>
                  <span className={styles.itemTextos}>
                    <span className={styles.itemTitulo}>{pagina.titulo}</span>
                    <span className={styles.itemMeta}>
                      {minutosDeLeitura(pagina.conteudo)} min{ativa ? " · lendo agora" : " de leitura →"}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        <div className={styles.painelConteudo}>
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
        </div>
      </div>
    </main>
  );
}

export function PainelLeitura({ nome, paginas, paginaAtiva, jaGuardada }: Props) {
  if (!paginaAtiva) return <TelaSelecao nome={nome} paginas={paginas} />;
  return <TelaDetalhe nome={nome} paginas={paginas} paginaAtiva={paginaAtiva} jaGuardada={jaGuardada} />;
}
