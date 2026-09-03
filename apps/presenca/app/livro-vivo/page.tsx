import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { ordenarPorMomento, tagDoMomento } from "@/lib/menuHome";

import { IntroEspaco } from "../IntroEspaco";
import { PageHeader } from "../PageHeader";
import { PainelLeitura } from "./PainelLeitura";
import styles from "./PainelLeitura.module.css";

export default async function LivroVivo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile }, { data: paginas }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nome, presenca_hoje, intro_livro_vivo_vista_em, profissional_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("biblioteca")
      .select("id, titulo, conteudo, tags_momento_vida")
      .eq("tipo", "pagina_livro_vivo")
      .order("created_at", { ascending: false }),
    // Sinal pro "continue de onde você parou" da Home (lib/menuHome.ts).
    supabase.from("profiles").update({ ultimo_destino: "livro_vivo" }).eq("id", user.id),
  ]);
  if (!profile?.nome) redirect("/chegada");

  const primeiraEntrada = !profile.intro_livro_vivo_vista_em;
  if (primeiraEntrada) {
    await supabase
      .from("profiles")
      .update({ intro_livro_vivo_vista_em: new Date().toISOString() })
      .eq("id", user.id);
  }

  // Filtro por tag (Fase 7): nunca esconde conteúdo, só prioriza o que
  // combina com o momento de hoje — o resto continua visível depois. Com
  // uma tag pra combinar, isso só faz diferença quando a biblioteca tiver
  // itens curados com `tags_momento_vida` preenchido (scripts/cadastrar-biblioteca.mjs).
  const tag = tagDoMomento(profile.presenca_hoje);
  const paginasOrdenadas = ordenarPorMomento(paginas ?? [], tag);

  if (!paginasOrdenadas.length) {
    return (
      <main className={styles.scene}>
        <PageHeader nome={profile.nome} atual="livro" voltar={{ href: "/home", label: "← voltar" }} />
        <div className={styles.duasColunas}>
          <div className={styles.painelLista}>
            <IntroEspaco espaco="livroVivo" expandidaInicialmente={primeiraEntrada} />
            <p className={styles.eyebrow}>Livro Vivo</p>
            <h1 className={styles.titulo}>
              Leituras para{" "}
              <br className={styles.quebra} />
              atravessar o dia.
            </h1>
            <p className={styles.vazio}>Nenhuma página publicada ainda.</p>
          </div>
        </div>
      </main>
    );
  }

  // A rota de lista nunca pré-seleciona uma leitura — só /livro-vivo/[id]
  // (navegação explícita) mostra conteúdo de verdade no painel direito.
  return (
    <PainelLeitura
      variante="lista"
      nome={profile.nome}
      paginas={paginasOrdenadas}
      paginaAtiva={null}
      jaGuardada={false}
      introExpandidaInicialmente={primeiraEntrada}
      mostrarCtaConectar={!profile.profissional_id}
    />
  );
}
