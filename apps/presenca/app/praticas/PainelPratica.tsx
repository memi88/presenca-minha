import { CATEGORIAS_PRATICA, type CategoriaPratica } from "@/lib/categoriasPratica";
import { PLACEHOLDER_PRATICA, imagemUrl } from "@/lib/placeholders";

import { AutoriaBiblioteca } from "../AutoriaBiblioteca";
import { IconeSetaEsquerda } from "../IconeSetaEsquerda";
import { PageHeader } from "../PageHeader";
import { guardarPratica } from "./[id]/actions";
import { FolegoInline } from "./FolegoInline";
import { IconeCategoria } from "./IconeCategoria";
import styles from "./PainelPratica.module.css";

export type ItemPratica = {
  id: string;
  titulo: string | null;
  slug: string | null;
  conteudo: string;
  categoria?: string | null;
  capaChave?: string | null;
  profissionalAutorId?: string | null;
  profissionalAutor?: { nome: string; tipo: string | null; formaDeTrabalho: string | null } | null;
};

function rotuloCategoria(categoria: string | null | undefined): string | null {
  return CATEGORIAS_PRATICA.find((c) => c.valor === categoria)?.rotulo ?? null;
}

// Corta o corpo da prática num preview curto pro card da grade — sempre em
// fronteira de palavra, nunca no meio (mesmo padrão de app/home/page.tsx).
function trecho(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  return `${corte.slice(0, corte.lastIndexOf(" "))}…`;
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
  // nome/praticas só importam pra TelaSelecao (variante "lista") — a rota
  // de detalhe (/praticas/[id]) não passa isso, já que TelaDetalhe não tem
  // lista lateral nem PageHeader. categoriaAtiva importa pros dois: filtra
  // a grade em TelaSelecao e preserva o filtro no link de voltar de
  // TelaDetalhe.
  nome?: string;
  praticas?: ItemPratica[];
  praticaAtiva: ItemPratica | null;
  jaGuardada: boolean;
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
  categoriaAtiva,
}: {
  nome: string;
  praticas: ItemPratica[];
  categoriaAtiva: string | null;
}) {
  const praticasFiltradas = categoriaAtiva
    ? praticas.filter((p) => p.categoria === categoriaAtiva)
    : praticas;

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Práticas" nome={nome} atual="pratica" voltar={{ href: "/home" }} />
      <div className={styles.selecaoCentro}>
        <h2 className={styles.tituloSelecao}>
          Pequenas práticas,{" "}
          <br className={styles.quebra} />à vontade.
        </h2>
        <p className={styles.subtitulo}>Escolha pelo tempo que você tem</p>

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
                href={
                  categoriaAtiva ? `${rotaDePratica(pratica)}?categoria=${categoriaAtiva}` : rotaDePratica(pratica)
                }
                className={styles.cardFoto}
                style={{ backgroundImage: `url(${imagemUrl(pratica.capaChave, PLACEHOLDER_PRATICA)})` }}
              >
                <div className={styles.cardFotoOverlay}>
                  {rotuloCategoria(pratica.categoria) && (
                    <span className={styles.cardFotoCategoria}>
                      <IconeCategoria
                        categoria={pratica.categoria as CategoriaPratica}
                        className={styles.cardFotoCategoriaIcone}
                      />
                      {rotuloCategoria(pratica.categoria)}
                    </span>
                  )}
                  <span className={styles.cardFotoTitulo}>{pratica.titulo}</span>
                  <span className={styles.cardFotoTexto}>{trecho(pratica.conteudo, 90)}</span>
                  <span className={styles.cardFotoCta}>
                    Iniciar
                    <svg
                      className={styles.cardFotoCtaIcone}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// Foto hero + coluna única, foco numa prática só — sem lista de outras
// práticas ao lado (docs/redesign/detalhes_da_pr_tica_h_brido). Pra ver
// outra prática, volta pra grade (TelaSelecao) — decisão explícita, troca
// a navegação lateral por fidelidade ao mockup.
function TelaDetalhe({
  praticaAtiva,
  jaGuardada,
  mostrarCtaConectar,
  categoriaAtiva,
}: {
  praticaAtiva: ItemPratica;
  jaGuardada: boolean;
  mostrarCtaConectar: boolean;
  categoriaAtiva: string | null;
}) {
  const interativa = ehPraticaInterativa(praticaAtiva);
  const paragrafos = !interativa ? praticaAtiva.conteudo.split(/\n{2,}/).filter(Boolean) : [];
  const voltarHref = categoriaAtiva ? `/praticas?categoria=${categoriaAtiva}` : "/praticas";

  // Prática interativa (FolegoInline) já tem sua própria experiência
  // completa (cartão pra começar → cena escura imersiva) — não precisa da
  // foto hero por cima, só o botão de voltar flutuante.
  if (interativa) {
    return (
      <main className={styles.detalheScene}>
        <a className={styles.voltarFlutuante} href={voltarHref} aria-label="Voltar para práticas">
          <IconeSetaEsquerda />
        </a>
        <div className={styles.detalheInterativo}>
          <FolegoInline titulo={praticaAtiva.titulo ?? ""} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.detalheScene}>
      <a className={styles.voltarFlutuante} href={voltarHref} aria-label="Voltar para práticas">
        <IconeSetaEsquerda />
      </a>
      <div
        className={styles.detalheHero}
        style={{ backgroundImage: `url(${imagemUrl(praticaAtiva.capaChave, PLACEHOLDER_PRATICA)})` }}
        aria-hidden="true"
      />
      <div className={styles.detalheConteudo}>
        {rotuloCategoria(praticaAtiva.categoria) && (
          <p className={styles.detalheCategoria}>{rotuloCategoria(praticaAtiva.categoria)}</p>
        )}
        <h1 className={styles.tituloLeitura}>{praticaAtiva.titulo}</h1>
        <div className={styles.corpo}>
          {paragrafos.map((paragrafo, i) => (
            <p key={i} className={styles.paragrafo}>
              {paragrafo}
            </p>
          ))}
        </div>
        {praticaAtiva.profissionalAutorId && praticaAtiva.profissionalAutor && (
          <AutoriaBiblioteca
            profissionalId={praticaAtiva.profissionalAutorId}
            nome={praticaAtiva.profissionalAutor.nome}
            tipo={praticaAtiva.profissionalAutor.tipo ?? "Outra"}
            formaDeTrabalho={praticaAtiva.profissionalAutor.formaDeTrabalho}
            mostrarCta={mostrarCtaConectar}
          />
        )}
        <div className={styles.rodape}>
          {jaGuardada ? (
            <span className={styles.guardado}>Guardado no seu diário ✓</span>
          ) : (
            <form action={guardarPratica.bind(null, praticaAtiva.id)}>
              <button className={styles.guardar} type="submit">
                Guardar esta prática
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export function PainelPratica({
  nome = "",
  praticas = [],
  praticaAtiva,
  jaGuardada,
  mostrarCtaConectar,
  categoriaAtiva = null,
}: Props) {
  if (!praticaAtiva) {
    return <TelaSelecao nome={nome} praticas={praticas} categoriaAtiva={categoriaAtiva} />;
  }
  return (
    <TelaDetalhe
      praticaAtiva={praticaAtiva}
      jaGuardada={jaGuardada}
      mostrarCtaConectar={mostrarCtaConectar}
      categoriaAtiva={categoriaAtiva}
    />
  );
}
