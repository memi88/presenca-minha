import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { PageHeader } from "../PageHeader";
import { NascimentoForm } from "../perfil/nascimento/NascimentoForm";
import { pularNascimentoCadastro, salvarNascimentoCadastro } from "./actions";
import { CadastroForm } from "./CadastroForm";
import modalStyles from "./ModalNascimento.module.css";
import styles from "./page.module.css";

export default async function Chegada() {
  const sessao = await getSessao();

  // Sem sessão nenhuma ainda (visita nova) cai direto na etapa 1 abaixo —
  // a conta anônima só é criada quando o formulário de apelido/e-mail/
  // senha for enviado (ver actions.ts:cadastrar), não antes.
  const profile = sessao
    ? await (await getDb()).query.profiles.findFirst({
        where: eq(profiles.userId, sessao.user.id),
        columns: { nome: true, dataNascimento: true, nascimentoPuladoNoCadastroEm: true },
      })
    : undefined;

  // Etapa de nascimento já resolvida (informou ou pulou) — não volta pra
  // esse fluxo à toa.
  if (profile?.nome && (profile.dataNascimento || profile.nascimentoPuladoNoCadastroEm)) {
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
          <PageHeader titulo="Chegada" nome={profile.nome} voltar={{ href: "/home" }} />
        </div>
        <div className={styles.content}>
          <p className={styles.eyebrow}>criar espaço</p>
          <h2 className={styles.headline}>Prontinho, {profile.nome}.</h2>
        </div>
        <div className={modalStyles.overlay}>
          <div className={modalStyles.sheet} role="dialog" aria-modal="true" aria-labelledby="titulo-nascimento">
            <form action={pularNascimentoCadastro}>
              <button type="submit" className={modalStyles.fechar} aria-label="Pular por enquanto">
                ×
              </button>
            </form>
            <p className={modalStyles.eyebrow}>Quer uma experiência melhor?</p>
            <h1 id="titulo-nascimento" className={modalStyles.headline}>
              Esses dados ajudam a calibrar como esse espaço te acompanha.
            </h1>
            <NascimentoForm
              data={null}
              hora={null}
              local={null}
              latitude={null}
              longitude={null}
              action={salvarNascimentoCadastro}
              textoBotao="Salvar e continuar"
            />
            <form action={pularNascimentoCadastro}>
              <button type="submit" className={modalStyles.pular}>
                Pular por enquanto
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
      <PageHeader titulo="Chegada" voltar={{ href: "/bem-vindo" }} />
      <div className={styles.content}>
        <h2 className={styles.headline}>
          Como quer ser{" "}
          <br className={styles.quebra} />
          chamado?
        </h2>
        <p className={styles.subtext}>Um espaço reservado para suas reflexões.</p>
        <CadastroForm />
      </div>
    </main>
  );
}
