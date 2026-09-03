import { CATEGORIAS_PRATICA } from "@/lib/categoriasPratica";
import { PLACEHOLDER_PRATICA } from "@/lib/placeholders";

import { AutoriaBiblioteca } from "../AutoriaBiblioteca";
import { IntroEspaco } from "../IntroEspaco";
import { PageHeader } from "../PageHeader";
import { guardarPratica } from "./[id]/actions";
import { FolegoInline } from "./FolegoInline";
import styles from "./PainelPratica.module.css";

export type ItemPratica = {
  id: string;
  titulo: string;
  slug: string | null;
  conteudo: string;
  categoria?: string | null;
  profissional_autor_id?: string | null;
  profissionais?: { nome: string; tipo: string; forma_de_trabalho: string | null } | null;
};

function rotuloCategoria(categoria: string | null | undefined): string | null {
  return CATEGORIAS_PRATICA.find((c) => c.valor === categoria)?.rotulo ?? null;
}

// Slugs cuja prática é uma experiência interativa embutida (FolegoInline),
// não um texto pra ler — hoje só a respiração 4-7-8. Não é mais uma rota
// própria (/folego foi absorvida aqui, ver FolegoInline.tsx).
const SLUGS_INTERATIVOS = new Set(["respiracao-4-7-8"]);

export function rotaDePratica(pratica: ItemPratica): string {
  return `/praticas/${pratica.id}`;
}

export function ehPraticaInterativa(pratica: ItemPratica): boolean {
  return !!pratica.slug && SLUGS_INTERATIVOS.has(pratica.slug);
}

type Props = {
  variante: "lista" | "detalhe";
  nome: string;
  praticas: ItemPratica[];
  praticaAtiva: ItemPratica | null;
  jaGuardada: boolean;
  introExpandidaInicialmente: boolean;
  mostrarCtaConectar: boolean;
  categoriaAtiva?: string | null;
};

// Estado de seleção (nenhuma prática ativa) — grade de cards de foto
// (placeholder até imagem real existir) com filtro por categoria em
// pílula, igual ao mockup docs/redesign/biblioteca_de_pr_ticas_imersiva_e_padronizada.
// Filtro via query string (?categoria=x), server-rendered — mesmo padrão
// de /admin/biblioteca, sem precisar de client component novo.
function TelaSelecao({
  nome,
  praticas,
  introExpandidaInicialmente,
  categoriaAtiva,
}: {
  nome: string;
  praticas: ItemPratica[];
  introExpandidaInicialmente: boolean;
  categoriaAtiva: string | null;
}) {
  const praticasFiltradas = categoriaAtiva
    ? praticas.filter((p) => p.categoria === categoriaAtiva)
    : praticas;

  return (
    <main className={styles.scene}>
      <PageHeader nome={nome} atual="pratica" voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.selecaoCentro}>
        <IntroEspaco espaco="praticas" expandidaInicialmente={introExpandidaInicialmente} />
        <p className={styles.eyebrow}>Práticas</p>
        <h1 className={styles.tituloSelecao}>
          Pequenas práticas,{" "}
          <br className={styles.quebra} />à vontade.
        </h1>
        <p className={styles.subtitulo}>escolha pelo tempo que você tem</p>

        <div className={styles.filtros}>
          <a href="/praticas" className={`${styles.filtroPill} ${!categoriaAtiva ? styles.filtroPillAtivo : ""}`}>
            todas
          </a>
          {CATEGORIAS_PRATICA.map((cat) => (
            <a
              key={cat.valor}
              href={`/praticas?categoria=${cat.valor}`}
              className={`${styles.filtroPill} ${categoriaAtiva === cat.valor ? styles.filtroPillAtivo : ""}`}
            >
              {cat.rotulo.toLowerCase()}
            </a>
          ))}
        </div>

        {praticasFiltradas.length === 0 ? (
          <p className={styles.vazio}>Nenhuma prática nessa categoria ainda.</p>
        ) : (
          <div className={styles.grade}>
            {praticasFiltradas.map((pratica) => (
              <a
                key={pratica.id}
                href={rotaDePratica(pratica)}
                className={styles.cardFoto}
                style={{ backgroundImage: `url(${PLACEHOLDER_PRATICA})` }}
              >
                <div className={styles.cardFotoOverlay}>
                  {rotuloCategoria(pratica.categoria) && (
                    <span className={styles.cardFotoCategoria}>{rotuloCategoria(pratica.categoria)}</span>
                  )}
                  <span className={styles.cardFotoTitulo}>{pratica.titulo}</span>
                </div>
              </a>
            ))}
          </div>
        )}
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
  introExpandidaInicialmente,
  mostrarCtaConectar,
}: {
  nome: string;
  praticas: ItemPratica[];
  praticaAtiva: ItemPratica;
  jaGuardada: boolean;
  introExpandidaInicialmente: boolean;
  mostrarCtaConectar: boolean;
}) {
  const interativa = ehPraticaInterativa(praticaAtiva);
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
              <IntroEspaco espaco="praticas" expandidaInicialmente={introExpandidaInicialmente} />
              <FolegoInline titulo={praticaAtiva.titulo} />
            </>
          ) : (
            <>
              <a className={styles.voltarMobileDetalhe} href="/praticas">
                ‹ Práticas
              </a>
              <IntroEspaco espaco="praticas" expandidaInicialmente={introExpandidaInicialmente} />
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
              {praticaAtiva.profissional_autor_id && praticaAtiva.profissionais && (
                <AutoriaBiblioteca
                  profissionalId={praticaAtiva.profissional_autor_id}
                  nome={praticaAtiva.profissionais.nome}
                  tipo={praticaAtiva.profissionais.tipo}
                  formaDeTrabalho={praticaAtiva.profissionais.forma_de_trabalho}
                  mostrarCta={mostrarCtaConectar}
                />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export function PainelPratica({
  nome,
  praticas,
  praticaAtiva,
  jaGuardada,
  introExpandidaInicialmente,
  mostrarCtaConectar,
  categoriaAtiva = null,
}: Props) {
  if (!praticaAtiva) {
    return (
      <TelaSelecao
        nome={nome}
        praticas={praticas}
        introExpandidaInicialmente={introExpandidaInicialmente}
        categoriaAtiva={categoriaAtiva}
      />
    );
  }
  return (
    <TelaDetalhe
      nome={nome}
      praticas={praticas}
      praticaAtiva={praticaAtiva}
      jaGuardada={jaGuardada}
      introExpandidaInicialmente={introExpandidaInicialmente}
      mostrarCtaConectar={mostrarCtaConectar}
    />
  );
}
