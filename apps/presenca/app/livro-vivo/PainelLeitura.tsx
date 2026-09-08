import { MOMENTOS_VIDA, type MomentoVida } from "@/lib/momentosVida";
import { PLACEHOLDER_LIVRO_VIVO, imagemUrl } from "@/lib/placeholders";

import { AutoriaBiblioteca } from "../AutoriaBiblioteca";
import { IconeSetaEsquerda } from "../IconeSetaEsquerda";
import { PageHeader } from "../PageHeader";
import { guardarLeitura } from "./[id]/actions";
import styles from "./PainelLeitura.module.css";

export type ItemPagina = {
  id: string;
  titulo: string | null;
  conteudo: string;
  capaChave?: string | null;
  profissionalAutorId?: string | null;
  profissionalAutor?: { nome: string; tipo: string | null; formaDeTrabalho: string | null } | null;
};

type Props = {
  // nome só importa pra TelaSelecao — a rota de detalhe (/livro-vivo/[id])
  // não passa isso, já que TelaDetalhe não tem lista lateral nem
  // PageHeader. momentoAtivo importa pros dois: filtra a grade em
  // TelaSelecao e preserva o filtro no link de voltar de TelaDetalhe.
  nome?: string;
  paginas?: ItemPagina[];
  paginaAtiva: ItemPagina | null;
  jaGuardada: boolean;
  mostrarCtaConectar: boolean;
  momentoAtivo?: MomentoVida | null;
};

const PALAVRAS_POR_MINUTO = 200;

function minutosDeLeitura(conteudo: string): number {
  const palavras = conteudo.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO));
}

// Corta o corpo da página num preview curto pro card da grade — sempre em
// fronteira de palavra, nunca no meio (mesmo padrão de app/home/page.tsx).
function trecho(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  return `${corte.slice(0, corte.lastIndexOf(" "))}…`;
}

// Estado de seleção (nenhuma leitura ativa) — grade de cards de foto
// (placeholder até imagem real existir, ver PLACEHOLDER_LIVRO_VIVO), igual
// ao mockup docs/redesign/acervo_do_livro_vivo_atmosfera_quarto — trocou a
// lista de texto de antes (comentário antigo já registrava isso como
// pendência).
function TelaSelecao({
  nome,
  paginas,
  momentoAtivo,
}: {
  nome: string;
  paginas: ItemPagina[];
  momentoAtivo: MomentoVida | null;
}) {
  return (
    <main className={styles.scene}>
      <PageHeader titulo="Livro Vivo" nome={nome} atual="livro" voltar={{ href: "/home" }} />
      <div className={styles.selecaoCentro}>
        <div className={styles.filtros}>
          <a
            href="/livro-vivo"
            className={`${styles.filtroPill} ${!momentoAtivo ? styles.filtroPillAtivo : ""}`}
          >
            Todos os momentos
          </a>
          {MOMENTOS_VIDA.map((m) => (
            <a
              key={m.valor}
              href={`/livro-vivo?momento=${m.valor}`}
              className={`${styles.filtroPill} ${momentoAtivo === m.valor ? styles.filtroPillAtivo : ""}`}
            >
              {m.rotulo}
            </a>
          ))}
        </div>

        <div className={styles.grade}>
          {paginas.map((pagina) => (
            <a
              key={pagina.id}
              href={momentoAtivo ? `/livro-vivo/${pagina.id}?momento=${momentoAtivo}` : `/livro-vivo/${pagina.id}`}
              className={styles.cardFoto}
              style={{ backgroundImage: `url(${imagemUrl(pagina.capaChave, PLACEHOLDER_LIVRO_VIVO)})` }}
            >
              <div className={styles.cardFotoOverlay}>
                <span className={styles.cardFotoMeta}>{minutosDeLeitura(pagina.conteudo)} min de leitura</span>
                <span className={styles.cardFotoTitulo}>{pagina.titulo}</span>
                <span className={styles.cardFotoTexto}>{trecho(pagina.conteudo, 90)}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

// Leitura de uma página — coluna única focada, sem lista de outras páginas
// ao lado (mesma decisão do detalhe de Prática, ver PainelPratica.tsx).
// Pra ler outra página, volta pro acervo (TelaSelecao).
function TelaDetalhe({
  paginaAtiva,
  jaGuardada,
  mostrarCtaConectar,
  momentoAtivo,
}: {
  paginaAtiva: ItemPagina;
  jaGuardada: boolean;
  mostrarCtaConectar: boolean;
  momentoAtivo: MomentoVida | null;
}) {
  const paragrafos = paginaAtiva.conteudo.split(/\n{2,}/).filter(Boolean);
  const voltarHref = momentoAtivo ? `/livro-vivo?momento=${momentoAtivo}` : "/livro-vivo";

  return (
    <main className={styles.detalheScene}>
      <a className={styles.voltarFlutuante} href={voltarHref} aria-label="Voltar para o Livro Vivo">
        <IconeSetaEsquerda />
      </a>
      <div className={styles.detalheConteudo}>
        <p className={styles.detalheMeta}>{minutosDeLeitura(paginaAtiva.conteudo)} min de leitura</p>
        <h1 className={styles.tituloLeitura}>{paginaAtiva.titulo}</h1>
        <div className={styles.corpo}>
          {paragrafos.map((paragrafo, i) => (
            <p key={i} className={styles.paragrafo}>
              {paragrafo}
            </p>
          ))}
        </div>
        {paginaAtiva.profissionalAutorId && paginaAtiva.profissionalAutor && (
          <AutoriaBiblioteca
            profissionalId={paginaAtiva.profissionalAutorId}
            nome={paginaAtiva.profissionalAutor.nome}
            tipo={paginaAtiva.profissionalAutor.tipo ?? "Outra"}
            formaDeTrabalho={paginaAtiva.profissionalAutor.formaDeTrabalho}
            mostrarCta={mostrarCtaConectar}
          />
        )}
        <div className={styles.rodape}>
          {jaGuardada ? (
            <span className={styles.guardado}>Guardado no seu diário ✓</span>
          ) : (
            <form action={guardarLeitura.bind(null, paginaAtiva.id)}>
              <button className={styles.guardar} type="submit">
                Guardar esta leitura
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export function PainelLeitura({
  nome = "",
  paginas = [],
  paginaAtiva,
  jaGuardada,
  mostrarCtaConectar,
  momentoAtivo = null,
}: Props) {
  if (!paginaAtiva) {
    return <TelaSelecao nome={nome} paginas={paginas} momentoAtivo={momentoAtivo} />;
  }
  return (
    <TelaDetalhe
      paginaAtiva={paginaAtiva}
      jaGuardada={jaGuardada}
      mostrarCtaConectar={mostrarCtaConectar}
      momentoAtivo={momentoAtivo}
    />
  );
}
