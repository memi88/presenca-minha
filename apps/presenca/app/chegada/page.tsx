import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PageHeader } from "../PageHeader";
import { NascimentoForm } from "../perfil/nascimento/NascimentoForm";
import { pularNascimentoCadastro, salvarNascimentoCadastro, salvarNome } from "./actions";
import modalStyles from "./ModalNascimento.module.css";
import styles from "./page.module.css";

export default async function Chegada() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, data_nascimento, nascimento_pulado_no_cadastro_em")
    .eq("id", user.id)
    .maybeSingle();

  // Etapa de nascimento já resolvida (informou ou pulou) — não volta pra
  // esse fluxo à toa.
  if (profile?.nome && (profile.data_nascimento || profile.nascimento_pulado_no_cadastro_em)) {
    redirect("/home");
  }

  // Etapa 2: nome já salvo, falta só decidir sobre o nascimento. Modal
  // sobreposto ao mesmo pano de fundo da etapa 1, agora com o nome dela.
  // Header igual ao de qualquer outra tela — sem ele, quem cai aqui não
  // tinha como sair além de salvar ou pular (bug relatado depois do teste
  // do modal: "não consigo mais retornar"). z-index maior que o backdrop
  // pra ficar clicável por cima do overlay escurecido.
  if (profile?.nome) {
    return (
      <main className={styles.scene}>
        <div className={modalStyles.headerAcimaDoModal}>
          <PageHeader nome={profile.nome} voltar={{ href: "/home", label: "‹" }} />
        </div>
        <div className={styles.content}>
          <p className={styles.eyebrow}>criar espaço</p>
          <h1 className={styles.headline}>Prontinho, {profile.nome}.</h1>
        </div>
        <div className={modalStyles.backdrop}>
          <div className={modalStyles.dialogo} role="dialog" aria-modal="true" aria-labelledby="titulo-nascimento">
            <p className={styles.eyebrow}>quer uma experiência melhor?</p>
            <h1 id="titulo-nascimento" className={styles.headline}>
              Esses dados ajudam a calibrar{" "}
              <br className={styles.quebra} />
              como esse espaço te acompanha.
            </h1>
            <NascimentoForm
              data={null}
              hora={null}
              local={null}
              latitude={null}
              longitude={null}
              action={salvarNascimentoCadastro}
              textoBotao="salvar e continuar"
            />
            <form action={pularNascimentoCadastro}>
              <button type="submit" className={modalStyles.pular}>
                pular por enquanto
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // Etapa 1: como a pessoa quer ser chamada.
  return (
    <main className={styles.scene}>
      <PageHeader voltar={{ href: "/bem-vindo", label: "‹" }} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>criar espaço</p>
        <h1 className={styles.headline}>
          Que bom ter{" "}
          <br className={styles.quebra} />
          você aqui.
        </h1>
        <p className={styles.subtext}>Como você gostaria de ser chamado?</p>
        <form action={salvarNome}>
          <input
            className={styles.input}
            type="text"
            name="nome"
            placeholder="seu nome ou apelido"
            autoComplete="given-name"
            required
          />
          <button className={styles.cta} type="submit">
            começar
          </button>
        </form>
        <p className={styles.disclaimer}>
          Ao entrar, você concorda com nossos{" "}
          <br className={styles.quebra} /> <a href="/limites-de-cuidado">limites de cuidado</a>.
        </p>
      </div>
    </main>
  );
}
