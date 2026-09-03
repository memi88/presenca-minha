import { notFound, redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PLACEHOLDER_LIVRO_VIVO, PLACEHOLDER_PRATICA, PLACEHOLDER_TERAPEUTA } from "@/lib/placeholders";

import { PageHeader } from "../../PageHeader";
import styles from "./page.module.css";

// Página do Autor (docs/redesign/p_gina_do_autor_alice_guimar_es) — só pra
// profissionais com conta, alcançada a partir de "ver perfil de X" em
// AutoriaBiblioteca.tsx. RLS: profissionais.select exige que este
// profissional tenha ao menos um item público publicado (migration
// profissionais_leitura_publica) — sem isso, `notFound()` mais embaixo.
export default async function Autor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  const [{ data: profissional }, { data: obras }] = await Promise.all([
    supabase.from("profissionais").select("id, nome, tipo, forma_de_trabalho").eq("id", id).maybeSingle(),
    supabase
      .from("biblioteca")
      .select("id, tipo, titulo")
      .eq("profissional_autor_id", id)
      .eq("publicado", true)
      .eq("escopo", "publico")
      .order("created_at", { ascending: false }),
  ]);

  if (!profissional) notFound();

  const descricao =
    profissional.tipo === "Outra" ? (profissional.forma_de_trabalho ?? profissional.tipo) : profissional.tipo;

  return (
    <main className={styles.scene}>
      <PageHeader nome={profile.nome} atual={null} voltar={{ href: "/livro-vivo", label: "← voltar" }} />
      <div className={styles.content}>
        <div
          className={styles.avatar}
          style={{ backgroundImage: `url(${PLACEHOLDER_TERAPEUTA})` }}
          aria-hidden="true"
        />
        <p className={styles.eyebrow}>perfil do autor</p>
        <h1 className={styles.nome}>{profissional.nome}</h1>
        <p className={styles.descricao}>{descricao}</p>

        {obras && obras.length > 0 && (
          <section className={styles.obras}>
            <p className={styles.obrasRotulo}>Mais de {profissional.nome}</p>
            <div className={styles.grade}>
              {obras.map((obra) => {
                const ehPratica = obra.tipo === "pratica";
                return (
                  <a
                    key={obra.id}
                    href={ehPratica ? `/praticas/${obra.id}` : `/livro-vivo/${obra.id}`}
                    className={styles.card}
                    style={{ backgroundImage: `url(${ehPratica ? PLACEHOLDER_PRATICA : PLACEHOLDER_LIVRO_VIVO})` }}
                  >
                    <div className={styles.cardOverlay}>
                      <span className={styles.cardTipo}>{ehPratica ? "Prática" : "Livro Vivo"}</span>
                      <span className={styles.cardTitulo}>{obra.titulo}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
