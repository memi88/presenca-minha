import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { aprovar, recusar, tirarDoAr } from "./actions";
import styles from "./page.module.css";

type ItemBiblioteca = {
  id: string;
  tipo: string;
  titulo: string | null;
  conteudo: string;
  escopo: string;
  autor: string | null;
  profissionais: { nome: string } | null;
};

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

function nomeAutor(item: ItemBiblioteca): string {
  return item.profissionais?.nome ?? item.autor ?? "—";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/home");

  const params = await searchParams;
  const status: StatusFiltro = params.status === "publicado" ? "publicado" : "pendente";
  const tipo: TipoFiltro =
    params.tipo === "pagina_livro_vivo" || params.tipo === "pratica" ? params.tipo : "todos";
  const page = Math.max(1, Number(params.page) || 1);
  const inicio = (page - 1) * POR_PAGINA;
  const fim = inicio + POR_PAGINA - 1;

  let query = supabase
    .from("biblioteca")
    .select("id, tipo, titulo, conteudo, escopo, autor, profissionais:profissional_autor_id(nome)", {
      count: "exact",
    });
  query = status === "pendente" ? query.eq("status_moderacao", "pendente") : query.eq("publicado", true);
  if (tipo !== "todos") query = query.eq("tipo", tipo);
  query = query.order("created_at", { ascending: status === "pendente" }).range(inicio, fim);

  const { data: itens, count } = await query.returns<ItemBiblioteca[]>();
  const totalPaginas = Math.max(1, Math.ceil((count ?? 0) / POR_PAGINA));

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
        {count ?? 0} {count === 1 ? "item" : "itens"}
      </p>

      {!itens?.length && <p className={styles.vazio}>Nada por aqui com esse filtro.</p>}

      {itens?.map((item) => (
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
            {status === "pendente" ? (
              <>
                <form action={aprovar.bind(null, item.id)}>
                  <button className={styles.aprovar} type="submit">
                    aprovar
                  </button>
                </form>
                <form className={styles.recusarForm} action={recusar.bind(null, item.id)}>
                  <input className={styles.motivoInput} type="text" name="motivo" placeholder="motivo (opcional)" />
                  <button className={styles.recusar} type="submit">
                    recusar
                  </button>
                </form>
              </>
            ) : (
              <form action={tirarDoAr.bind(null, item.id)}>
                <button className={styles.recusar} type="submit">
                  tirar do ar
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
              ← anterior
            </a>
          ) : (
            <span className={styles.paginaLinkDesabilitado}>← anterior</span>
          )}
          <span className={styles.paginaAtual}>
            {page} de {totalPaginas}
          </span>
          {page < totalPaginas ? (
            <a className={styles.paginaLink} href={linkFiltro({ status, tipo, page: page + 1 })}>
              próxima →
            </a>
          ) : (
            <span className={styles.paginaLinkDesabilitado}>próxima →</span>
          )}
        </div>
      )}
    </main>
  );
}
