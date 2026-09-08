import { redirect } from "next/navigation";

import { desc, eq } from "drizzle-orm";
import { biblioteca, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { ordenarPorMomento, tagDoMomento } from "@/lib/menuHome";
import { MOMENTOS_VIDA, momentoValido } from "@/lib/momentosVida";

import { PageHeader } from "../PageHeader";
import { PainelLeitura } from "./PainelLeitura";
import styles from "./PainelLeitura.module.css";

export default async function LivroVivo({
  searchParams,
}: {
  searchParams: Promise<{ momento?: string }>;
}) {
  const { momento } = await searchParams;
  const momentoAtivo = momentoValido(momento);

  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const [profile, paginas] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.userId, sessao.user.id),
      columns: { nome: true, presencaHoje: true, profissionalId: true },
    }),
    db.query.biblioteca.findMany({
      where: eq(biblioteca.tipo, "pagina_livro_vivo"),
      orderBy: desc(biblioteca.createdAt),
      columns: { id: true, titulo: true, conteudo: true, tagsMomentoVida: true },
    }),
  ]);
  if (!profile?.nome) redirect("/chegada");

  // Filtro clicável por momento (docs/redesign/acervo_do_livro_vivo_atmosfera_quarto)
  // — esconde de verdade quem não tem a tag, diferente da ordenação por
  // momento do dia logo abaixo (Fase 7), que nunca esconde, só prioriza.
  const paginasFiltradas = momentoAtivo
    ? paginas.filter((p) => p.tagsMomentoVida?.includes(momentoAtivo))
    : paginas;

  // Ordenação por momento do dia (Fase 7): nunca esconde conteúdo, só
  // prioriza o que combina com o momento de hoje — o resto continua
  // visível depois. Com uma tag pra combinar, isso só faz diferença
  // quando a biblioteca tiver itens curados com `tagsMomentoVida`
  // preenchido (scripts/cadastrar-biblioteca.mjs).
  const tag = tagDoMomento(profile.presencaHoje);
  const paginasOrdenadas = ordenarPorMomento(paginasFiltradas, tag);

  if (!paginasOrdenadas.length) {
    return (
      <main className={styles.scene}>
        <PageHeader titulo="Livro Vivo" nome={profile.nome} atual="livro" voltar={{ href: "/home" }} />
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
          <p className={styles.vazio}>
            {momentoAtivo ? "Nenhuma página nesse momento ainda." : "Nenhuma página publicada ainda."}
          </p>
        </div>
      </main>
    );
  }

  // A rota de lista nunca pré-seleciona uma leitura — só /livro-vivo/[id]
  // (navegação explícita) mostra conteúdo de verdade no painel direito.
  return (
    <PainelLeitura
      nome={profile.nome}
      paginas={paginasOrdenadas}
      paginaAtiva={null}
      jaGuardada={false}
      mostrarCtaConectar={!profile.profissionalId}
      momentoAtivo={momentoAtivo}
    />
  );
}
