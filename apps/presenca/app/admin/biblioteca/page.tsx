import { redirect } from "next/navigation";

import { and, asc, count, desc, eq } from "drizzle-orm";
import { admins, biblioteca } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { aprovar, recusar, tirarDoAr } from "./actions";
import styles from "./page.module.css";

const ROTULO_TIPO: Record<string, string> = {
  pagina_livro_vivo: "página do Livro Vivo",
  pratica: "prática",
};

const ROTULO_ESCOPO: Record<string, string> = {
  publico: "público",
  privado_profissional: "só pacientes do autor",
};

const POR_PAGINA = 10;

type StatusFiltro = "pendente" | "publicado";
type TipoFiltro = "todos" | "pagina_livro_vivo" | "pratica";

function nomeAutor(item: { profissionalAutor: { nome: string } | null; autor: string | null }): string {
  return item.profissionalAutor?.nome ?? item.autor ?? "—";
}

function linkFiltro(params: { status: StatusFiltro; tipo: TipoFiltro; page: number }): string {
  const query = new URLSearchParams({ status: params.status, tipo: params.tipo, page: String(params.page) });
  return `/admin/biblioteca?${query.toString()}`;
}

export default async function AdminBiblioteca({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tipo?: string; page?: string }>;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const db = await getDb();
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, sessao.user.id) });
  if (!admin) redirect("/home");

  const params = await searchParams;
  const status: StatusFiltro = params.status === "publicado" ? "publicado" : "pendente";
  const tipo: TipoFiltro =
    params.tipo === "pagina_livro_vivo" || params.tipo === "pratica" ? params.tipo : "todos";
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * POR_PAGINA;

  const condicao = and(
    status === "pendente" ? eq(biblioteca.statusModeracao, "pendente") : eq(biblioteca.publicado, true),
    tipo !== "todos" ? eq(biblioteca.tipo, tipo) : undefined,
  );

  const [itens, contagem] = await Promise.all([
    db.query.biblioteca.findMany({
      where: condicao,
      orderBy: status === "pendente" ? asc(biblioteca.createdAt) : desc(biblioteca.createdAt),
      limit: POR_PAGINA,
      offset,
      columns: { id: true, tipo: true, titulo: true, conteudo: true, escopo: true, autor: true },
      with: { profissionalAutor: { columns: { nome: true } } },
    }),
    db.select({ total: count() }).from(biblioteca).where(condicao),
  ]);
  const total = contagem[0]?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <main className={styles.scene}>
      <p className={styles.eyebrow}>admin</p>
      <h1 className={styles.headline}>Biblioteca</h1>

      <div className={styles.filtros}>
        <div className={styles.filtroGrupo}>
          <a
            className={`${styles.filtroPill} ${status === "pendente" ? styles.filtroPillAtivo : ""}`}
            href={linkFiltro({ status: "pendente", tipo, page: 1 })}
          >
            pendentes
          </a>
          <a
            className={`${styles.filtroPill} ${status === "publicado" ? styles.filtroPillAtivo : ""}`}
            href={linkFiltro({ status: "publicado", tipo, page: 1 })}
          >
            publicados
          </a>
        </div>
        <div className={styles.filtroGrupo}>
          <a
            className={`${styles.filtroPill} ${tipo === "todos" ? styles.filtroPillAtivo : ""}`}
            href={linkFiltro({ status, tipo: "todos", page: 1 })}
          >
            todos
          </a>
          <a
            className={`${styles.filtroPill} ${tipo === "pagina_livro_vivo" ? styles.filtroPillAtivo : ""}`}
            href={linkFiltro({ status, tipo: "pagina_livro_vivo", page: 1 })}
          >
            Livro Vivo
          </a>
          <a
            className={`${styles.filtroPill} ${tipo === "pratica" ? styles.filtroPillAtivo : ""}`}
            href={linkFiltro({ status, tipo: "pratica", page: 1 })}
          >
            práticas
          </a>
        </div>
      </div>

      <p className={styles.contagem}>
        {total} {total === 1 ? "item" : "itens"}
      </p>

      {!itens.length && <p className={styles.vazio}>Nada por aqui com esse filtro.</p>}

      {itens.map((item) => (
        <div key={item.id} className={styles.item}>
          <div className={styles.itemTopo}>
            <span className={styles.itemTitulo}>{item.titulo}</span>
            <span className={styles.itemMeta}>
              {ROTULO_TIPO[item.tipo] ?? item.tipo} · {ROTULO_ESCOPO[item.escopo] ?? item.escopo} · por{" "}
              {nomeAutor(item)}
            </span>
          </div>
          {status === "pendente" && (
            <p className={styles.itemConteudo}>
              {item.conteudo.length > 300 ? `${item.conteudo.slice(0, 300)}…` : item.conteudo}
            </p>
          )}
          <div className={styles.acoes}>
            <a className={styles.editar} href={`/admin/biblioteca/${item.id}/editar`}>
              Editar
            </a>
            {status === "pendente" ? (
              <>
                <form action={aprovar.bind(null, item.id)}>
                  <button className={styles.aprovar} type="submit">
                    Aprovar
                  </button>
                </form>
                <form className={styles.recusarForm} action={recusar.bind(null, item.id)}>
                  <input className={styles.motivoInput} type="text" name="motivo" placeholder="Motivo (opcional)" />
                  <button className={styles.recusar} type="submit">
                    Recusar
                  </button>
                </form>
              </>
            ) : (
              <form action={tirarDoAr.bind(null, item.id)}>
                <button className={styles.recusar} type="submit">
                  Tirar do ar
                </button>
              </form>
            )}
          </div>
        </div>
      ))}

      {totalPaginas > 1 && (
        <div className={styles.paginacao}>
          {page > 1 ? (
            <a className={styles.paginaLink} href={linkFiltro({ status, tipo, page: page - 1 })}>
              ← Anterior
            </a>
          ) : (
            <span className={styles.paginaLinkDesabilitado}>← Anterior</span>
          )}
          <span className={styles.paginaAtual}>
            {page} de {totalPaginas}
          </span>
          {page < totalPaginas ? (
            <a className={styles.paginaLink} href={linkFiltro({ status, tipo, page: page + 1 })}>
              Próxima →
            </a>
          ) : (
            <span className={styles.paginaLinkDesabilitado}>Próxima →</span>
          )}
        </div>
      )}
    </main>
  );
}
