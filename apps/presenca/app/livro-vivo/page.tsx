import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import styles from "./page.module.css";

const PALAVRAS_POR_MINUTO = 200;

function minutosDeLeitura(conteudo: string): number {
  const palavras = conteudo.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO));
}

// O check-in "como está sua presença hoje?" (Fase 6) já é o próprio nome da
// tag — mapeamento direto, sem vocabulário novo pra curadoria decorar.
// "nao_sei" não filtra nada (resposta neutra, sem sinal de momento).
function tagDoMomento(presencaHoje: string | null): string | null {
  if (!presencaHoje || presencaHoje === "nao_sei") return null;
  return presencaHoje;
}

export default async function LivroVivo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile }, { data: paginas }] = await Promise.all([
    supabase.from("profiles").select("presenca_hoje").eq("id", user.id).maybeSingle(),
    supabase
      .from("biblioteca")
      .select("id, titulo, conteudo, tags_momento_vida")
      .eq("tipo", "pagina_livro_vivo")
      .order("created_at", { ascending: false }),
    // Sinal pro "continue de onde você parou" da Home (lib/menuHome.ts).
    supabase.from("profiles").update({ ultimo_destino: "livro_vivo" }).eq("id", user.id),
  ]);

  // Filtro por tag (Fase 7): nunca esconde conteúdo, só prioriza o que
  // combina com o momento de hoje — o resto continua visível depois. Com
  // uma tag pra combinar, isso só faz diferença quando a biblioteca tiver
  // itens curados com `tags_momento_vida` preenchido (scripts/cadastrar-biblioteca.mjs).
  const tag = tagDoMomento(profile?.presenca_hoje ?? null);
  const paginasOrdenadas = tag
    ? [...(paginas ?? [])].sort((a, b) => {
        const aCombina = a.tags_momento_vida?.includes(tag) ? 1 : 0;
        const bCombina = b.tags_momento_vida?.includes(tag) ? 1 : 0;
        return bCombina - aCombina;
      })
    : paginas;

  return (
    <main className={styles.scene}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>livro vivo</p>
        <h1 className={styles.titulo}>
          Leituras para
          <br className={styles.quebra} />
          atravessar o dia.
        </h1>
        <a className={styles.voltar} href="/home">
          ← voltar
        </a>
      </div>

      <div className={styles.lista}>
        {!paginasOrdenadas?.length && <p className={styles.vazio}>Nenhuma página publicada ainda.</p>}
        {paginasOrdenadas?.map((pagina) => (
          <a key={pagina.id} className={styles.item} href={`/livro-vivo/${pagina.id}`}>
            <div className={styles.itemTitulo}>{pagina.titulo}</div>
            <div className={styles.itemMeta}>{minutosDeLeitura(pagina.conteudo)} min de leitura</div>
          </a>
        ))}
      </div>
    </main>
  );
}
